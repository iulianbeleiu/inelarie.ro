<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\Eps;

use Shopware\Core\Checkout\Order\Aggregate\OrderCustomer\OrderCustomerEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentConfig;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;

class EpsPaymentConfigurator implements PaymentIntentPaymentConfigurator
{
    /**
     * @var PaymentIntentPaymentConfigurator
     */
    private $defaultPaymentIntentPaymentConfigurator;

    /**
     * @var EntityRepositoryInterface
     */
    private $orderTransactionRepository;

    /**
     * @var StripeApiFactory
     */
    private $stripeApiFactory;

    public function __construct(
        PaymentIntentPaymentConfigurator $defaultPaymentIntentPaymentConfigurator,
        StripeApiFactory $stripeApiFactory,
        EntityRepositoryInterface $orderTransactionRepository
    ) {
        $this->defaultPaymentIntentPaymentConfigurator = $defaultPaymentIntentPaymentConfigurator;
        $this->stripeApiFactory = $stripeApiFactory;
        $this->orderTransactionRepository = $orderTransactionRepository;
    }

    public function configure(
        PaymentIntentConfig $paymentIntentConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $this->defaultPaymentIntentPaymentConfigurator->configure(
            $paymentIntentConfig,
            $stripePaymentContext
        );

        $criteria = new Criteria([$stripePaymentContext->orderTransactionId]);
        $criteria->addAssociation('order.orderCustomer');
        /** @var OrderTransactionEntity $orderTransaction */
        $orderTransaction = $this->orderTransactionRepository->search(
            $criteria,
            $stripePaymentContext->context
        )->first();

        $order = $orderTransaction->getOrder();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel(
            $stripePaymentContext->context,
            $order->getSalesChannelId()
        );
        /** @var OrderCustomerEntity $orderCustomer */
        $orderCustomer = $order->getOrderCustomer();
        $paymentMethod = $stripeApi->createPaymentMethod([
            'type' => 'eps',
            'billing_details' => [
                'name' => sprintf('%s %s', $orderCustomer->getFirstName(), $orderCustomer->getLastName()),
            ],
        ]);

        $paymentIntentConfig->setStripePaymentMethodId($paymentMethod->id);
        $paymentIntentConfig->setMethodSpecificElements([
            'payment_method_types' => ['eps'],
        ]);
    }
}
