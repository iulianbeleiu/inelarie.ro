<?php declare(strict_types=1);

namespace Swag\Markets\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1625566312ProductsToDelete extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1625566312;
    }

    public function update(Connection $connection): void
    {
        $query = <<<SQL
            CREATE TABLE IF NOT EXISTS `bf_product_to_delete`
            (
                `id` BINARY(16) NOT NULL,
                `product_id` BINARY(16) NOT NULL,
                `is_variation` TINYINT(1) DEFAULT 0 NOT NULL,
                `created_at` DATETIME(3) NOT NULL,
                `updated_at` DATETIME(3) NULL,
                PRIMARY KEY (`id`),
                KEY `idx.product_id` (`product_id`)
            )ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        SQL;

        $connection->executeStatement($query);
    }

    public function updateDestructive(Connection $connection): void
    {
    }
}
