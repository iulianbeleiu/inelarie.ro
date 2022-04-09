<?php

namespace Swag\Markets\Service;

use Exception;
use GuzzleHttp\Client;
use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\DefaultPayment;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Api\Util\AccessKeyHelper;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Uuid\Uuid;
use Swag\Markets\Entity\Config\SwagMarketsConfigurationEntity;
use Symfony\Component\DependencyInjection\ParameterBag\ContainerBagInterface;

class ActivationService
{
    /** @var string */
    const AMAZON_PAYMENT_METHOD_ID  = 'ea606c4e4752dd3edd06ee8641e5ef4a';
    const EBAY_PAYMENT_METHOD_ID = '05d8e3bdac2b4ed7939bf3f8bfd0b94d';

    /**
     * @var string
     */
    private $accessKey;

    /**
     * @var string
     */
    private $secretKey;

    /**
     * @var ContainerBagInterface $params
     */
    private $params;

    /**
     * @var SalesChannelTypeService $salesChannelTypeService
     */
    private $salesChannelTypeService;

    /**
     * @var EntityRepositoryInterface $configRepository
     */
    private $configRepository;

    /**
     * @var EntityRepositoryInterface $integrationRepository
     */
    private $integrationRepository;

    /**
     * @var EntityRepositoryInterface $marketplaceRepository
     */
    private $marketplaceRepository;

    /**
     * @var EntityRepositoryInterface $currencyRepository
     */
    private $currencyRepository;

    /**
     * @var EntityRepositoryInterface $countryRepository
     */
    private $countryRepository;

    /**
     * @var EntityRepositoryInterface $languageRepository
     */
    private $languageRepository;

    /**
     * @var EntityRepositoryInterface $paymentMethodRepository
     */
    private $paymentMethodRepository;

    /**
     * @var Client
     */
    private $client;

    /**
     * @var \Shopware\Core\Framework\Plugin\Context\ActivateContext
     */
    private $context;

    /**
     * ActivationService constructor.
     *
     * @param SalesChannelTypeService $salesChannelTypeService
     * @param EntityRepositoryInterface $configRepository
     * @param EntityRepositoryInterface $integrationRepository
     * @param EntityRepositoryInterface $marketplaceRepository
     * @param EntityRepositoryInterface $currencyRepository
     * @param EntityRepositoryInterface $countryRepository
     * @param EntityRepositoryInterface $languageRepository
     * @param EntityRepositoryInterface $paymentMethodRepository
     * @param ContainerBagInterface $params
     */
    public function __construct(
        SalesChannelTypeService $salesChannelTypeService,
        EntityRepositoryInterface $configRepository,
        EntityRepositoryInterface $integrationRepository,
        EntityRepositoryInterface $marketplaceRepository,
        EntityRepositoryInterface $currencyRepository,
        EntityRepositoryInterface $countryRepository,
        EntityRepositoryInterface $languageRepository,
        EntityRepositoryInterface $paymentMethodRepository,
        ContainerBagInterface $params
    ) {
        $this->params = $params;
        $this->salesChannelTypeService = $salesChannelTypeService;
        $this->configRepository = $configRepository;
        $this->integrationRepository = $integrationRepository;
        $this->marketplaceRepository = $marketplaceRepository;
        $this->countryRepository = $countryRepository;
        $this->currencyRepository = $currencyRepository;
        $this->languageRepository = $languageRepository;
        $this->paymentMethodRepository = $paymentMethodRepository;

        $this->client = new Client(
            [
                'base_uri' => $this->params->get('swagMarkets.host.production'),
                'headers' => [
                    'bf-access-key' => base64_decode($this->params->get('swagMarkets.headers')['bf-access-key']),
                    'bf-secret-access-key' => base64_decode($this->params->get('swagMarkets.headers')['bf-secret-key'])
                ],
                'verify' => true
            ]
        );
    }

    /**
     * @param \Shopware\Core\Framework\Plugin\Context\ActivateContext $activateContext
     */
    public function activate(ActivateContext $activateContext)
    {
        $this->context = $activateContext;
        if ($this->isFirstActivation()) {
            $this->runMigrations();

            $this->salesChannelTypeService->createAmazonSalesChannelType();
            $this->salesChannelTypeService->createEbaySalesChannelType();

            $this->generateKeys();
            $this->createIntegrationUser();
            $this->createShopwareIntegrationUser();
            $this->createBusinessPlatformUserAndSwagMarketsConfigurations();
            $this->createMarketplaces();
            $this->createDefaultMarketplaceConfigurations();
            $this->createPaymentMethods();
            $this->createSwagMarketsActivationState();
        }
    }

    /**
     * @return bool
     */
    private function isFirstActivation(): bool
    {
        $criteria = new Criteria();
        $criteria->addFilter((new EqualsFilter('configurationKey', 'swagMarkets_active_state')));

        /** @var SwagMarketsConfigurationEntity $configurationEntity */
        $configurationEntity = $this->configRepository->search($criteria, $this->context->getContext())->first();

        if ($configurationEntity !== null && $configurationEntity->getConfigurationValue()['active'] === true) {
            return false;
        }

        return true;
    }

    /**
     * If the plugin got deactivated, the tables also got deleted to ensure a clean state.
     * In order to ensure the tables exist for the remaining steps here, run them again.
     */
    private function runMigrations(): void
    {
        $this->context->setAutoMigrate(false);

        $migrationCollection = $this->context->getMigrationCollection();
        $migrationCollection->migrateInPlace(time());
    }

    /**
     *
     */
    private function generateKeys(): void
    {
        $this->accessKey = AccessKeyHelper::generateAccessKey('integration');
        $this->secretKey = AccessKeyHelper::generateSecretAccessKey();
    }

    /**
     *
     */
    private function createIntegrationUser()
    {
        $this->configRepository->upsert(
            [
                [
                    'configurationKey' => 'integration_user',
                    'configurationValue' => [
                        'access_key' => $this->getAccessKey(),
                        'secret_access_key' => $this->getSecretKey(),
                    ],
                    'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
                ]
            ],
            $this->context->getContext()
        );
    }

    /**
     * @return string
     */
    private function getAccessKey(): string
    {
        return $this->accessKey;
    }

    /**
     * @return string
     */
    private function getSecretKey(): string
    {
        return $this->secretKey;
    }

    /**
     *
     */
    private function createShopwareIntegrationUser()
    {
        $this->integrationRepository->upsert(
            [
                [
                    'label' => 'SwagMarkets',
                    'accessKey' => $this->getAccessKey(),
                    'secretAccessKey' => $this->getSecretKey(),
                    'writeAccess' => true,
                    'admin' => true,
                    'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),

                ]
            ],
            $this->context->getContext()
        );
    }

    private function createBusinessPlatformUserAndSwagMarketsConfigurations(): void
    {
        try {
            $response = $this->createBusinessPlatformUserAndGetUserData();
            $businessPlatformUserData = json_decode($response->getBody()->getContents(), true);
            $this->createSwagMarketsBusinessPlatformConfigurationEntries($businessPlatformUserData);
        } catch (Exception $e) {
            // TODO: Log the exception with logger
        }
    }

    /**
     * @return mixed
     */
    private function createBusinessPlatformUserAndGetUserData()
    {
        return $this->client->post(
            '/admin/users',
            [
                'json' => [
                    'user_name' => Uuid::randomHex(),
                    'key' => $this->getAccessKey(),
                    'secret_key' => $this->getSecretKey()
                ]
            ]
        );
    }

    /**
     * @param array $businessPlatformUserData
     */
    private function createSwagMarketsBusinessPlatformConfigurationEntries(array $businessPlatformUserData): void
    {
        $this->configRepository->upsert(
            [
                [
                    'configurationKey' => 'swagMarkets_business_platform',
                    'configurationValue' => [
                        'id' => $businessPlatformUserData['data']['id'],
                        'shop_id' => '',
                        'swagMarkets_systems' => [
                            'erp_systems' => [
                                'base_configuration_is_set' => false,
                                'languages_is_set' => false,
                                'currencies_is_set' => false
                            ],
                            'shops' => [
                                'amazon' => [
                                    'base_configuration_is_set' => false,
                                    'payment_methods_is_set' => false,
                                    'shipping_methods_is_set' => false,
                                    'shops_currencies_is_set' => false,
                                    'shops_languages_is_set' => false,
                                    'amazonFbaPrimeShippingMethods' => [
                                        'fba' => ['shippingMethodId' => null, 'code' => ''],
                                        'prime' => ['shippingMethodId' => null, 'code' => ''],
                                        'primeNextDay' => ['shippingMethodId' => null, 'code' => ''],
                                        'primeSecondDay' => ['shippingMethodId' => null, 'code' => '']
                                    ]
                                ],
                                'ebay' => [
                                    'base_configuration_is_set' => false,
                                    'payment_methods_is_set' => false,
                                    'shipping_methods_is_set' => false,
                                    'payment_methods_matching' => [],
                                    'shops_currencies_is_set' => false,
                                    'shops_languages_is_set' => false
                                ]
                            ]
                        ]
                    ],
                    'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
                ]
            ],
            $this->context->getContext()
        );
    }

    /**
     */
    public function createMarketplaces()
    {
        $data = file_exists(__DIR__ . '/Data/marketplaces.json')
            ? file_get_contents(__DIR__ . '/Data/marketplaces.json')
            : null;
        $marketplaces = json_decode($data);

        foreach ($marketplaces as $marketplace) {
            $country = $this->getCountryModel($marketplace->settings->country);
            $currency = $this->getCurrencyModel($marketplace->settings->currency);
            $language = $this->getLanguageModel($marketplace->settings->language);

            if ($country != null && $currency != null && $language != null) {
                $this->marketplaceRepository->upsert(
                    [
                        [
                            'name' => $marketplace->name,
                            'type' => $marketplace->type,
                            'marketplaceSettings' => [
                                [
                                    'countryId' => $country->getId(),
                                    'currencyId' => $currency->getId(),
                                    'languageId' => $language->getId()
                                ],
                            ],
                        ],
                    ],
                    $this->context->getContext()
                );

            }

            $countryId = null;
            $currencyId = null;
            $languageId = null;
        }
    }

    /**
     * @param string $code
     * @return string
     */
    private function getCountryModel(string $code)
    {
        try {
            return $this->countryRepository->search(
                (new Criteria())->addFilter(new EqualsFilter('iso', $code)),
                $this->context->getContext()
            )->first();
        } catch (Exception $e) {
            return $e->getMessage();
        }
    }

    /**
     * @param string $code
     * @return string
     */
    private function getCurrencyModel(string $code)
    {
        try {
            return $this->currencyRepository->search(
                (new Criteria())->addFilter(new EqualsFilter('isoCode', $code)),
                $this->context->getContext()
            )->first();
        } catch (Exception $e) {
            return $e->getMessage();
        }
    }

    /**
     * @param string $language
     * @return string
     */
    private function getLanguageModel(string $language)
    {
        try {
            return $this->languageRepository->search(
                (new Criteria())->addFilter(new EqualsFilter('name', $language)),
                $this->context->getContext()
            )->first();
        } catch (Exception $e) {
            return $e->getMessage();
        }
    }

    public function createDefaultMarketplaceConfigurations()
    {
        $this->configRepository->upsert(
            [
                [
                    'configurationKey' => 'ebay_configuration',
                    'configurationValue' => [
                        'product_migration_request' => false,
                        'is_connected' => false
                    ],
                    'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
                ],
                [
                    'configurationKey' => 'amazon_configuration',
                    'configurationValue' => [
                        'product_migration_request' => false,
                        'is_connected' => false
                    ],
                    'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
                ]
            ],
            $this->context->getContext()
        );
    }

    private function createPaymentMethods()
    {
        $this->paymentMethodRepository->upsert(
            [
                [
                    'id' => self::AMAZON_PAYMENT_METHOD_ID,
                    'handlerIdentifier' => DefaultPayment::class,
                    'name' => 'Shopware Markets - Amazon',
                    'description' => 'Shopware Markets - Amazon',
                    'active' => true,
                    'afterOrderEnabled' => false
                ]
            ],
            $this->context->getContext()
        );

        $this->paymentMethodRepository->upsert(
            [
                [
                    'id' => self::EBAY_PAYMENT_METHOD_ID,
                    'handlerIdentifier' => DefaultPayment::class,
                    'name' => 'Shopware Markets - Ebay',
                    'description' => 'Shopware Markets - Ebay',
                    'active' => true,
                    'afterOrderEnabled' => false
                ]
            ],
            $this->context->getContext()
        );
    }

    private function createSwagMarketsActivationState()
    {
        $this->configRepository->upsert(
            [
                [
                    'configurationKey' => 'swagMarkets_active_state',
                    'configurationValue' => [
                        'active' => true
                    ]
                ]
            ], $this->context->getContext()
        );
    }
}
