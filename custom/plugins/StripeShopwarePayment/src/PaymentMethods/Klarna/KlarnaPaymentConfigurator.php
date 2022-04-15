<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\Klarna;

use Shopware\Core\Checkout\Cart\Price\Struct\CartPrice;
use Shopware\Core\Checkout\Cart\Tax\Struct\CalculatedTax;
use Shopware\Core\Checkout\Order\Aggregate\OrderAddress\OrderAddressEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderLineItem\OrderLineItemEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\Locale\LocaleEntity;
use Stripe\ShopwarePayment\Payment\CurrencyAmount;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\ChargeConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourceConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourcePaymentConfigurator;
use Stripe\ShopwarePayment\Payment\StripePaymentContext;
use Stripe\ShopwarePayment\Payment\StripeOrderService;
use Stripe\Source;

class KlarnaPaymentConfigurator implements SourcePaymentConfigurator
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

    /**
     * @var EntityRepositoryInterface
     */
    private $languageRepository;

    public function __construct(
        EntityRepositoryInterface $orderTransactionRepository,
        StripeOrderService $stripeOrderService,
        SourcePaymentConfigurator $defaultSourcePaymentConfigurator,
        EntityRepositoryInterface $languageRepository
    ) {
        $this->orderTransactionRepository = $orderTransactionRepository;
        $this->stripeOrderService = $stripeOrderService;
        $this->defaultSourcePaymentConfigurator = $defaultSourcePaymentConfigurator;
        $this->languageRepository = $languageRepository;
    }

    public function configureSourceConfig(
        SourceConfig $sourceConfig,
        StripePaymentContext $stripePaymentContext
    ): void {
        $criteria = new Criteria([$stripePaymentContext->orderTransactionId]);
        $criteria->addAssociations([
            'order',
            'order.currency',
            'order.lineItems',
            'order.orderCustomer',
            'order.addresses.country',
            'order.salesChannel',
        ]);
        /** @var OrderTransactionEntity $orderTransaction */
        $orderTransaction = $this->orderTransactionRepository->search(
            $criteria,
            $stripePaymentContext->context
        )->first();

        $order = $orderTransaction->getOrder();
        $shippingAddress = $this->getShippingAddress($order);
        $billingAddress = $this->getBillingAddress($order);
        $orderCustomer = $order->getOrderCustomer();
        $salesChannelLocale = $this->getLocaleForLanguage(
            $order->getSalesChannel()->getLanguageId(),
            $stripePaymentContext->context
        );
        $currency = $order->getCurrency();

        $isNetOrder = $order->getTaxStatus() === CartPrice::TAX_STATE_NET;
        $orderLineItems = $order->getLineItems();
        $parentOrderLineItems = $orderLineItems->filter(function (OrderLineItemEntity $orderLineItem) {
            return $orderLineItem->getParentId() === null;
        });
        $items = array_map(function (OrderLineItemEntity $lineItem) use ($currency, $isNetOrder) {
            // `$lineItem->getTotalPrice()` will not contain any taxes if the order is a net order. We therefore have
            // to add the taxes to the line item. If the sum of all line items and the order total diverge, Klarna will
            // not process the payment.
            $lineItemTotal = $lineItem->getTotalPrice();
            if ($isNetOrder) {
                /** @var CalculatedTax[] $taxElements */
                $taxElements = $lineItem->getPrice()->getCalculatedTaxes()->getElements();
                foreach ($taxElements as $taxElement) {
                    $lineItemTotal += $taxElement->getTax();
                }
            }

            return [
                'type' => 'sku',
                'description' => $lineItem->getLabel(),
                'quantity' => $lineItem->getQuantity(),
                'currency' => $currency->getIsoCode(),
                'amount' => (new CurrencyAmount(
                    $lineItemTotal,
                    $currency->getItemRounding()->getDecimals()
                ))->getAmountInSmallestUnit(),
            ];
        }, array_values($parentOrderLineItems->getElements()));
        $items[] = [
            'type' => 'shipping',
            'description' => 'Shipping',
            'currency' => $currency->getIsoCode(),
            'amount' => (new CurrencyAmount(
                $order->getShippingTotal(),
                $currency->getTotalRounding()->getDecimals()
            ))->getAmountInSmallestUnit(),
        ];
        $specificConfigElements = [
            'flow' => Source::FLOW_REDIRECT,
            'klarna' => [
                'first_name' => $orderCustomer->getFirstName(),
                'last_name' => $orderCustomer->getLastName(),
                'product' => 'payment',
                'purchase_country' => $billingAddress->getCountry()->getIso(),
                'shipping_first_name' => $shippingAddress->getFirstName(),
                'shipping_last_name' => $shippingAddress->getLastName(),
                'locale' => $salesChannelLocale->getCode(),
            ],
            'source_order' => [
                'items' => array_values($items),
                'shipping' => [
                    'address' => [
                        'line1' => $shippingAddress->getStreet(),
                        'city' => $shippingAddress->getCity(),
                        'postal_code' => $shippingAddress->getZipcode(),
                        'country' => $shippingAddress->getCountry()->getIso(),
                    ],
                ],
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
        $sourceConfig->setOwnerFields([
            'email' => $orderCustomer->getEmail(),
            'address' => [
                'line1' => $billingAddress->getStreet(),
                'city' => $billingAddress->getCity(),
                'postal_code' => $billingAddress->getZipcode(),
                'country' => $billingAddress->getCountry()->getIso(),
            ],
        ]);
        $sourceConfig->setType('klarna');

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

    private function getBillingAddress(OrderEntity $order): OrderAddressEntity
    {
        $billingAddressId = $order->getBillingAddressId();

        return $order->getAddresses()->filter(function ($address) use ($billingAddressId) {
            return $address->getId() === $billingAddressId;
        })->first();
    }

    private function getShippingAddress(OrderEntity $order): OrderAddressEntity
    {
        $billingAddressId = $order->getBillingAddressId();

        $shippingAddress = $order->getAddresses()->filter(function ($address) use ($billingAddressId) {
            return $address->getId() !== $billingAddressId;
        })->first();
        if ($shippingAddress) {
            return $shippingAddress;
        }

        return $this->getBillingAddress($order);
    }

    private function getLocaleForLanguage(string $languageId, Context $context): ?LocaleEntity
    {
        $criteria = new Criteria([$languageId]);
        $criteria->addAssociation('locale');

        return $this->languageRepository->search($criteria, $context)->get($languageId)->getLocale();
    }
}
