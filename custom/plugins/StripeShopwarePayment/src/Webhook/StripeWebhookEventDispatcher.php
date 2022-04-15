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

use Shopware\Core\Framework\Context;
use Stripe\Event;

class StripeWebhookEventDispatcher
{
    public const STRIPE_WEBHOOK_EVENTS = [
        Event::CHARGE_SUCCEEDED,
        Event::CHARGE_EXPIRED,
        Event::CHARGE_FAILED,
        Event::SOURCE_CANCELED,
        Event::SOURCE_FAILED,
        Event::SOURCE_CHARGEABLE,
        Event::PAYMENT_INTENT_SUCCEEDED,
        Event::PAYMENT_INTENT_CANCELED,
        Event::PAYMENT_INTENT_PAYMENT_FAILED,
    ];

    /**
     * @var StripeWebhookEventHandler
     */
    private $stripeWebhookEventHandler;

    public function __construct(
        StripeWebhookEventHandler $stripeWebhookEventHandler
    ) {
        $this->stripeWebhookEventHandler = $stripeWebhookEventHandler;
    }

    public function dispatch(Event $event, Context $context): void
    {
        switch ($event->type) {
            case Event::CHARGE_SUCCEEDED:
                $this->stripeWebhookEventHandler->handleChargeSuccessfulEvent($event, $context);
                break;
            case Event::CHARGE_EXPIRED:
                $this->stripeWebhookEventHandler->handleChargeCanceledEvent($event, $context);
                break;
            case Event::CHARGE_FAILED:
                $this->stripeWebhookEventHandler->handleChargeFailedEvent($event, $context);
                break;
            case Event::SOURCE_FAILED:
                $this->stripeWebhookEventHandler->handleSourceFailedEvent($event, $context);
                break;
            case Event::SOURCE_CANCELED:
                $this->stripeWebhookEventHandler->handleSourceCanceledEvent($event, $context);
                break;
            case Event::SOURCE_CHARGEABLE:
                $this->stripeWebhookEventHandler->handleSourceChargeableEvent($event, $context);
                break;
            case Event::PAYMENT_INTENT_SUCCEEDED:
                $this->stripeWebhookEventHandler->handlePaymentIntentSuccessfulEvent($event, $context);
                break;
            case Event::PAYMENT_INTENT_CANCELED:
                $this->stripeWebhookEventHandler->handlePaymentIntentCanceledEvent($event, $context);
                break;
            case Event::PAYMENT_INTENT_PAYMENT_FAILED:
                $this->stripeWebhookEventHandler->handlePaymentIntentFailedEvent($event, $context);
                break;
            default:
                throw WebhookException::noMatchingEventHandlerFound($event);
        }
    }
}
