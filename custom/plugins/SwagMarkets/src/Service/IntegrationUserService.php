<?php declare(strict_types=1);

namespace Swag\Markets\Service;

use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\GuzzleException;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Api\Util\AccessKeyHelper;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\System\Integration\IntegrationEntity;
use Swag\Markets\Entity\Config\SwagMarketsConfigurationEntity;
use Symfony\Component\DependencyInjection\ParameterBag\ContainerBagInterface;

/**
 * Class IntegrationUserService
 */
class IntegrationUserService
{
    private string                    $accessKey;
    private string                    $secretKey;
    private ContainerBagInterface     $params;
    private EntityRepositoryInterface $configRepository;
    private EntityRepositoryInterface $integrationRepository;
    private Context                   $context;
    private Client                    $client;


    /**
     * IntegrationUserService constructor.
     * @param EntityRepositoryInterface $configRepository
     * @param EntityRepositoryInterface $integrationRepository
     * @param ContainerBagInterface $params
     */
    public function __construct(
        EntityRepositoryInterface $configRepository,
        EntityRepositoryInterface $integrationRepository,
        ContainerBagInterface $params
    ) {
        $this->params = $params;
        $this->configRepository = $configRepository;
        $this->integrationRepository = $integrationRepository;

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
     * @throws GuzzleException
     */
    public function repairIntegrationUser(Context $context)
    {
        $this->context = $context;

        $this->accessKey = $this->loadOrCreateIntegrationUserId();
        $this->secretKey = $this->generateNewSecretKey();

        $this->updateIntegrationUser();
        $this->upsertShopwareIntegrationUser(
            $this->shopwareIntegrationUserExists()
        );
        $this->deleteOldBusinessPlatformUser();
        $this->recreateBusinessPlatformUserAndUpdateSwagMarketsConfigurations();
        $this->updateIntegrationUserInBfClientViaBusinessPlatform();
    }

    /**
     * @return string
     */
    private function loadOrCreateIntegrationUserId(): string
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('configurationKey', 'integration_user'));

        /** @var SwagMarketsConfigurationEntity|null $integrationUserEntry */
        $integrationUserEntry = $this->configRepository->search($criteria, $this->context)->first();

        if (
            $integrationUserEntry === null ||
            isset($integrationUserEntry->getConfigurationValue()['access_key']) === false ||
            strlen($integrationUserEntry->getConfigurationValue()['access_key']) <= 0
        ) {
            // no integration user found, create new id
            return AccessKeyHelper::generateAccessKey('integration');
        }

        return $integrationUserEntry->getConfigurationValue()['access_key'];
    }

    /**
     * @return string
     */
    private function generateNewSecretKey(): string
    {
        return AccessKeyHelper::generateSecretAccessKey();
    }

    /**
     *
     */
    private function updateIntegrationUser(): void
    {
        $id = $this->getBfIntegrationUserUuid();

        $data = [
            'configurationKey' => 'integration_user',
            'configurationValue' => [
                'access_key' => $this->getAccessKey(),
                'secret_access_key' => $this->getSecretKey(),
            ],
            'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
            'updated_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
        ];

        if ($id !== null) {
            $data['id'] = $id;
        }

        $this->configRepository->upsert([$data], $this->context);
    }

    /**
     * @return string|null
     */
    private function getBfIntegrationUserUuid(): ?string
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('configurationKey', 'integration_user'));

        /** @var SwagMarketsConfigurationEntity|null $integrationUserEntry */
        $integrationUserEntry = $this->configRepository->search($criteria, $this->context)->first();

        if ($integrationUserEntry !== null) {
            return $integrationUserEntry->getId();
        }

        return null;
    }

    /**
     * @return string
     */
    public function getAccessKey(): string
    {
        return $this->accessKey;
    }

    /**
     * @return string
     */
    public function getSecretKey(): string
    {
        return $this->secretKey;
    }

    /**
     * @param bool $updateExisting
     */
    private function upsertShopwareIntegrationUser(bool $updateExisting = false)
    {
        $data = [
            'label' => 'SwagMarkets',
            'accessKey' => $this->getAccessKey(),
            'secretAccessKey' => $this->getSecretKey(),
            'writeAccess' => true,
            'admin' => true,
            'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
        ];

        if ($updateExisting) {
            $data['id'] = $this->getShopwareIntegrationUserEntityId();
            $data['updated_at'] = date(Defaults::STORAGE_DATE_TIME_FORMAT);
        }

        $this->integrationRepository->upsert([$data], $this->context);
    }

    /**
     * @return string|null
     */
    private function getShopwareIntegrationUserEntityId(): ?string
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('accessKey', $this->getAccessKey()));

        /** @var IntegrationEntity $integrationUser
         */
        $integrationUser = $this->integrationRepository->search($criteria, $this->context)->first();

        if ($integrationUser !== null) {
            return $integrationUser->getId();
        }

        return null;
    }

    /**
     * @return bool
     */
    private function shopwareIntegrationUserExists(): bool
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('accessKey', $this->getAccessKey()));

        return $this->integrationRepository->search($criteria, $this->context)->first() !== null;
    }

    /**
     * @throws GuzzleException
     * @throws Exception
     */
    private function deleteOldBusinessPlatformUser(): void
    {
        $businessPlatformUserId = str_replace('-', '', $this->loadCurrentBusinessPlatformConfigurationData()['id']);

        try {
            $response = $this->client->delete('/admin/users/' . $businessPlatformUserId, []);

            if ($response->getStatusCode() < 200 || $response->getStatusCode() > 299) {
                throw new Exception('Old integration user could not be deleted!');
            }
        } catch (ClientException $exception) {
            // an exception of 404 means the integration user entry does (no longer) exist - this is fine
            // otherwise throw the exception up
            if ($exception->getResponse()->getStatusCode() !== 404) {
                throw $exception;
            }
        }
    }

    /**
     * @return array
     */
    private function loadCurrentBusinessPlatformConfigurationData(): array
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('configurationKey', 'swagMarkets_business_platform'));

        /** @var SwagMarketsConfigurationEntity|null $businessPlatformConfiguration */
        $businessPlatformConfiguration = $this->configRepository->search($criteria, $this->context)->first();

        if ($businessPlatformConfiguration === null) {
            return $this->getDefaultBusinessConfigurationValueData();
        }

        return $businessPlatformConfiguration->getConfigurationValue();
    }

    /**
     * @return array
     */
    private function getDefaultBusinessConfigurationValueData(): array
    {
        return [
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
        ];
    }

    /**
     * @throws GuzzleException
     */
    private function recreateBusinessPlatformUserAndUpdateSwagMarketsConfigurations()
    {
        $businessPlatformUserId = $this->createBusinessPlatformUserAndGetUserId();
        $this->createSwagMarketsBusinessPlatformConfigurationEntries($businessPlatformUserId);
    }

    /**
     * @return mixed
     * @throws GuzzleException
     */
    private function createBusinessPlatformUserAndGetUserId()
    {
        $response = $this->client->post(
            '/admin/users',
            [
                'json' => [
                    'user_name' => Uuid::randomHex(),
                    'key' => $this->getAccessKey(),
                    'secret_key' => $this->getSecretKey()
                ]
            ]
        );

        return json_decode($response->getBody()->getContents(), true)['data']['id'];
    }

    /**
     * @param string $businessPlatformUserId
     */
    private function createSwagMarketsBusinessPlatformConfigurationEntries(string $businessPlatformUserId): void
    {
        $businessPlatformConfiguration = $this->loadCurrentBusinessPlatformConfigurationData();
        $businessPlatformConfiguration['id'] = $businessPlatformUserId;

        $id = $this->getSwagMarketsBusinessPlatformConfigurationId();

        $data = [
            'configurationKey' => 'swagMarkets_business_platform',
            'configurationValue' => $businessPlatformConfiguration,
            'created_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT),
            'updated_at' => date(Defaults::STORAGE_DATE_TIME_FORMAT)
        ];

        if ($id !== null) {
            $data['id'] = $id;
        }

        $this->configRepository->upsert([$data], $this->context);
    }

    /**
     * @return string|null
     */
    private function getSwagMarketsBusinessPlatformConfigurationId(): ?string
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('configurationKey', 'swagMarkets_business_platform'));

        /** @var SwagMarketsConfigurationEntity $integrationUser */
        $businessPlatformConfiguration = $this->configRepository->search($criteria, $this->context)->first();

        if ($businessPlatformConfiguration !== null) {
            return $businessPlatformConfiguration->getId();
        }

        return null;
    }

    /**
     * @throws GuzzleException
     */
    private function updateIntegrationUserInBfClientViaBusinessPlatform()
    {
        $configuration = $this->loadCurrentBusinessPlatformConfigurationData();
        $shopId = $configuration['shop_id'];

        if (
            $shopId === null ||
            strlen($shopId) === 0 ||
            isset($configuration['swagMarkets_systems']['erp_systems']['base_configuration_is_set']) === false ||
            $configuration['swagMarkets_systems']['erp_systems']['base_configuration_is_set'] === false
        ) {
            throw new Exception('Configuration error - cannot replace the ERP configuration!');
        }


        $this->client->post(
            '/api/erpSystems/configurations',
            [
                'json' => [
                    'shopId' => $shopId,
                    'erpSystemsConfigurations' => [
                        'API_KEY' => $this->getAccessKey(),
                        'API_SECRET_KEY' => $this->getSecretKey()
                    ]
                ],
                'headers' => [
                    'Authorization' => $this->getBusinessPlatformApiBearerToken(),
                    'Content-Type' => 'application/json'
                ]
            ]
        );
    }

    /**
     * @return string
     * @throws GuzzleException
     */
    private function getBusinessPlatformApiBearerToken(): string
    {
        $response = $this->client->post(
            '/api/oauth/token',
            [
                'json' => [
                    'key' => $this->getAccessKey(),
                    'secret_key' => $this->getSecretKey()
                ]
            ]
        );

        return 'Bearer ' . json_decode($response->getBody()->getContents(), true)['token'];
    }
}
