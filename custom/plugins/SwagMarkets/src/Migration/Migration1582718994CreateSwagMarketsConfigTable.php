<?php declare(strict_types=1);

namespace Swag\Markets\Migration;

use Swag\Markets\Service\SwagMarketsBusinessPlatformUserService;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DBALException;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Api\Util\AccessKeyHelper;
use Shopware\Core\Framework\Migration\MigrationStep;
use Shopware\Core\Framework\Uuid\Uuid;

class Migration1582718994CreateSwagMarketsConfigTable extends MigrationStep
{
    /**
     * @return int
     */
    public function getCreationTimestamp(): int
    {
        return 1582718994;
    }

    /**
     * @param  Connection  $connection
     *
     * @throws DBALException
     */
    public function update(Connection $connection): void
    {
        $sql
            = /** @lang SQL */
            <<<SQL
        CREATE TABLE IF NOT EXISTS `bf_config` (
            `id` binary(16) NOT NULL,
            `configuration_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `configuration_value` json NOT NULL,
            `sales_channel_id` binary(16) DEFAULT NULL,
            `created_at` datetime(3) NOT NULL,
            `updated_at` datetime(3) DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq.swagMarkets_config.configuration_key__sales_channel_id` (`configuration_key`,`sales_channel_id`),
            CONSTRAINT `json.swagMarkets_config.configuration_value` CHECK (json_valid(`configuration_value`)),
            CONSTRAINT `fk.swagMarkets_config.sales_channel_id` FOREIGN KEY (`sales_channel_id`)
                                REFERENCES `sales_channel` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
        $connection->executeStatement($sql);
    }

    /**
     * @param  Connection  $connection
     *
     * @throws DBALException
     */
    public function updateDestructive(Connection $connection): void
    {
        $sql = "DROP TABLE `bf_config`";
        $connection->executeStatement($sql);
    }
}
