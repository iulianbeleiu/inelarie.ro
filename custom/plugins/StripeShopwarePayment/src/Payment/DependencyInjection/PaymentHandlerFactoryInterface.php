<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\DependencyInjection;

use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\AsynchronousPaymentHandlerInterface;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourcePaymentConfigurator;

interface PaymentHandlerFactoryInterface
{
    public function createPaymentIntentPaymentHandler(
        PaymentIntentPaymentConfigurator $paymentIntentPaymentConfigurator
    ): AsynchronousPaymentHandlerInterface;

    public function createSourcePaymentHandler(
        SourcePaymentConfigurator $sourcePaymentConfigurator
    ): AsynchronousPaymentHandlerInterface;
}
