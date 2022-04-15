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
use Shopware\Core\Checkout\Payment\Exception\AsyncPaymentProcessException;
use Stripe\Exception\ApiErrorException;
use Stripe\Source;

class StripeSourcePaymentProcessException extends AsyncPaymentProcessException
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

    public static function sourceCreationFailed(
        OrderTransactionEntity $orderTransaction,
        ApiErrorException $apiException
    ): self {
        return new self(
            $orderTransaction,
            sprintf(
                "The Stripe source could not be created. Additional information:\n%s",
                $apiException->getMessage()
            )
        );
    }

    public static function invalidSourceRedirect(OrderTransactionEntity $orderTransaction, Source $source): self
    {
        return new self(
            $orderTransaction,
            sprintf(
                'The redirect for Stripe source %s is invalid (redirect status: "%s").',
                $source->id,
                $source->redirect->status
            )
        );
    }
}
