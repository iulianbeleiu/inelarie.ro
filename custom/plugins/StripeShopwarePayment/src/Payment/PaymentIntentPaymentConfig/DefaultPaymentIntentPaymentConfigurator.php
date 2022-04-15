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

use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Stripe\ShopwarePayment\Payment\CurrencyAmount;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Payment\StripeOrderService;

class DefaultPaymentIntentPaymentConfigurator implements PaymentIntentPaymentConfigurator
{
    /**
     * @var StripePluginConfigService
     */
    private $stripePluginConfigService;

    /**
     * @var EntityRepositoryInterface
     */
    private $orderTransactionRepository;

    /**
     * @var StripeOrderService
     */
    private $stripeOrderService;

    public function __construct(
        EntityRepositoryInterface $orderTransactionRepository,
        StripePluginConfigService $stripePluginConfigService,
        StripeOrderService $stripeOrderService
    ) {
        $this->stripePluginConfigService = $stripePluginConfigService;
        $this->orderTransactionRepository = $orderTransactionRepository;
        $this->stripeOrderService = $stripeOrderService;
    }

    public function configure(
        PaymentIntentConfig $paymentIntentConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $criteria = new Criteria([$stripePaymentContext->orderTransactionId]);
        $criteria->addAssociations([
            'order.currency',
            'order.orderCustomer',
            'order.salesChannel',
        ]);
        /** @var OrderTransactionEntity $orderTransaction */
        $orderTransaction = $this->orderTransactionRepository->search(
            $criteria,
            $stripePaymentContext->context
        )->first();
        $currency = $orderTransaction->getOrder()->getCurrency();
        $paymentIntentConfig->setCurrencyIsoCode($currency->getIsoCode());

        $order = $orderTransaction->getOrder();
        $paymentIntentConfig->setPaymentIntentDescription(
            $this->getPaymentIntentDescription($order)
        );

        $paymentIntentConfig->setAmountToPayInSmallestCurrencyUnit(
            (new CurrencyAmount(
                $orderTransaction->getAmount()->getTotalPrice(),
                $currency->getTotalRounding()->getDecimals()
            ))->getAmountInSmallestUnit()
        );

        $pluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel(
            $order->getSalesChannel()->getId()
        );
        if ($pluginConfig->shouldSendStripeChargeEmails()) {
            $paymentIntentConfig->setReceiptEmail($order->getOrderCustomer()->getEmail());
        }

        $statementDescriptor = mb_substr(
            $this->stripeOrderService->getStatementDescriptor($order->getId(), $stripePaymentContext->context),
            0,
            22
        );
        if ($statementDescriptor) {
            $paymentIntentConfig->setStatementDescriptor($statementDescriptor);
        }
    }

    private function getPaymentIntentDescription(OrderEntity $order): string
    {
        $orderCustomer = $order->getOrderCustomer();

        return sprintf(
            '%s / Customer %s / Order %s',
            $orderCustomer->getEmail(),
            $orderCustomer->getCustomerNumber(),
            $order->getOrderNumber()
        );
    }
}
