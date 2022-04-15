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

use Stripe\Customer;

class PaymentIntentConfig
{
    /**
     * @var int
     */
    private $amountToPayInSmallestCurrencyUnit;

    /**
     * @var string
     */
    private $currencyIsoCode;

    /**
     * @var string
     */
    private $stripePaymentMethodId;

    /**
     * @var array
     */
    private $metadata = [];

    /**
     * @var array
     */
    private $methodSpecificElements = [];

    /**
     * @var string
     */
    private $returnUrl;

    /**
     * @var string
     */
    private $paymentIntentDescription;

    /**
     * @var Customer
     */
    private $stripeCustomer;

    /**
     * @var string
     */
    private $statementDescriptor;

    /**
     * @var string
     */
    private $receiptEmail;

    /**
     * @var bool
     */
    private $saveStripePaymentMethod = false;

    /**
     * @var float
     */
    private $applicationFeeAmount;

    public function toArray(): array
    {
        $paymentIntentConfig = array_merge([
            'payment_method' => $this->stripePaymentMethodId,
            'amount' => $this->amountToPayInSmallestCurrencyUnit,
            'currency' => $this->currencyIsoCode,
            'return_url' => $this->returnUrl,
            'metadata' => $this->metadata,
            'description' => $this->paymentIntentDescription,
            'customer' => $this->stripeCustomer->id,
            'confirmation_method' => 'automatic',
            'confirm' => true,
        ], $this->methodSpecificElements);

        if ($this->statementDescriptor) {
            $paymentIntentConfig['statement_descriptor'] = $this->statementDescriptor;
        }
        if ($this->receiptEmail) {
            $paymentIntentConfig['receipt_email'] = $this->receiptEmail;
        }
        if ($this->saveStripePaymentMethod) {
            $paymentIntentConfig['save_payment_method'] = true;
        }
        if ($this->applicationFeeAmount) {
            $paymentIntentConfig['application_fee_amount'] = $this->applicationFeeAmount;
        }

        return $paymentIntentConfig;
    }

    public function setStripePaymentMethodId(string $stripePaymentMethodId): void
    {
        $this->stripePaymentMethodId = $stripePaymentMethodId;
    }

    public function setMethodSpecificElements(array $methodSpecificElements): void
    {
        $this->methodSpecificElements = $methodSpecificElements;
    }

    public function setReturnUrl(string $returnUrl): void
    {
        $this->returnUrl = $returnUrl;
    }

    public function setAmountToPayInSmallestCurrencyUnit(int $amountToPayInSmallestCurrencyUnit): void
    {
        $this->amountToPayInSmallestCurrencyUnit = $amountToPayInSmallestCurrencyUnit;
    }

    public function getAmountToPayInSmallestCurrencyUnit(): int
    {
        return $this->amountToPayInSmallestCurrencyUnit;
    }

    public function setMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
    }

    public function setCurrencyIsoCode(string $currencyIsoCode): void
    {
        $this->currencyIsoCode = $currencyIsoCode;
    }

    public function setPaymentIntentDescription(string $paymentIntentDescription): void
    {
        $this->paymentIntentDescription = $paymentIntentDescription;
    }

    public function setStatementDescriptor(string $statementDescriptor): void
    {
        $this->statementDescriptor = $statementDescriptor;
    }

    public function setReceiptEmail(string $receiptEmail): void
    {
        $this->receiptEmail = $receiptEmail;
    }

    public function setStripeCustomer(Customer $stripeCustomer): void
    {
        $this->stripeCustomer = $stripeCustomer;
    }

    public function setSaveStripePaymentMethod(bool $saveStripePaymentMethod): void
    {
        $this->saveStripePaymentMethod = $saveStripePaymentMethod;
    }

    public function setApplicationFeeAmount(float $applicationFeeAmount): void
    {
        $this->applicationFeeAmount = $applicationFeeAmount;
    }
}
