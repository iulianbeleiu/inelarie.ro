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

use Shopware\Core\Checkout\Order\Aggregate\OrderCustomer\OrderCustomerEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Stripe\ShopwarePayment\Payment\CurrencyAmount;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;

class DefaultSourcePaymentConfigurator implements SourcePaymentConfigurator
{
    /**
     * @var StripePluginConfigService
     */
    private $stripePluginConfigService;

    /**
     * @var EntityRepositoryInterface
     */
    private $orderTransactionRepository;

    public function __construct(
        StripePluginConfigService $stripePluginConfigService,
        EntityRepositoryInterface $orderTransactionRepository
    ) {
        $this->stripePluginConfigService = $stripePluginConfigService;
        $this->orderTransactionRepository = $orderTransactionRepository;
    }

    public function configureSourceConfig(
        SourceConfig $sourceConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $criteria = new Criteria([$stripePaymentContext->orderTransactionId]);
        $criteria->addAssociations([
            'order.currency',
            'order.orderCustomer',
        ]);
        /** @var OrderTransactionEntity $orderTransaction */
        $orderTransaction = $this->orderTransactionRepository->search(
            $criteria,
            $stripePaymentContext->context
        )->first();

        $customer = $orderTransaction->getOrder()->getOrderCustomer();
        $sourceConfig->setOwnerName($this->getOwnerName($customer));
        $currency = $orderTransaction->getOrder()->getCurrency();
        $sourceConfig->setCurrencyIsoCode($currency->getIsoCode());

        $sourceConfig->setAmountToPayInSmallestCurrencyUnit(
            (new CurrencyAmount(
                $orderTransaction->getAmount()->getTotalPrice(),
                $currency->getTotalRounding()->getDecimals()
            ))->getAmountInSmallestUnit()
        );
    }

    public function configureChargeConfig(
        ChargeConfig $chargeConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $criteria = new Criteria([$stripePaymentContext->orderTransactionId]);
        $criteria->addAssociations([
            'order.orderCustomer',
            'order.salesChannel',
        ]);
        /** @var OrderTransactionEntity $orderTransaction */
        $orderTransaction = $this->orderTransactionRepository->search(
            $criteria,
            $stripePaymentContext->context
        )->first();

        $order = $orderTransaction->getOrder();
        $chargeConfig->setChargeDescription($this->getChargeDescription($order));

        $config = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel(
            $order->getSalesChannel()->getId()
        );
        if ($config->shouldSendStripeChargeEmails()) {
            $chargeConfig->setReceiptEmail($order->getOrderCustomer()->getEmail());
        }
    }

    private function getChargeDescription(OrderEntity $order): string
    {
        $orderCustomer = $order->getOrderCustomer();

        return sprintf(
            '%s / Customer %s / Order %s',
            $orderCustomer->getEmail(),
            $orderCustomer->getCustomerNumber(),
            $order->getOrderNumber()
        );
    }

    private function getOwnerName(OrderCustomerEntity $customer): string
    {
        $customerName = sprintf('%s %s', $customer->getFirstName(), $customer->getLastName());

        return trim($customer->getCompany() ?? $customerName);
    }
}
