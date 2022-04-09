<?php declare(strict_types=1);

namespace Swag\Markets\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1587126585CreateCategoryMappingTable extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1587126585;
    }

    public function update(Connection $connection): void
    {
        $sql
            = /** @lang SQL */
            <<<SQL
        CREATE TABLE IF NOT EXISTS `bf_category_mapping` (
        `id` binary(16) NOT NULL,
            `category_id` varchar(32) NOT NULL,
            `bf_category_id` varchar(32) NOT NULL,
            `sales_channel_id` varchar(32) NOT NULL,
            `created_at` datetime(3) NOT NULL,
            `updated_at` datetime(3) DEFAULT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
        $connection->executeStatement($sql);
    }

    public function updateDestructive(Connection $connection): void
    {
        $connection->executeStatement('DROP TABLE IF EXISTS `bf_category_mapping`');
    }
}
