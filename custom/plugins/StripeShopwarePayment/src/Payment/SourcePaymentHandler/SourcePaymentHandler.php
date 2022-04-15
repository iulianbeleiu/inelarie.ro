<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\SourcePaymentHandler;

use Shopware\Core\Checkout\Cart\Exception\CustomerNotLoggedInException;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Payment\Cart\AsyncPaymentTransactionStruct;
use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\AsynchronousPaymentHandlerInterface;
use Shopware\Core\Checkout\Payment\Exception\CustomerCanceledAsyncPaymentException;
use Shopware\Core\Checkout\Payment\Exception\InvalidTransactionException;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Stripe\Charge;
use Stripe\Exception\ApiErrorException;
use Stripe\ShopwarePayment\OrderTransactionLocking\OrderTransactionLockingService;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\ChargeConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourceConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourcePaymentConfigurator;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Payment\StripeCustomerService;
use Stripe\ShopwarePayment\Payment\IdempotentOrderTransactionStateHandler;
use Stripe\ShopwarePayment\Payment\StripeOrderTransactionService;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Stripe\Source;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class SourcePaymentHandler implements AsynchronousPaymentHandlerInterface
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
     * @var SourcePaymentConfigurator
     */
    private $sourcePaymentConfigurator;

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
        StripeApiFactory $stripeApiFactory,
        StripeOrderTransactionService $stripeOrderTransactionService,
        IdempotentOrderTransactionStateHandler $idempotentOrderTransactionStateHandler,
        SourcePaymentConfigurator $sourcePaymentConfigurator,
        StripeCustomerService $stripeCustomerService,
        OrderTransactionLockingService $orderTransactionLockingService
    ) {
        $this->stripeApiFactory = $stripeApiFactory;
        $this->stripeOrderTransactionService = $stripeOrderTransactionService;
        $this->idempotentOrderTransactionStateHandler = $idempotentOrderTransactionStateHandler;
        $this->sourcePaymentConfigurator = $sourcePaymentConfigurator;
        $this->stripeCustomerService = $stripeCustomerService;
        $this->orderTransactionLockingService = $orderTransactionLockingService;
    }

    public function pay(
        AsyncPaymentTransactionStruct $transaction,
        RequestDataBag $dataBag,
        SalesChannelContext $salesChannelContext
    ): RedirectResponse {
        $orderTransaction = $transaction->getOrderTransaction();
        $customer = $salesChannelContext->getCustomer();

        $this->ensureCustomerIsLoggedIn($customer);

        $sourceConfig = new SourceConfig();
        $sourceConfig->setReturnUrl($transaction->getReturnUrl());
        $sourceConfig->setMetadata([
            'shopware_order_transaction_id' => $orderTransaction->getId(),
        ]);
        $context = $salesChannelContext->getContext();
        $stripePaymentContext = new StripePaymentContext(
            $orderTransaction->getId(),
            $dataBag,
            $context
        );
        $this->sourcePaymentConfigurator->configureSourceConfig($sourceConfig, $stripePaymentContext);

        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);

        try {
            $source = $stripeApi->createSource($sourceConfig);
        } catch (ApiErrorException $apiException) {
            throw StripeSourcePaymentProcessException::sourceCreationFailed(
                $orderTransaction,
                $apiException
            );
        }

        if ($source->redirect->status !== 'pending') {
            throw StripeSourcePaymentProcessException::invalidSourceRedirect($orderTransaction, $source);
        }

        $this->stripeOrderTransactionService->saveStripeSourceOnOrderTransaction($orderTransaction, $context, $source);

        return new RedirectResponse($source->redirect->url);
    }

    public function finalize(
        AsyncPaymentTransactionStruct $transaction,
        Request $request,
        SalesChannelContext $salesChannelContext
    ): void {
        $customer = $salesChannelContext->getCustomer();
        $this->ensureCustomerIsLoggedIn($customer);

        // Fetch the stripe source associated with the order transaction
        $orderTransaction = $transaction->getOrderTransaction();
        $sourceId = $this->stripeOrderTransactionService->getStripeSourceId($orderTransaction);
        if (!$sourceId) {
            throw new InvalidTransactionException($orderTransaction->getId());
        }

        $orderTransactionId = $orderTransaction->getId();
        $this->orderTransactionLockingService->executeWithLockedOrderTransaction(
            $orderTransactionId,
            function () use ($orderTransactionId, $sourceId, $salesChannelContext, $request) {
                $context = $salesChannelContext->getContext();
                $orderTransaction = $this->stripeOrderTransactionService->getOrderTransaction(
                    $orderTransactionId,
                    [
                        'stateMachineState'
                    ],
                    $context
                );
                $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
                $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);
                try {
                    $source = $stripeApi->getSource($sourceId);
                } catch (ApiErrorException $apiException) {
                    throw StripeSourcePaymentFinalizeException::sourceNotFound(
                        $orderTransaction,
                        $sourceId,
                        $apiException
                    );
                }

                $this->validateRequest($request, $orderTransaction, $source);
                if (!$this->shouldCreateStripeChargeForOrderTransaction($source)) {
                    return;
                }
                if ($source->status !== Source::STATUS_CHARGEABLE) {
                    throw StripeSourcePaymentFinalizeException::sourceNotChargeable($orderTransaction, $source);
                }
                $this->createStripeChargeForOrderTransaction($orderTransaction, $source, $salesChannelContext);
            }
        );
    }

    private function ensureCustomerIsLoggedIn(?CustomerEntity $customer): void
    {
        if (!$customer) {
            throw new CustomerNotLoggedInException();
        }
    }

    private function validateRequest(Request $request, OrderTransactionEntity $orderTransaction, Source $source): void
    {
        // Validate the request is coming from Stripe
        if ($source->client_secret !== $request->get('client_secret')) {
            throw StripeSourcePaymentFinalizeException::unauthorizedRedirect(
                $orderTransaction,
                $source
            );
        }
        // Validate the Stripe source redirect wasn't cancelled
        if (($source->redirect->status === 'failed' && $source->redirect->failure_reason === 'user_abort')
            || $request->get('redirect_status') === 'canceled'
        ) {
            throw new CustomerCanceledAsyncPaymentException(
                $orderTransaction->getId(),
                'Stripe source id: ' . $source->id
            );
        }
    }

    private function shouldCreateStripeChargeForOrderTransaction(Source $source): bool
    {
        if ($source->status === Source::STATUS_PENDING) {
            // The Stripe source is not ready to be charged, a webhook event will handle charging the source once it is
            // ready to be charged

            return false;
        }
        if ($source->status === Source::STATUS_CONSUMED) {
            // The Stripe source was already charged via a webhook

            return false;
        }

        return true;
    }

    private function createStripeChargeForOrderTransaction(
        OrderTransactionEntity $orderTransaction,
        Source $source,
        SalesChannelContext $salesChannelContext
    ): void {
        $context = $salesChannelContext->getContext();
        $customer = $salesChannelContext->getCustomer();
        $salesChannelId = $salesChannelContext->getSalesChannel()->getId();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);

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
        $this->sourcePaymentConfigurator->configureChargeConfig($chargeConfig, $stripePaymentContext);

        try {
            $charge = $stripeApi->createCharge($chargeConfig);
        } catch (ApiErrorException $apiException) {
            throw StripeSourcePaymentFinalizeException::chargeCreationFailed(
                $orderTransaction,
                $source,
                $apiException
            );
        }

        $this->stripeOrderTransactionService->saveStripeChargeOnOrderTransaction(
            $orderTransaction,
            $context,
            $charge
        );
        switch ($charge->status) {
            case Charge::STATUS_SUCCEEDED:
                if ($orderTransaction->getStateMachineState()->getTechnicalName() === OrderTransactionStates::STATE_PAID) {
                    return;
                }
                $this->idempotentOrderTransactionStateHandler->paid(
                    $orderTransaction->getId(),
                    $context
                );
                break;
            case Charge::STATUS_FAILED:
                throw StripeSourcePaymentFinalizeException::chargeFailed($orderTransaction, $charge);
            default:
                break;
        }
    }
}
