<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\Subscriber;

use Shopware\Core\Checkout\Customer\Event\CustomerLogoutEvent;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class LogoutSubscriber implements EventSubscriberInterface
{
    private StripePaymentMethodSettings $stripePaymentMethodSettings;

    public function __construct(
        StripePaymentMethodSettings $stripePaymentMethodSettings
    ) {
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CustomerLogoutEvent::class => 'onCustomerLogout',
        ];
    }

    public function onCustomerLogout(): void
    {
        $this->stripePaymentMethodSettings->reset();
    }
}
