<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\DigitalWallets;

use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentConfig;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfiguratorException;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;

class DigitalWalletsPaymentConfigurator implements PaymentIntentPaymentConfigurator
{
    /**
     * @var PaymentIntentPaymentConfigurator
     */
    private $defaultPaymentIntentPaymentConfigurator;

    public function __construct(
        PaymentIntentPaymentConfigurator $defaultPaymentIntentPaymentConfigurator
    ) {
        $this->defaultPaymentIntentPaymentConfigurator = $defaultPaymentIntentPaymentConfigurator;
    }

    public function configure(
        PaymentIntentConfig $paymentIntentConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $requestDataBag = $stripePaymentContext->requestDataBag;
        $this->validateRequestDataBag($requestDataBag);

        $this->defaultPaymentIntentPaymentConfigurator->configure(
            $paymentIntentConfig,
            $stripePaymentContext
        );

        $stripePaymentMethodId = $requestDataBag->get('stripeDigitalWalletsPaymentMethodId');
        $paymentIntentConfig->setStripePaymentMethodId($stripePaymentMethodId);
    }

    private function validateRequestDataBag(RequestDataBag $dataBag): void
    {
        if (!$dataBag->has('stripeDigitalWalletsPaymentMethodId')) {
            throw PaymentIntentPaymentConfiguratorException::noDigitalWalletsPaymentMethodSupplied();
        }
    }
}
