<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig;

use Exception;

class PaymentIntentPaymentConfiguratorException extends Exception
{
    public static function noCreditCardSelected(): self
    {
        return new self('No credit card selected.');
    }

    public static function noDigitalWalletsPaymentMethodSupplied(): self
    {
        return new self('No digital wallets payment method supplied.');
    }

    public static function noSepaBankAccountSelected(): self
    {
        return new self('No SEPA bank account selected.');
    }
}
