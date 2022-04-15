<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\SourcePaymentConfig;

use Stripe\ShopwarePayment\Payment\StripePaymentContext;

interface SourcePaymentConfigurator
{
    public function configureSourceConfig(
        SourceConfig $sourceConfig,
        StripePaymentContext $stripePaymentContext
    ): void;

    public function configureChargeConfig(
        ChargeConfig $chargeConfig,
        StripePaymentContext $stripePaymentContext
    ): void;
}
