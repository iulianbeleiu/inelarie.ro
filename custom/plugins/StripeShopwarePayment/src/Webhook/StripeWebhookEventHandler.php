<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Webhook;

use OutOfBoundsException;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Stripe\Charge;
use Stripe\Event;
use Stripe\PaymentIntent;
use Stripe\ShopwarePayment\OrderTransactionLocking\OrderTransactionLockingService;
use Stripe\ShopwarePayment\Payment\DependencyInjection\SourcePaymentConfiguratorRegistry;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\ChargeConfig;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Payment\StripeCustomerService;
use Stripe\ShopwarePayment\Payment\IdempotentOrderTransactionStateHandler;
use Stripe\ShopwarePayment\Payment\StripeOrderTransactionService;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Stripe\Source;

class StripeWebhookEventHandler
{
    /**
     * @var EntityRepositoryInterface
     */
    private $orderTransactionRepository;

    /**
     * @var StripeOrderTransactionService
     */
    private $stripeOrderTransactionService;

    /**
     * @var StripeApiFactory
     */
    private $stripeApiFactory;

    /**
     * @var SourcePaymentConfiguratorRegistry
     */
    private $sourcePaymentConfiguratorRegistry;

    /**
     * @var StripeCustomerService
     */
    private $stripeCustomerService;

    /**
     * @var IdempotentOrderTransactionStateHandler
     */
    private $idempotentOrderTransactionStateHandler;

    /**
     * @var OrderTransactionLockingService
     */
    private $orderTransactionLockingService;

    public function __construct(
        EntityRepositoryInterface $orderTransactionRepository,
        IdempotentOrderTransactionStateHandler $idempotentOrderTransactionStateHandler,
        StripeOrderTransactionService $stripeOrderTransactionService,
        StripeCustomerService $stripeCustomerService,
        StripeApiFactory $stripeApiFactory,
        SourcePaymentConfiguratorRegistry $sourcePaymentConfiguratorRegistry,
        OrderTransactionLockingService $orderTransactionLockingService
    ) {
        $this->orderTransactionRepository = $orderTransactionRepository;
        $this->idempotentOrderTransactionStateHandler = $idempotentOrderTransactionStateHandler;
        $this->stripeOrderTransactionService = $stripeOrderTransactionService;
        $this->stripeCustomerService = $stripeCustomerService;
        $this->stripeApiFactory = $stripeApiFactory;
        $this->sourcePaymentConfiguratorRegistry = $sourcePaymentConfiguratorRegistry;
        $this->orderTransactionLockingService = $orderTransactionLockingService;
    }

    public function handleChargeSuccessfulEvent(Event $event, Context $context): void
    {
        $charge = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForCharge($charge, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForCharge($charge);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_PAID) {
            // Already paid, nothing to do
            return;
        }
        $this->idempotentOrderTransactionStateHandler->paid(
            $orderTransaction->getId(),
            $context
        );
    }

    public function handleChargeCanceledEvent(Event $event, Context $context): void
    {
        $charge = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForCharge($charge, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForCharge($charge);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_CANCELLED) {
            // Already cancelled, nothing to do
            return;
        }
        $this->idempotentOrderTransactionStateHandler->cancel(
            $orderTransaction->getId(),
            $context
        );
    }

    public function handleChargeFailedEvent(Event $event, Context $context): void
    {
        $charge = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForCharge($charge, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForCharge($charge);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_FAILED) {
            // Already failed, nothing to do
            return;
        }
        $this->idempotentOrderTransactionStateHandler->fail(
            $orderTransaction->getId(),
            $context
        );
    }

    public function handleSourceCanceledEvent(Event $event, Context $context): void
    {
        $source = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForSource($source, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForSource($source);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_CANCELLED) {
            // Already cancelled, nothing to do
            return;
        }
        $this->idempotentOrderTransactionStateHandler->cancel(
            $orderTransaction->getId(),
            $context
        );
    }

    public function handleSourceFailedEvent(Event $event, Context $context): void
    {
        $source = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForSource($source, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForSource($source);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_FAILED) {
            // Already failed, nothing to do
            return;
        }
        $this->idempotentOrderTransactionStateHandler->fail(
            $orderTransaction->getId(),
            $context
        );
    }

    public function handleSourceChargeableEvent(Event $event, Context $context): void
    {
        $source = $event->data->object;
        $orderTransactionId = $this->stripeOrderTransactionService->getOrderTransactionIdForStripeSource(
            $source,
            $context
        );
        if (!$orderTransactionId) {
            throw WebhookException::orderTransactionNotFoundForSource($source);
        }
        $this->orderTransactionLockingService->executeWithLockedOrderTransaction(
            $orderTransactionId,
            function () use ($orderTransactionId, $source, $context) {
                $orderTransaction = $this->getOrderTransactionForSourceChargeableEvent($orderTransactionId, $context);
                if (!$orderTransaction) {
                    throw WebhookException::orderTransactionNotFoundForSource($source);
                }
                if (!$this->shouldCreateStripeChargeForOrderTransaction($orderTransaction, $source, $context)) {
                    return;
                }
                $this->createStripeChargeForOrderTransaction($orderTransaction, $source, $context);
            }
        );
    }

    private function shouldCreateStripeChargeForOrderTransaction(
        OrderTransactionEntity $orderTransaction,
        Source $source,
        Context $context
    ): bool {
        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_CANCELLED) {
            return false;
        }

        $orderTransactionPaymentContext = $orderTransaction->getCustomFields()['stripe_payment_context'] ?? [];
        if (isset($orderTransactionPaymentContext['payment']['charge_id'])) {
            // The charge was already created in the redirect
            return false;
        }

        $salesChannelId = $context->getSource()->getSalesChannelId();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);
        $source = $stripeApi->getSource($source->id);

        return $source->status === Source::STATUS_CHARGEABLE;
    }

    private function createStripeChargeForOrderTransaction(
        OrderTransactionEntity $orderTransaction,
        Source $source,
        Context $context
    ): void {
        $salesChannelId = $context->getSource()->getSalesChannelId();
        $order = $orderTransaction->getOrder();
        $customer = $order->getOrderCustomer()->getCustomer();

        $stripeCustomer = $this->stripeCustomerService->getStripeCustomerForShopwareCustomer(
            $customer->getId(),
            $salesChannelId,
            $context
        );
        if (!$stripeCustomer) {
            $stripeCustomer = $this->stripeCustomerService->createStripeCustomerForShopwareCustomer(
                $customer->getId(),
                $salesChannelId,
                $context
            );
            $this->stripeCustomerService->attachStripeCustomerToShopwareCustomer(
                $customer->getId(),
                $stripeCustomer,
                $context
            );
        }

        $paymentMethod = $orderTransaction->getPaymentMethod();
        $handlerIdentifier = $paymentMethod->getHandlerIdentifier();
        try {
            $sourcePaymentConfigurator = $this->sourcePaymentConfiguratorRegistry->getSourcePaymentConfiguratorByHandlerIdentifier(
                $handlerIdentifier
            );
        } catch (OutOfBoundsException $e) {
            throw WebhookException::sourcePaymentConfiguratorNotFound($paymentMethod);
        }
        $chargeConfig = new ChargeConfig();
        $chargeConfig->setStripeSource($source);
        $chargeConfig->setStripeCustomer($stripeCustomer);
        $chargeConfig->setMetadata([
            'shopware_order_transaction_id' => $orderTransaction->getId(),
        ]);
        $stripePaymentContext = new StripePaymentContext(
            $orderTransaction->getId(),
            new RequestDataBag(),
            $context
        );
        $sourcePaymentConfigurator->configureChargeConfig($chargeConfig, $stripePaymentContext);

        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);
        $charge = $stripeApi->createCharge($chargeConfig);
        $this->stripeOrderTransactionService->saveStripeChargeOnOrderTransaction(
            $orderTransaction,
            $context,
            $charge
        );
    }

    public function handlePaymentIntentSuccessfulEvent(Event $event, Context $context): void
    {
        $paymentIntent = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForPaymentIntent($paymentIntent, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForPaymentIntent($paymentIntent);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_PAID) {
            // Already paid, nothing to do
            return;
        }

        // Persist charge id and append order number to the payment intent
        $this->stripeOrderTransactionService->saveStripeChargeOnOrderTransaction(
            $orderTransaction,
            $context,
            $paymentIntent->charges->data[0]
        );
        $this->idempotentOrderTransactionStateHandler->paid(
            $orderTransaction->getId(),
            $context
        );
    }

    public function handlePaymentIntentCanceledEvent(Event $event, Context $context): void
    {
        $paymentIntent = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForPaymentIntent($paymentIntent, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForPaymentIntent($paymentIntent);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_CANCELLED) {
            // Already cancelled, nothing to do
            return;
        }
        $this->idempotentOrderTransactionStateHandler->cancel(
            $orderTransaction->getId(),
            $context
        );
    }

    public function handlePaymentIntentFailedEvent(Event $event, Context $context): void
    {
        $paymentIntent = $event->data->object;
        $orderTransaction = $this->getOrderTransactionForPaymentIntent($paymentIntent, $context);
        if (!$orderTransaction) {
            throw WebhookException::orderTransactionNotFoundForPaymentIntent($paymentIntent);
        }

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_FAILED) {
            // Already failed, nothing to do
            return;
        }
        $this->idempotentOrderTransactionStateHandler->fail(
            $orderTransaction->getId(),
            $context
        );
    }

    private function getOrderTransactionForSourceChargeableEvent(
        string $orderTransactionId,
        Context $context
    ): ?OrderTransactionEntity {
        $criteria = new Criteria([$orderTransactionId]);
        $criteria->addAssociations([
            'order',
            'order.salesChannel',
            'order.orderCustomer.customer',
            'paymentMethod',
            'stateMachineState',
        ]);
        $result = $this->orderTransactionRepository->search($criteria, $context);

        if ($result->getTotal() === 0) {
            return null;
        }

        return $result->first();
    }

    private function getOrderTransactionForSource(Source $source, Context $context): ?OrderTransactionEntity
    {
        $criteria = new Criteria();
        $criteria->addAssociation('stateMachineState');
        $criteria->addFilter(new EqualsFilter(
            'customFields.stripe_payment_context.payment.source_id',
            $source->id
        ));
        $result = $this->orderTransactionRepository->search($criteria, $context);

        if ($result->getTotal() === 0) {
            return null;
        }

        return $result->first();
    }

    private function getOrderTransactionForCharge(Charge $charge, Context $context): ?OrderTransactionEntity
    {
        $criteria = new Criteria();
        $criteria->addAssociations([
            'order',
            'stateMachineState',
        ]);
        $criteria->addFilter(new EqualsFilter(
            'customFields.stripe_payment_context.payment.charge_id',
            $charge->id
        ));
        $result = $this->orderTransactionRepository->search($criteria, $context);

        if ($result->getTotal() === 0) {
            return null;
        }

        return $result->first();
    }

    private function getOrderTransactionForPaymentIntent(
        PaymentIntent $paymentIntent,
        Context $context
    ): ?OrderTransactionEntity {
        $criteria = new Criteria();
        $criteria->addAssociations([
            'order',
            'stateMachineState',
        ]);
        $criteria->addFilter(
            new EqualsFilter(
                'customFields.stripe_payment_context.payment.payment_intent_id',
                $paymentIntent->id
            )
        );
        $result = $this->orderTransactionRepository->search($criteria, $context);

        if ($result->getTotal() === 0) {
            return null;
        }

        return $result->first();
    }
}
