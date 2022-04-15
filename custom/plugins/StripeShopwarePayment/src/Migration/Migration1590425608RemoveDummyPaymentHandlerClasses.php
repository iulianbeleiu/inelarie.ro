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
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1590425608RemoveDummyPaymentHandlerClasses extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1590425608;
    }

    public function update(Connection $db): void
    {
        $db->executeStatement(
            'UPDATE `payment_method`
            SET `handler_identifier` = "stripe.shopware_payment.payment_handler.card"
            WHERE `handler_identifier` = "Stripe\\\\ShopwarePayment\\\\Payment\\\\DependencyInjection\\\\CardPaymentHandler"'
        );
        $db->executeStatement(
            'UPDATE `payment_method`
            SET `handler_identifier` = "stripe.shopware_payment.payment_handler.sofort"
            WHERE `handler_identifier` = "Stripe\\\\ShopwarePayment\\\\Payment\\\\DependencyInjection\\\\SofortPaymentHandler"'
        );
    }

    public function updateDestructive(Connection $db): void
    {
    }
}
