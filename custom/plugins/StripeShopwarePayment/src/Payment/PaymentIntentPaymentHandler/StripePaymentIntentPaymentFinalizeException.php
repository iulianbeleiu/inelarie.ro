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

use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Payment\Exception\AsyncPaymentFinalizeException;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;

class StripePaymentIntentPaymentFinalizeException extends AsyncPaymentFinalizeException
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

    public static function unauthorizedRedirect(
        OrderTransactionEntity $orderTransaction,
        PaymentIntent $paymentIntent
    ): self {
        return new self(
            $orderTransaction,
            sprintf(
                'The redirect for Stripe payment intent %s is unauthorized.',
                $paymentIntent->id
            )
        );
    }

    public static function paymentIntentNotFound(
        OrderTransactionEntity $orderTransaction,
        string $paymentIntentId,
        ApiErrorException $apiException
    ): self {
        return new self(
            $orderTransaction,
            sprintf(
                "The Stripe payment intent %s could not be found. Additional information:\n%s",
                $paymentIntentId,
                $apiException->getMessage()
            )
        );
    }

    public static function paymentIntentDidNotSucceed(
        OrderTransactionEntity $orderTransaction,
        PaymentIntent $paymentIntent
    ): self {
        return new self(
            $orderTransaction,
            sprintf(
                'The Stripe payment intent %s did not succeed.',
                $paymentIntent->id
            )
        );
    }
}
