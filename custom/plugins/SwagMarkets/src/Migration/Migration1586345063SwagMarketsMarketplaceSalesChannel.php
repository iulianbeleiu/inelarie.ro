<?php declare(strict_types=1);

namespace Swag\Markets\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1586345063SwagMarketsMarketplaceSalesChannel extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1586345063;
    }

    public function update(Connection $connection): void
    {
        $sql
            = /** @lang SQL */
            <<<SQL
        CREATE TABLE IF NOT EXISTS `bf_marketplace_sales_channel` (
            `bf_marketplace_id` binary(16) NOT NULL,
            `sales_channel_id` binary(16) NOT NULL,
            CONSTRAINT `fk.bf_marketplace_sales_channel.bf_marketplace_id` FOREIGN KEY (`bf_marketplace_id`) REFERENCES `bf_marketplace` (`id`),
            CONSTRAINT `fk.bf_marketplace_sales_channel.sales_cahnnel_id` FOREIGN KEY (`sales_channel_id`) REFERENCES `sales_channel` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
        $connection->executeStatement($sql);

    }

    public function updateDestructive(Connection $connection): void
    {
        $connection->executeStatement('DROP TABLE IF EXISTS `bf_marketplace_sales_channel`');
    }
}
