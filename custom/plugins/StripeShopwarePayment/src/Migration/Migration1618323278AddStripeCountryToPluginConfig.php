<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Migration\MigrationStep;
use Shopware\Core\Framework\Uuid\Uuid;

class Migration1618323278AddStripeCountryToPluginConfig extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1618323278;
    }

    public function update(Connection $connection): void
    {
        $defaultSalesChannels = $connection->fetchAllAssociative(
            'SELECT
                `country`.`iso` AS `countryIso`
            FROM `sales_channel`
            INNER JOIN `country` ON `sales_channel`.`country_id` = `country`.`id`
            WHERE `sales_channel`.`id` = :defaultSalesChannelId',
            [
                'defaultSalesChannelId' => hex2bin(Defaults::SALES_CHANNEL),
            ]
        );

        $defaultSalesChannel = $defaultSalesChannels[0] ?? null;
        if (!$defaultSalesChannel) {
            return;
        }

        $connection->executeStatement(
            'INSERT INTO `system_config` (
                `id`,
                `configuration_key`,
                `configuration_value`,
                `sales_channel_id`,
                `created_at`
            ) VALUES (
                :id,
                "StripeShopwarePayment.config.stripeAccountCountryIso",
                :value,
                null,
                NOW(3)
            )',
            [
                'id' => Uuid::randomBytes(),
                'value' => json_encode(['_value' => $defaultSalesChannel['countryIso']]),
            ]
        );
    }

    public function updateDestructive(Connection $connection): void
    {
    }
}
