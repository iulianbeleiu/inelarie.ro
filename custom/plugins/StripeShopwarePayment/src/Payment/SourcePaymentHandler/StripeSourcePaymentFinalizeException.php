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

use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Payment\Exception\AsyncPaymentFinalizeException;
use Stripe\Charge;
use Stripe\Exception\ApiErrorException;
use Stripe\Source;

class StripeSourcePaymentFinalizeException extends AsyncPaymentFinalizeException
{
    public function __construct(
        OrderTransactionEntity $orderTransaction,
        string $message
    ) {
        parent::__construct(
            $orderTransaction->getId(),
            $message
        );
    }

    public static function unauthorizedRedirect(OrderTransactionEntity $orderTransaction, Source $source): self
    {
        return new self(
            $orderTransaction,
            sprintf(
                'The redirect for Stripe source %s is unauthorized.',
                $source->id
            )
        );
    }

    public static function sourceNotFound(
        OrderTransactionEntity $orderTransaction,
        string $sourceId,
        ApiErrorException $apiException
    ): self {
        return new self(
            $orderTransaction,
            sprintf(
                "The Stripe source %s could not be found. Additional information:\n%s",
                $sourceId,
                $apiException->getMessage()
            )
        );
    }

    public static function sourceNotChargeable(OrderTransactionEntity $orderTransaction, Source $source): self
    {
        return new self(
            $orderTransaction,
            sprintf(
                'The Stripe source %s is not chargeable.',
                $source->id
            )
        );
    }

    public static function chargeFailed(OrderTransactionEntity $orderTransaction, Charge $charge): self
    {
        return new self(
            $orderTransaction,
            sprintf(
                'The Stripe charge %s did not succeed.',
                $charge->id
            )
        );
    }

    public static function chargeCreationFailed(
        OrderTransactionEntity $orderTransaction,
        Source $source,
        ApiErrorException $apiException
    ): self {
        return new self(
            $orderTransaction,
            sprintf(
                "The Stripe charge for source %s could not be created. Additional information:\n%s",
                $source->id,
                $apiException->getMessage()
            )
        );
    }
}
