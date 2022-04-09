<?php declare(strict_types=1);


namespace Swag\Markets\Service;


use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DBALException;
use ErrorException;
use Exception;
use Shopware\Core\Framework\DataAbstractionLayer\Exception\InconsistentCriteriaIdsException;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Symfony\Component\DependencyInjection\ContainerInterface as Container;

class UninstallService
{
    private UninstallContext $context;

    private Container $container;

    /**
     * @param UninstallContext $context
     * @param Container $container
     */
    public function __construct(UninstallContext $context, Container $container)
    {
        $this->context = $context;
        $this->container = $container;
    }

    /**
     * @throws DBALException
     * @throws ErrorException
     */
    public function uninstall()
    {
        if ($this->deleteSalesChannels()) {
            $this->deleteShopwareIntegrationUser();
            $this->deleteTable();
        }

    }

    /**
     * @throws ErrorException
     */
    private function deleteSalesChannels(): bool
    {
        $salesChannelTypeRepository = $this->container->get('sales_channel_type.repository');
        $ids = [
            ['id' => '7ff39608fed04e4bbcc62710b7223966'], // ebay
            ['id' => '26a9ece25bd14b288b30c3d71e667d2c'] // amazon
        ];

        try {
            $salesChannelTypeRepository->delete($ids, $this->context->getContext());
            return true;
        } catch (Exception $exception) {
            $message = 'You have existing sales channels which has type Amazon or Ebay. Please remove them first, then try to deactivate plugin again.';
            throw new ErrorException($message);
        }
    }

    /**
     * @throws InconsistentCriteriaIdsException
     */
    private function deleteShopwareIntegrationUser(): void
    {
        $integrationRepository = $this->container->get('integration.repository');

        $users = $integrationRepository->searchIds(
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
            $integrationRepository->delete(
                $ids,
                $this->context->getContext()
            );
        }
    }

    /**
     * @throws DBALException
     */
    private function deleteTable(): void
    {
        /** @var Connection $connection */
        $connection = $this->container->get('Doctrine\DBAL\Connection');
        $connection->executeStatement("SET foreign_key_checks = 0;");
        $connection->executeStatement("DROP TABLE IF EXISTS bf_config;");
        $connection->executeStatement("DROP TABLE IF EXISTS bf_marketplace;");
        $connection->executeStatement("DROP TABLE IF EXISTS bf_category_mapping;");
        $connection->executeStatement("DROP TABLE IF EXISTS bf_marketplace_settings;");
        $connection->executeStatement("DROP TABLE IF EXISTS bf_marketplace_sales_channel;");
        $connection->executeStatement("SET foreign_key_checks = 1;");

        // this enables creation of the corresponding tables upon reactivation of the plugin without error
        $connection->executeStatement("UPDATE migration SET `update`=NULL, `update_destructive`=NULL, message=NULL WHERE class LIKE 'Swag%Markets%Migration%';");
    }
}
