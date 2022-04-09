<?php
declare(strict_types=1);

namespace Swag\Markets\Controller\Api;


use GuzzleHttp\Exception\GuzzleException;
use InvalidArgumentException;
use Shopware\Core\Framework\Api\Context\AdminApiSource;
use Shopware\Core\Framework\Api\Context\Exception\InvalidContextSourceException;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Exception\InconsistentCriteriaIdsException;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Core\System\User\UserEntity;
use Swag\Markets\Service\ConfigService;
use Swag\Markets\Service\IntegrationUserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use function get_class;

/**
 * Class ConfigController
 * @package SwagMarkets\Controller\Api
 *
 * @RouteScope(scopes={"api"})
 * @Route(
 *     "api/swagMarkets/config",
 *     name="bf.config."
 * )
 */
class ConfigController extends AbstractController
{
    private $configService;

    /** @var EntityRepositoryInterface $userRepository */
    private $userRepository;

    /** @var string $apiVersion */
    private $apiVersion;

    /** @var SystemConfigService $systemConfigService */
    private $systemConfigService;

    /** @var EntityRepositoryInterface $configRepository */
    private $configRepository;

    /** @var IntegrationUserService $integrationUserService */
    private $integrationUserService;

    public function __construct(
        ConfigService $configService,
        SystemConfigService $systemConfigService,
        IntegrationUserService $integrationUserService,
        EntityRepositoryInterface $userRepository,
        EntityRepositoryInterface $configRepository,
        string $apiVersion
    ) {
        $this->configService = $configService;
        $this->systemConfigService = $systemConfigService;
        $this->integrationUserService = $integrationUserService;
        $this->userRepository = $userRepository;
        $this->configRepository = $configRepository;
        $this->apiVersion = $apiVersion;
    }

    /**
     * @Route("/load", name="get", methods={"GET"})
     * @return JsonResponse
     */
    public function getBySalesChannelId(): JsonResponse
    {
        try {
            return new JsonResponse(
                [
                    'success' => true,
                    'data' => $this->configService->getBySalesChannelId()
                ],
                200
            );
        } catch (Exception $e) {
            return new JsonResponse(
                [
                    'success' => false,
                    'data' => [
                        'error' => $e->getMessage()
                    ]
                ]
            );
        }
    }

    /**
     * @Route("/api-version", name="apiVersion", methods={"GET"})
     *
     * @return JsonResponse
     */
    public function getApiVersion(): JsonResponse
    {
        $apiVersion = '';

        if (defined('Shopware\Core\PlatformRequest::API_VERSION')) {
            $apiVersion = PlatformRequest::API_VERSION;
        }

        return new JsonResponse(['success' => true, 'data' => ['apiVersion' => $apiVersion]], 200);
    }

    /**
     * @Route("/user-information", name="get.sw.user.information", methods={"GET"})
     *
     * @param Context $context
     * @return JsonResponse
     * @throws InvalidContextSourceException
     */
    public function getSwUserInformation(Context $context): JsonResponse
    {
        $user = $this->getSwUserEntity($context);

        $userInformation = [
            'language' => $this->getUserLanguageCode($user),
            'shopwareVersion' => $this->apiVersion,
            'domain' => $this->systemConfigService->get('core.store.licenseHost')
        ];

        return new JsonResponse(
            [
                'success' => true,
                'data' => $userInformation
            ],
            200
        );
    }

    /**
     * @param Context $context
     * @return UserEntity
     * @throws InvalidContextSourceException
     * @throws InconsistentCriteriaIdsException
     */
    private function getSwUserEntity(Context $context): UserEntity
    {
        if (!$context->getSource() instanceof AdminApiSource) {
            throw new InvalidContextSourceException(AdminApiSource::class, get_class($context->getSource()));
        }

        $userId = $context->getSource()->getUserId();

        $criteria = new Criteria([$userId]);
        $criteria->getAssociation('locale');

        return $this->userRepository->search($criteria, $context)->first();
    }

    /**
     * @param UserEntity $user
     * @return string
     */
    private function getUserLanguageCode(UserEntity $user): string
    {
        $language = 'en';

        if ($user && $user->getLocale()) {
            $code = $user->getLocale()->getCode();
            $language = mb_strtolower(explode('-', $code)[0]);
        }

        return $language;
    }

    /**
     * @Route("/user-token", name="get.sw.user.token", methods={"GET"})
     *
     * @param Context $context
     * @return JsonResponse
     * @throws InvalidContextSourceException
     */
    public function getSwUserTokenAndSecret(Context $context): JsonResponse
    {
        $user = $this->getSwUserEntity($context);

        $tokenInformation = [
            'url' => $this->systemConfigService->get('core.store.apiUri'),
            'longLifeToken' => $user->getStoreToken(),
            'shopSecret' => $this->systemConfigService->get('core.store.shopSecret')
        ];

        return new JsonResponse(
            [
                'success' => true,
                'data' => $tokenInformation
            ],
            200
        );
    }

    /**
     * @Route("/set-shop-id", name="set.config.shop.id", methods={"POST"})
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function setUserShopId(Request $request): JsonResponse
    {
        $configElements = [];
        $isShopIdEmpty = false;
        $shopId = $request->get('shopId');

        $searchCriteria = (new Criteria())
            ->addFilter(new EqualsFilter('configurationKey', 'swagMarkets_business_platform'));


        $config = $this->configRepository->search(
            $searchCriteria,
            Context::createDefaultContext()
        );

        foreach ($config->getElements() as $elementId => $element) {
            if ($element->get('configurationKey') === 'swagMarkets_business_platform') {
                foreach ($element->get('configurationValue') as $key => $configurationValue) {
                    if ($key === 'shop_id' && empty($configurationValue)) {
                        $isShopIdEmpty = true;
                        $configElements[$key] = $shopId;
                    } else {
                        $configElements[$key] = $configurationValue;
                    }
                }
                break;
            }
        }

        if ($isShopIdEmpty) {
            try {
                $this->configRepository->update(
                    [
                        [
                            'id' => $elementId,
                            'configurationValue' => $configElements
                        ]
                    ],
                    Context::createDefaultContext()
                );
            } catch (\Exception $e) {
                // TODO: Log the exception with logger
            }
        }

        return new JsonResponse(
            [
                'success' => true,
                'data' => [
                    'shopId' => $shopId
                ]
            ],
            200
        );
    }

    /**
     * @Route("/repair-integration-user", name="repair.integration.user", methods={"POST"})
     *
     * @param Context $context
     * @return JsonResponse
     * @throws GuzzleException
     */
    public function repairBusinessPlatformIntegrationUser(Context $context): JsonResponse
    {
        $this->integrationUserService->repairIntegrationUser($context);

        return new JsonResponse([
            'success' => true
        ]);
    }

    /**
     * @Route("/store/erpSystemConfig", name="storeErpSystemConfig", methods={"POST"})
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function storeBrickFoxSystemConfiguration(Request $request)
    {
        try {
            $data = [
                'configurationKey' => 'swagMarkets_business_platform',
                'data' => $request->request->all()

            ];

            $this->configService->singleStoreConfig($data);
            return new JsonResponse(['success' => true], 201);
        } catch (InvalidArgumentException | Exception $exception) {
            return new JsonResponse(['success' => false, 'message' => $exception->getMessage()], 500);
        }
    }

    /**
     * @Route("/marketplace/set-id", name="marketplace.set.id", methods={"POST"})
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function setMarketplaceId(Request $request)
    {
        try {
            $data = $request->request->all();

            $data = [
                'configurationKey' => $data['data']['marketplace'],
                'data' => ['marketplace_id' => $data['data']['marketplace_id']]
            ];

            $this->configService->singleStoreConfig($data);
            return new JsonResponse(['success' => true], 201);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => $e->getMessage()], $e->getCode());
        }
    }

    /**
     * @Route("/product-migration-request/disable", name="product-migration-request.disable", methods={"PUT"})
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function disableProductMigrationRequest(Request $request){
        try {
            $data = $request->request->all();

            if(isset($data['disable_product_migration_request']) && $data['disable_product_migration_request'] === true) {
                $this->setConfigAttribute($data['marketplace_name'] . '_configuration', 'product_migration_request',
                    false);
            } else {
                throw new InvalidArgumentException("Missing required parameter", 500);
            }

            return new JsonResponse(['success' => true], 200);
        } catch (\Exception $e) {
            return new JsonResponse(['success' => false, 'message' => $e->getMessage(), 'data'=>$request->request->all()], $e->getCode());
        }
    }

    /**
     * @return string
     */
    public function getUserShopId(): string
    {
        $searchCriteria = (new Criteria())
            ->addFilter(new EqualsFilter('configurationKey', 'swagMarkets_business_platform'));

        $config = $this->configRepository->search(
            $searchCriteria,
            Context::createDefaultContext()
        );

        $configurationValue = $config->first()->getConfigurationValue();

        return $configurationValue['shop_id'];
    }

    /**
     * @param string $configurationKey
     * @param string $requestType
     * @param Mixed $value
     */
    public function setConfigAttribute(string $configurationKey, string $requestType, $value): void
    {
        $searchCriteria = (new Criteria())
            ->addFilter(new EqualsFilter('configurationKey', $configurationKey));

        $context = Context::createDefaultContext();
        $config = $this->configRepository->search($searchCriteria, $context)->first();

        $configurationId = $config->getId();
        $configurationValue = $config->getConfigurationValue();

        $configurationValue[$requestType] = $value;

        $this->configRepository->update(
            [
                [
                    'id' => $configurationId,
                    'configurationValue' => $configurationValue
                ]
            ],
            Context::createDefaultContext()
        );
    }
}
