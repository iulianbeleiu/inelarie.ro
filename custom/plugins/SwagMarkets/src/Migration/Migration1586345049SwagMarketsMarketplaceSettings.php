<?php declare(strict_types=1);

namespace Swag\Markets\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1586345049SwagMarketsMarketplaceSettings extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1586345049;
    }

    public function update(Connection $connection): void
    {
        $sql
            = /** @lang SQL */
            <<<SQL
        CREATE TABLE IF NOT EXISTS `bf_marketplace_settings` (
            `id` binary(16) NOT NULL,
            `bf_marketplace_id` binary(16) NOT NULL,
            `currency_id` binary(16) NOT NULL,
            `language_id` binary(16) NOT NULL,
            `country_id` binary(16) NOT NULL,
            `created_at` datetime(3) NOT NULL,
            `updated_at` datetime(3) DEFAULT NULL,
            PRIMARY KEY (`id`),
            CONSTRAINT `fk.bf_marketplace_settings.bf_marketplace_id` FOREIGN KEY (`bf_marketplace_id`) REFERENCES `bf_marketplace` (`id`),
            CONSTRAINT `fk.bf_marketplace_settings.currency_id` FOREIGN KEY (`currency_id`) REFERENCES `currency` (`id`),
            CONSTRAINT `fk.bf_marketplace_settings.language_id` FOREIGN KEY (`language_id`) REFERENCES `language` (`id`),
            CONSTRAINT `fk.bf_marketplace_settings.country_id` FOREIGN KEY (`country_id`) REFERENCES `country` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
        $connection->executeStatement($sql);

    }

    public function updateDestructive(Connection $connection): void
    {
        $connection->executeStatement('DROP TABLE IF EXISTS `bf_marketplace_settings`');
    }
}
