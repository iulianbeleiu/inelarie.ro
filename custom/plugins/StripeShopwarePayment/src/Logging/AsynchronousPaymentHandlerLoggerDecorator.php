<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Logging;

use Psr\Log\LoggerInterface;
use Shopware\Core\Checkout\Payment\Cart\AsyncPaymentTransactionStruct;
use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\AsynchronousPaymentHandlerInterface;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class AsynchronousPaymentHandlerLoggerDecorator implements AsynchronousPaymentHandlerInterface
{
    /**
     * @var AsynchronousPaymentHandlerInterface
     */
    private $decoratedPaymentHandler;

    /**
     * @var LoggerInterface
     */
    private $logger;

    public function __construct(
        AsynchronousPaymentHandlerInterface $decoratedPaymentHandler,
        LoggerInterface $logger
    ) {

        $this->decoratedPaymentHandler = $decoratedPaymentHandler;
        $this->logger = $logger;
    }

    public function pay(
        AsyncPaymentTransactionStruct $transaction,
        RequestDataBag $dataBag,
        SalesChannelContext $salesChannelContext
    ): RedirectResponse {
        try {
            return $this->decoratedPaymentHandler->pay($transaction, $dataBag, $salesChannelContext);
        } catch (\Exception $exception) {
            $this->logger->error($exception->getMessage(), [
                'orderId' => $transaction->getOrder()->getId(),
                'orderTransactionId' => $transaction->getOrderTransaction()->getId(),
                'salesChannelId' => $salesChannelContext->getSalesChannel()->getId(),
            ]);

            throw $exception;
        }
    }

    public function finalize(
        AsyncPaymentTransactionStruct $transaction,
        Request $request,
        SalesChannelContext $salesChannelContext
    ): void {
        try {
            $this->decoratedPaymentHandler->finalize($transaction, $request, $salesChannelContext);
        } catch (\Exception $exception) {
            $this->logger->error($exception->getMessage(), [
                'orderId' => $transaction->getOrder()->getId(),
                'orderTransactionId' => $transaction->getOrderTransaction()->getId(),
                'salesChannelId' => $salesChannelContext->getSalesChannel()->getId(),
            ]);

            throw $exception;
        }
    }
}
