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

class Migration1644498089RenameStatementDescriptorInPluginConfig extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1644498089;
    }

    public function update(Connection $connection): void
    {
        $connection->executeStatement('
            UPDATE system_config
            SET configuration_key = "StripeShopwarePayment.config.statementDescriptor"
            WHERE configuration_key = "StripeShopwarePayment.config.statementDescriptorPrefix"
            ');
    }

    public function updateDestructive(Connection $connection): void
    {
    }
}
