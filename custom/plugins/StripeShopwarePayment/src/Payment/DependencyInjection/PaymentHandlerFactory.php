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
use Stripe\ShopwarePayment\OrderTransactionLocking\OrderTransactionLockingService;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentHandler\PaymentIntentPaymentHandler;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourcePaymentConfigurator;
use Stripe\ShopwarePayment\Payment\SourcePaymentHandler\SourcePaymentHandler;
use Stripe\ShopwarePayment\Payment\IdempotentOrderTransactionStateHandler;
use Stripe\ShopwarePayment\Payment\StripeCustomerService;
use Stripe\ShopwarePayment\Payment\StripeOrderTransactionService;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;

class PaymentHandlerFactory implements PaymentHandlerFactoryInterface
{
    /**
     * @var StripeApiFactory
     */
    private $stripeApiFactory;

    /**
     * @var StripeOrderTransactionService
     */
    private $stripeOrderTransactionService;

    /**
     * @var IdempotentOrderTransactionStateHandler
     */
    private $idempotentOrderTransactionStateHandler;

    /**
     * @var StripeCustomerService
     */
    private $stripeCustomerService;

    /**
     * @var StripePaymentMethodSettings
     */
    private $stripePaymentMethodSettings;

    /**
     * @var OrderTransactionLockingService
     */
    private $orderTransactionLockingService;

    public function __construct(
        StripeApiFactory $stripeApiFactory,
        StripeOrderTransactionService $stripeOrderTransactionService,
        IdempotentOrderTransactionStateHandler $idempotentOrderTransactionStateHandler,
        StripeCustomerService $stripeCustomerService,
        StripePaymentMethodSettings $stripePaymentMethodSettings,
        OrderTransactionLockingService $orderTransactionLockingService
    ) {
        $this->stripeApiFactory = $stripeApiFactory;
        $this->stripeOrderTransactionService = $stripeOrderTransactionService;
        $this->idempotentOrderTransactionStateHandler = $idempotentOrderTransactionStateHandler;
        $this->stripeCustomerService = $stripeCustomerService;
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
        $this->orderTransactionLockingService = $orderTransactionLockingService;
    }

    public function createPaymentIntentPaymentHandler(
        PaymentIntentPaymentConfigurator $paymentIntentPaymentConfigurator
    ): AsynchronousPaymentHandlerInterface {
        return new PaymentIntentPaymentHandler(
            $this->stripeApiFactory,
            $this->stripeOrderTransactionService,
            $this->idempotentOrderTransactionStateHandler,
            $paymentIntentPaymentConfigurator,
            $this->stripeCustomerService,
            $this->stripePaymentMethodSettings
        );
    }

    public function createSourcePaymentHandler(
        SourcePaymentConfigurator $sourcePaymentConfigurator
    ): AsynchronousPaymentHandlerInterface {
        return new SourcePaymentHandler(
            $this->stripeApiFactory,
            $this->stripeOrderTransactionService,
            $this->idempotentOrderTransactionStateHandler,
            $sourcePaymentConfigurator,
            $this->stripeCustomerService,
            $this->orderTransactionLockingService
        );
    }
}
