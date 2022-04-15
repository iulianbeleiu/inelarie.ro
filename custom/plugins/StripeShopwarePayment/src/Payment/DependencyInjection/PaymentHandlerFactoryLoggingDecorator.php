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

use Psr\Log\LoggerInterface;
use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\AsynchronousPaymentHandlerInterface;
use Stripe\ShopwarePayment\Logging\AsynchronousPaymentHandlerLoggerDecorator;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourcePaymentConfigurator;

class PaymentHandlerFactoryLoggingDecorator implements PaymentHandlerFactoryInterface
{
    /**
     * @var PaymentHandlerFactoryInterface
     */
    private $decoratedPaymentHandlerFactory;
    /**
     * @var LoggerInterface
     */
    private $logger;

    public function __construct(
        PaymentHandlerFactoryInterface $decoratedPaymentHandlerFactory,
        LoggerInterface $logger
    ) {
        $this->decoratedPaymentHandlerFactory = $decoratedPaymentHandlerFactory;
        $this->logger = $logger;
    }

    public function createPaymentIntentPaymentHandler(
        PaymentIntentPaymentConfigurator $paymentIntentPaymentConfigurator
    ): AsynchronousPaymentHandlerInterface {
        $paymentIntentHandler = $this->decoratedPaymentHandlerFactory->createPaymentIntentPaymentHandler(
            $paymentIntentPaymentConfigurator
        );

        return new AsynchronousPaymentHandlerLoggerDecorator($paymentIntentHandler, $this->logger);
    }

    public function createSourcePaymentHandler(
        SourcePaymentConfigurator $sourcePaymentConfigurator
    ): AsynchronousPaymentHandlerInterface {
        $sourcePaymentHandler = $this->decoratedPaymentHandlerFactory->createSourcePaymentHandler(
            $sourcePaymentConfigurator
        );

        return new AsynchronousPaymentHandlerLoggerDecorator($sourcePaymentHandler, $this->logger);
    }
}
