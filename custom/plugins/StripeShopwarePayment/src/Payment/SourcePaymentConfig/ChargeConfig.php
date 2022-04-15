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

use Stripe\Customer;
use Stripe\Source;

class ChargeConfig
{
    /**
     * @var Source
     */
    private $stripeSource;

    /**
     * @var Customer
     */
    private $stripeCustomer;

    /**
     * @var string
     */
    private $chargeDescription;

    /**
     * @var string
     */
    private $statementDescriptor;

    /**
     * @var string
     */
    private $receiptEmail;

    /**
     * @var float
     */
    private $applicationFeeAmount;

    /**
     * @var array
     */
    private $metadata = [];

    public function toArray(): array
    {
        $chargeConfig = [
            'source' => $this->stripeSource->id,
            'amount' => $this->stripeSource->amount,
            'currency' => $this->stripeSource->currency,
            'description' => $this->chargeDescription,
            'metadata' => $this->metadata,
            'customer' => $this->stripeCustomer->id,
        ];
        if ($this->statementDescriptor) {
            $chargeConfig['statement_descriptor'] = $this->statementDescriptor;
        }
        if ($this->receiptEmail) {
            $chargeConfig['receipt_email'] = $this->receiptEmail;
        }
        if ($this->applicationFeeAmount) {
            $chargeConfig['application_fee_amount'] = $this->applicationFeeAmount;
        }

        return $chargeConfig;
    }

    public function setStripeSource(Source $stripeSource): void
    {
        $this->stripeSource = $stripeSource;
    }

    public function getStripeSource(): Source
    {
        return $this->stripeSource;
    }

    public function setStripeCustomer(Customer $stripeCustomer): void
    {
        $this->stripeCustomer = $stripeCustomer;
    }

    public function setStatementDescriptor(string $statementDescriptor): void
    {
        $this->statementDescriptor = $statementDescriptor;
    }

    public function setReceiptEmail(string $receiptEmail): void
    {
        $this->receiptEmail = $receiptEmail;
    }

    public function setChargeDescription(string $chargeDescription): void
    {
        $this->chargeDescription = $chargeDescription;
    }

    public function setApplicationFeeAmount(float $applicationFeeAmount): void
    {
        $this->applicationFeeAmount = $applicationFeeAmount;
    }

    public function setMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
    }
}
