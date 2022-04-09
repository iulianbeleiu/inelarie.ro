<?php

namespace Swag\Markets\Service;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DBALException;
use GuzzleHttp\Client;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Exception\InconsistentCriteriaIdsException;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin\Context\DeactivateContext;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Symfony\Component\DependencyInjection\ParameterBag\ContainerBagInterface;

class DeactivationService
{
    /**
     * @var DeactivateContext
     */
    private $context;

    /**
     * @var Connection
     */
    private $connection;

    /**
     * @var EntityRepositoryInterface $configurationRepository
     */
    private $configurationRepository;

    /**
     * @var EntityRepositoryInterface $integrationRepository
     */
    private $integrationRepository;

    /**
     * @var EntityRepositoryInterface $salesChannelTypeRepository
     */
    private $salesChannelTypeRepository;

    /**
     * @var \Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface
     */
    private $paymentMethodRepository;

    /**
     * @var ContainerBagInterface
     */
    private $params;

    /**
     * @var Client
     */
    private $client;

    /**
     * DeactivationService constructor.
     *
     * @param Connection $connection
     * @param EntityRepositoryInterface $configurationRepository
     * @param EntityRepositoryInterface $integrationRepository
     * @param EntityRepositoryInterface $salesChannelTypeRepository
     * @param EntityRepositoryInterface $paymentMethodRepository
     * @param ContainerBagInterface $params
     */
    public function __construct(
        Connection $connection,
        EntityRepositoryInterface $configurationRepository,
        EntityRepositoryInterface $integrationRepository,
        EntityRepositoryInterface $salesChannelTypeRepository,
        EntityRepositoryInterface $paymentMethodRepository,
        ContainerBagInterface $params
    ) {
        $this->connection = $connection;
        $this->configurationRepository = $configurationRepository;
        $this->integrationRepository = $integrationRepository;
        $this->salesChannelTypeRepository = $salesChannelTypeRepository;
        $this->paymentMethodRepository = $paymentMethodRepository;
        $this->params = $params;

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
     * @param UninstallContext $context
     * @throws InconsistentCriteriaIdsException
     * @throws DBALException
     */
    public function deactivate(UninstallContext $context): void
    {
        $this->context = $context;

        $this->deleteShopwareIntegrationUser();
        $this->deletePaymentMethods();
        $this->deleteBusinessPlatformUser();
        $this->deleteTable();
        $this->deleteSalesChannels();
    }

    /**
     * @throws InconsistentCriteriaIdsException
     */
    private function deleteShopwareIntegrationUser(): void
    {
        $users = $this->integrationRepository->searchIds(
            (new Criteria())
                ->addFilter(
                    new EqualsFilter('label', 'SwagMarkets')
                ),
            $this->context->getContext()
        );

        $ids = array_map(
            function ($id) {
                return ['id' => $id];
            },
            $users->getIds()
        );

        if ($users->getTotal()) {
            $this->integrationRepository->delete(
                $ids,
                $this->context->getContext()
            );
        }
    }

    /**
     * @throws InconsistentCriteriaIdsException
     */
    private function deleteSalesChannels()
    {

        $ids = [
            ['id' => '7ff39608fed04e4bbcc62710b7223966'], // ebay
            ['id' => '26a9ece25bd14b288b30c3d71e667d2c'] // amazon
        ];

        $this->salesChannelTypeRepository->delete($ids, $this->context->getContext());
    }

    /**
     *
     */
    private function deletePaymentMethods()
    {
        $ids = [
            ['id' => 'ea606c4e4752dd3edd06ee8641e5ef4a'] // Shopware Markets - Amazon
        ];

        $this->paymentMethodRepository->delete($ids, $this->context->getContext());
    }

    /**
     *
     */
    private function deleteBusinessPlatformUser(): void
    {
        $userId = $this->getBusinessPlatformUserId();

        if ($userId) {
            try {
                $this->client->delete('admin/users/' . $userId);
            } catch (\Exception $exception) {
            }
        }
    }

    /**
     * @return string|null
     * @throws InconsistentCriteriaIdsException
     */
    private function getBusinessPlatformUserId(): ?string
    {
        try {
            $result = $this->configurationRepository->search(
                (new Criteria())
                    ->addFilter(
                        new EqualsFilter(
                            'configurationKey',
                            'swagMarkets_business_platform'
                        )
                    ),
                $this->context->getContext()
            )->first();

            return $result->getConfigurationValue()['id'];
        } catch (\Exception | \ErrorException | \Error $e) {
            // TODO: log exception with plugin logger
            return null;
        }
    }

    /**
     * @throws DBALException
     */
    private function deleteTable(): void
    {
        $this->connection->executeStatement("SET foreign_key_checks = 0;");
        $this->connection->executeStatement("DROP TABLE IF EXISTS bf_config;");
        $this->connection->executeStatement("DROP TABLE IF EXISTS bf_marketplace;");
        $this->connection->executeStatement("DROP TABLE IF EXISTS bf_category_mapping;");
        $this->connection->executeStatement("DROP TABLE IF EXISTS bf_marketplace_settings;");
        $this->connection->executeStatement("DROP TABLE IF EXISTS bf_marketplace_sales_channel;");
        $this->connection->executeStatement("SET foreign_key_checks = 1;");

        // this enables creation of the corresponding tables upon reactivation of the plugin without error
        $this->connection->executeStatement("UPDATE migration SET `update`=NULL, `update_destructive`=NULL, message=NULL WHERE class LIKE 'Swag%Markets%Migration%';");
    }
}
