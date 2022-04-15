<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\DigitalWallets\Subscriber;

use Shopware\Storefront\Event\RouteRequest\HandlePaymentMethodRouteRequestEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class DigitalWalletsSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [HandlePaymentMethodRouteRequestEvent::class => 'onHandlePaymentMethodRoute'];
    }

    /**
     * When updating for an order in order to pay for it a newly created request (StoreApiRequest) is used instead
     * of the original storefront request (StorefrontRequest). Therefore the StoreApiRequest is missing some
     * arguments (i.e. our 'stripeDigitalWalletsPaymentMethodId'). This subscriber adds the necessary request
     * parameter from the StorefrontRequest to the StoreApiRequest in order to handle the payment correctly.
     * See AccountOrderController::updateOrder().
     *
     * @param HandlePaymentMethodRouteRequestEvent $event
     */
    public function onHandlePaymentMethodRoute(HandlePaymentMethodRouteRequestEvent $event): void
    {
        $event->getStoreApiRequest()->request->set(
            'stripeDigitalWalletsPaymentMethodId',
            $event->getStorefrontRequest()->request->get('stripeDigitalWalletsPaymentMethodId')
        );
    }
}
