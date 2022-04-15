<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\Card;

use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentConfig;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfiguratorException;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;

class CardPaymentConfigurator implements PaymentIntentPaymentConfigurator
{
    private PaymentIntentPaymentConfigurator $defaultPaymentIntentPaymentConfigurator;
    private StripePaymentMethodSettings $stripePaymentMethodSettings;

    public function __construct(
        PaymentIntentPaymentConfigurator $defaultPaymentIntentPaymentConfigurator,
        StripePaymentMethodSettings $stripePaymentMethodSettings
    ) {
        $this->defaultPaymentIntentPaymentConfigurator = $defaultPaymentIntentPaymentConfigurator;
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
    }

    public function configure(
        PaymentIntentConfig $paymentIntentConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $selectedCard = $this->stripePaymentMethodSettings->getSelectedCard();
        if (!$selectedCard || !isset($selectedCard['id'])) {
            throw PaymentIntentPaymentConfiguratorException::noCreditCardSelected();
        }

        $this->defaultPaymentIntentPaymentConfigurator->configure(
            $paymentIntentConfig,
            $stripePaymentContext
        );

        $paymentIntentConfig->setStripePaymentMethodId($selectedCard['id']);
        $paymentIntentConfig->setSaveStripePaymentMethod(
            $this->stripePaymentMethodSettings->isSaveCardForFutureCheckouts()
        );
    }
}
