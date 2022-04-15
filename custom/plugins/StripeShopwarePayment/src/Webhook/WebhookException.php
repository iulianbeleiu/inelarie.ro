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

use Exception;
use Shopware\Core\Checkout\Payment\PaymentMethodEntity;
use Stripe\Charge;
use Stripe\Event;
use Stripe\PaymentIntent;
use Stripe\Source;

class WebhookException extends Exception
{
    public static function orderTransactionNotFoundForCharge(Charge $charge): self
    {
        return new self(sprintf('No order found for charge %s', $charge->id));
    }

    public static function orderTransactionNotFoundForSource(Source $source): self
    {
        return new self(sprintf('No order found for source %s', $source->id));
    }

    public static function orderTransactionNotFoundForPaymentIntent(PaymentIntent $paymentIntent): self
    {
        return new self(sprintf('No order found for payment intent %s', $paymentIntent->id));
    }

    public static function sourcePaymentConfiguratorNotFound(PaymentMethodEntity $paymentMethod): self
    {
        return new self(
            sprintf(
                'No source payment configurator found for payment method %s with handler identifier %s',
                $paymentMethod->getId(),
                $paymentMethod->getHandlerIdentifier()
            )
        );
    }

    public static function noMatchingEventHandlerFound(Event $event): self
    {
        return new self(
            sprintf(
                'No matching event handler found for event type %s',
                $event->type
            )
        );
    }
}
