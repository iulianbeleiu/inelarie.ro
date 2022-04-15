<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\Sepa;

use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentConfig;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfiguratorException;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

class SepaPaymentConfigurator implements PaymentIntentPaymentConfigurator
{
    private PaymentIntentPaymentConfigurator $defaultPaymentIntentPaymentConfigurator;
    private StripePaymentMethodSettings $stripePaymentMethodSettings;
    private RequestStack $requestStack;

    public function __construct(
        PaymentIntentPaymentConfigurator $defaultPaymentIntentPaymentConfigurator,
        StripePaymentMethodSettings $stripePaymentMethodSettings,
        RequestStack $requestStack
    ) {
        $this->defaultPaymentIntentPaymentConfigurator = $defaultPaymentIntentPaymentConfigurator;
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
        $this->requestStack = $requestStack;
    }

    public function configure(
        PaymentIntentConfig $paymentIntentConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $selectedSepaBankAccount = $this->stripePaymentMethodSettings->getSelectedSepaBankAccount();
        if (!$selectedSepaBankAccount || !isset($selectedSepaBankAccount['id'])) {
            throw PaymentIntentPaymentConfiguratorException::noSepaBankAccountSelected();
        }

        $this->defaultPaymentIntentPaymentConfigurator->configure(
            $paymentIntentConfig,
            $stripePaymentContext
        );

        $paymentIntentConfig->setStripePaymentMethodId($selectedSepaBankAccount['id']);
        $paymentIntentConfig->setSaveStripePaymentMethod(
            $this->stripePaymentMethodSettings->isSaveSepaBankAccountForFutureCheckouts()
        );
        $paymentIntentConfig->setMethodSpecificElements([
            'payment_method_types' => ['sepa_debit'],
            'mandate_data' => [
                'customer_acceptance' => [
                    'type' => 'online',
                    'online' => [
                        'ip_address' => $this->getRequest()->getClientIp(),
                        'user_agent' => $this->getRequest()->headers->get('user-agent'),
                    ],
                ],
            ],
        ]);
    }

    private function getRequest(): Request
    {
        return $this->requestStack->getCurrentRequest();
    }
}
