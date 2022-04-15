<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\Sofort;

use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\ChargeConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourceConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourcePaymentConfigurator;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Payment\StripeOrderService;

class SofortPaymentConfigurator implements SourcePaymentConfigurator
{
    /**
     * @var EntityRepositoryInterface
     */
    private $orderTransactionRepository;

    /**
     * @var StripeOrderService
     */
    private $stripeOrderService;

    /**
     * @var SourcePaymentConfigurator
     */
    private $defaultSourcePaymentConfigurator;

    public function __construct(
        EntityRepositoryInterface $orderTransactionRepository,
        StripeOrderService $stripeOrderService,
        SourcePaymentConfigurator $defaultSourcePaymentConfigurator
    ) {
        $this->orderTransactionRepository = $orderTransactionRepository;
        $this->stripeOrderService = $stripeOrderService;
        $this->defaultSourcePaymentConfigurator = $defaultSourcePaymentConfigurator;
    }

    public function configureSourceConfig(
        SourceConfig $sourceConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $criteria = new Criteria([$stripePaymentContext->orderTransactionId]);
        $criteria->addAssociations([
            'order.addresses.country',
            'order.salesChannel',
        ]);
        /** @var OrderTransactionEntity $orderTransaction */
        $orderTransaction = $this->orderTransactionRepository->search(
            $criteria,
            $stripePaymentContext->context
        )->first();

        $order = $orderTransaction->getOrder();
        $billingAddressId = $order->getBillingAddressId();
        $billingAddress = $order->getAddresses()->filter(function ($address) use ($billingAddressId) {
            return $address->getId() === $billingAddressId;
        })->first();
        $specificConfigElements = [
            'sofort' => [
                'country' => $billingAddress->getCountry()->getIso(),
            ],
        ];

        $statementDescriptor = mb_substr(
            $this->stripeOrderService->getStatementDescriptor($order->getId(), $stripePaymentContext->context),
            0,
            22
        );
        if ($statementDescriptor) {
            $specificConfigElements['statement_descriptor'] = $statementDescriptor;
        }

        $sourceConfig->setMethodSpecificElements($specificConfigElements);
        $sourceConfig->setType('sofort');

        $this->defaultSourcePaymentConfigurator->configureSourceConfig(
            $sourceConfig,
            $stripePaymentContext
        );
    }

    public function configureChargeConfig(
        ChargeConfig $chargeConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $this->defaultSourcePaymentConfigurator->configureChargeConfig($chargeConfig, $stripePaymentContext);
    }
}
