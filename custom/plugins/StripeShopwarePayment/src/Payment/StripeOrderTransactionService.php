<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment;

use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Stripe\Charge;
use Stripe\PaymentIntent;
use Stripe\Source;

class StripeOrderTransactionService
{
    private const PAYMENT_CONTEXT_KEY = 'stripe_payment_context';

    /**
     * @var EntityRepositoryInterface
     */
    private $orderTransactionRepository;

    public function __construct(
        EntityRepositoryInterface $orderTransactionRepository
    ) {
        $this->orderTransactionRepository = $orderTransactionRepository;
    }

    public function getOrderTransaction(
        string $orderTransactionId,
        array $associations,
        Context $context
    ): ?OrderTransactionEntity {
        $criteria = new Criteria([$orderTransactionId]);
        $criteria->addAssociations($associations);

        return $this->orderTransactionRepository->search($criteria, $context)->first();
    }

    public function getOrderTransactionIdForStripeSource(
        Source $source,
        Context $context
    ): ?string {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter(
            'customFields.stripe_payment_context.payment.source_id',
            $source->id
        ));

        return $this->orderTransactionRepository->searchIds($criteria, $context)->firstId();
    }

    public function getStripePaymentIntentId(
        OrderTransactionEntity $orderTransaction
    ): ?string {
        $paymentContext = $this->getPaymentContextFromTransaction($orderTransaction);

        return $paymentContext['payment']['payment_intent_id'] ?? null;
    }

    public function getStripeSourceId(
        OrderTransactionEntity $orderTransaction
    ): ?string {
        $paymentContext = $this->getPaymentContextFromTransaction($orderTransaction);

        return $paymentContext['payment']['source_id'] ?? null;
    }

    public function saveStripeSourceOnOrderTransaction(
        OrderTransactionEntity $orderTransaction,
        Context $context,
        Source $source
    ): void {
        $paymentContext = $this->getPaymentContextFromTransaction($orderTransaction);
        $paymentContext['payment'] = $paymentContext['payment'] ?? [];
        $paymentContext['payment']['source_id'] = $source->id;
        $this->savePaymentContextInTransaction($orderTransaction, $context, $paymentContext);
    }

    public function saveStripeChargeOnOrderTransaction(
        OrderTransactionEntity $orderTransaction,
        Context $context,
        Charge $charge
    ): void {
        $paymentContext = $this->getPaymentContextFromTransaction($orderTransaction);
        $paymentContext['payment'] = $paymentContext['payment'] ?? [];
        $paymentContext['payment']['charge_id'] = $charge->id;
        $this->savePaymentContextInTransaction($orderTransaction, $context, $paymentContext);
    }

    public function saveStripePaymentIntentOnOrderTransaction(
        OrderTransactionEntity $orderTransaction,
        Context $context,
        PaymentIntent $paymentIntent
    ): void {
        $paymentContext = $this->getPaymentContextFromTransaction($orderTransaction);
        $paymentContext['payment'] = $paymentContext['payment'] ?? [];
        $paymentContext['payment']['payment_intent_id'] = $paymentIntent->id;
        $this->savePaymentContextInTransaction($orderTransaction, $context, $paymentContext);
    }

    private function getPaymentContextFromTransaction(OrderTransactionEntity $orderTransaction): array
    {
        return $orderTransaction->getCustomFields()[self::PAYMENT_CONTEXT_KEY] ?? [];
    }

    private function savePaymentContextInTransaction(
        OrderTransactionEntity $orderTransaction,
        Context $context,
        array $stripePaymentContext
    ): void {
        $orderTransactionValues = [
            'id' => $orderTransaction->getId(),
            'customFields' => [
                self::PAYMENT_CONTEXT_KEY => $stripePaymentContext,
            ],
        ];
        $this->orderTransactionRepository->update([$orderTransactionValues], $context);
        $customFields = $orderTransaction->getCustomFields() ?? [];
        $customFields[self::PAYMENT_CONTEXT_KEY] = $stripePaymentContext;
        $orderTransaction->setCustomFields($customFields);
    }
}
