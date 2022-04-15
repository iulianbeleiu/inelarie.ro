<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\PaymentIntentPaymentHandler;

use Shopware\Core\Checkout\Cart\Exception\CustomerNotLoggedInException;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Payment\Cart\AsyncPaymentTransactionStruct;
use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\AsynchronousPaymentHandlerInterface;
use Shopware\Core\Checkout\Payment\Exception\CustomerCanceledAsyncPaymentException;
use Shopware\Core\Checkout\Payment\Exception\InvalidTransactionException;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentConfig;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentPaymentConfigurator;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Payment\StripeCustomerService;
use Stripe\ShopwarePayment\Payment\IdempotentOrderTransactionStateHandler;
use Stripe\ShopwarePayment\Payment\StripeOrderTransactionService;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class PaymentIntentPaymentHandler implements AsynchronousPaymentHandlerInterface
{
    /**
     * @var StripeApiFactory
     */
    protected $stripeApiFactory;

    /**
     * @var StripeOrderTransactionService
     */
    protected $stripeOrderTransactionService;

    /**
     * @var StripeCustomerService
     */
    private $stripeCustomerService;

    /**
     * @var PaymentIntentPaymentConfigurator
     */
    private $paymentIntentPaymentConfigurator;

    /**
     * @var StripePaymentMethodSettings
     */
    private $stripePaymentMethodSettings;

    /**
     * @var IdempotentOrderTransactionStateHandler
     */
    private $idempotentOrderTransactionStateHandler;

    public function __construct(
        StripeApiFactory $stripeApiFactory,
        StripeOrderTransactionService $stripeOrderTransactionService,
        IdempotentOrderTransactionStateHandler $idempotentOrderTransactionStateHandler,
        PaymentIntentPaymentConfigurator $paymentIntentPaymentConfigurator,
        StripeCustomerService $stripeCustomerService,
        StripePaymentMethodSettings $stripePaymentMethodSettings
    ) {
        $this->stripeApiFactory = $stripeApiFactory;
        $this->stripeOrderTransactionService = $stripeOrderTransactionService;
        $this->idempotentOrderTransactionStateHandler = $idempotentOrderTransactionStateHandler;
        $this->paymentIntentPaymentConfigurator = $paymentIntentPaymentConfigurator;
        $this->stripeCustomerService = $stripeCustomerService;
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
    }

    public function pay(
        AsyncPaymentTransactionStruct $transaction,
        RequestDataBag $dataBag,
        SalesChannelContext $salesChannelContext
    ): RedirectResponse {
        $orderTransaction = $transaction->getOrderTransaction();
        $customer = $salesChannelContext->getCustomer();

        $this->ensureCustomerIsLoggedIn($customer);

        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        $context = $salesChannelContext->getContext();
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

        $paymentIntentConfig = new PaymentIntentConfig();
        $paymentIntentConfig->setStripeCustomer($stripeCustomer);
        $paymentIntentConfig->setReturnUrl($transaction->getReturnUrl());
        $paymentIntentConfig->setMetadata([
            'shopware_order_transaction_id' => $orderTransaction->getId(),
        ]);
        $stripePaymentContext = new StripePaymentContext(
            $orderTransaction->getId(),
            $dataBag,
            $context
        );
        $this->paymentIntentPaymentConfigurator->configure(
            $paymentIntentConfig,
            $stripePaymentContext
        );

        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);
        try {
            $paymentIntent = $stripeApi->createPaymentIntent($paymentIntentConfig);
        } catch (ApiErrorException $apiException) {
            throw StripePaymentIntentPaymentProcessException::paymentIntentCreationFailed(
                $orderTransaction,
                $apiException
            );
        }

        if ($paymentIntent->status === PaymentIntent::STATUS_SUCCEEDED) {
            // No special flow required, save the payment intent and charge id in the order transaction
            $this->stripeOrderTransactionService->saveStripePaymentIntentOnOrderTransaction(
                $orderTransaction,
                $context,
                $paymentIntent
            );
            $this->stripeOrderTransactionService->saveStripeChargeOnOrderTransaction(
                $orderTransaction,
                $context,
                $paymentIntent->charges->data[0]
            );
            $this->stripePaymentMethodSettings->reset();

            // Redirect directly to the finalize step
            $parameters = http_build_query([
                'payment_intent_client_secret' => $paymentIntent->client_secret,
            ]);

            return new RedirectResponse(sprintf('%s&%s', $transaction->getReturnUrl(), $parameters));
        }

        if ($paymentIntent->status === PaymentIntent::STATUS_REQUIRES_ACTION) {
            // We need to redirect to handle the required action
            if (!$paymentIntent->next_action) {
                throw StripePaymentIntentPaymentProcessException::paymentIntentNextActionMissing(
                    $orderTransaction,
                    $paymentIntent
                );
            }
            if ($paymentIntent->next_action->type !== 'redirect_to_url') {
                throw StripePaymentIntentPaymentProcessException::paymentIntentNextActionInvalid(
                    $orderTransaction,
                    $paymentIntent
                );
            }

            $this->stripeOrderTransactionService->saveStripePaymentIntentOnOrderTransaction(
                $orderTransaction,
                $context,
                $paymentIntent
            );

            return new RedirectResponse($paymentIntent->next_action->redirect_to_url->url);
        }

        if ($paymentIntent->status === PaymentIntent::STATUS_PROCESSING) {
            // Redirect directly to the finalize step, we need to update the order status via a Webhook
            $this->stripeOrderTransactionService->saveStripePaymentIntentOnOrderTransaction(
                $orderTransaction,
                $context,
                $paymentIntent
            );
            if (count($paymentIntent->charges->data) > 0) {
                $this->stripeOrderTransactionService->saveStripeChargeOnOrderTransaction(
                    $orderTransaction,
                    $context,
                    $paymentIntent->charges->data[0]
                );
            }

            $parameters = http_build_query([
                'payment_intent_client_secret' => $paymentIntent->client_secret,
            ]);

            return new RedirectResponse(sprintf('%s&%s', $transaction->getReturnUrl(), $parameters));
        }

        throw StripePaymentIntentPaymentProcessException::unableToProcessPaymentIntent(
            $orderTransaction,
            $paymentIntent
        );
    }

    public function finalize(
        AsyncPaymentTransactionStruct $transaction,
        Request $request,
        SalesChannelContext $salesChannelContext
    ): void {
        $customer = $salesChannelContext->getCustomer();
        $this->ensureCustomerIsLoggedIn($customer);

        // Fetch the stripe payment intent associated with the order transaction
        $orderTransaction = $transaction->getOrderTransaction();
        $paymentIntentId = $this->stripeOrderTransactionService->getStripePaymentIntentId($orderTransaction);
        if (!$paymentIntentId) {
            throw new InvalidTransactionException($orderTransaction->getId());
        }
        $context = $salesChannelContext->getContext();
        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);
        try {
            $paymentIntent = $stripeApi->getPaymentIntent($paymentIntentId);
        } catch (ApiErrorException $apiException) {
            throw StripePaymentIntentPaymentFinalizeException::paymentIntentNotFound(
                $orderTransaction,
                $paymentIntentId,
                $apiException
            );
        }

        // Validate the request is coming from Stripe
        if ($paymentIntent->client_secret !== $request->get('payment_intent_client_secret')) {
            throw StripePaymentIntentPaymentFinalizeException::unauthorizedRedirect(
                $orderTransaction,
                $paymentIntent
            );
        }

        if ($paymentIntent->status === PaymentIntent::STATUS_CANCELED) {
            throw new CustomerCanceledAsyncPaymentException(
                $orderTransaction->getId(),
                'Stripe payment intent id: ' . $paymentIntent->id
            );
        }

        if ($paymentIntent->status === PaymentIntent::STATUS_PROCESSING) {
            // Do not mark the payment as paid, but complete the checkout workflow.
            // A Webhook event will update the order payment status asynchronously.
            $this->stripePaymentMethodSettings->reset();

            return;
        }

        if ($paymentIntent->status !== PaymentIntent::STATUS_SUCCEEDED) {
            throw StripePaymentIntentPaymentFinalizeException::paymentIntentDidNotSucceed(
                $orderTransaction,
                $paymentIntent
            );
        }

        // Payment intent succeeded, mark as paid
        $this->stripeOrderTransactionService->saveStripeChargeOnOrderTransaction(
            $orderTransaction,
            $context,
            $paymentIntent->charges->data[0]
        );
        $this->stripePaymentMethodSettings->reset();

        if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_PAID) {
            return;
        }
        $this->idempotentOrderTransactionStateHandler->paid($orderTransaction->getId(), $context);
    }

    private function ensureCustomerIsLoggedIn(?CustomerEntity $customer): void
    {
        if (!$customer) {
            throw new CustomerNotLoggedInException();
        }
    }
}
