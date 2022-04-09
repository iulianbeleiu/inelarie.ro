<?php declare(strict_types=1);

namespace Swag\Markets\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1586345021SwagMarketsMarketplace extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1586345021;
    }

    public function update(Connection $connection): void
    {
        $sql
            = /** @lang SQL */
            <<<SQL
        CREATE TABLE IF NOT EXISTS `bf_marketplace` (
            `id` binary(16) NOT NULL,
            `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `created_at` datetime(3) NOT NULL,
            `updated_at` datetime(3) DEFAULT NULL,
            PRIMARY KEY (`id`),
            CONSTRAINT `uniq.swagMarkets.name` UNIQUE (`name`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
        $connection->executeStatement($sql);
    }

    public function updateDestructive(Connection $connection): void
    {
        $connection->executeStatement('DROP TABLE IF EXISTS `bf_marketplace`');
    }
}
