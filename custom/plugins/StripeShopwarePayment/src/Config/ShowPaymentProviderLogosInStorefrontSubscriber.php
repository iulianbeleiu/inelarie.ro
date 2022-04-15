<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Config;

use Shopware\Storefront\Page\Account\Order\AccountEditOrderPageLoadedEvent;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPageLoadedEvent;
use Shopware\Storefront\Page\PageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ShowPaymentProviderLogosInStorefrontSubscriber implements EventSubscriberInterface
{
    private StripePluginConfigService $stripePluginConfigService;

    public function __construct(
        StripePluginConfigService $stripePluginConfigService
    ) {
        $this->stripePluginConfigService = $stripePluginConfigService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CheckoutConfirmPageLoadedEvent::class => 'onPageWithPaymentSelectionLoaded',
            AccountEditOrderPageLoadedEvent::class => 'onPageWithPaymentSelectionLoaded',
        ];
    }

    public function onPageWithPaymentSelectionLoaded(PageLoadedEvent $event): void
    {
        $salesChannelContext = $event->getSalesChannelContext();
        $salesChannel = $salesChannelContext->getSalesChannel();
        $stripePluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel(
            $salesChannel->getId()
        );

        $showPaymentProviderLogosPageExtension = new ShowPaymentProviderLogosPageExtension();
        $showPaymentProviderLogosPageExtension->assign([
            'showPaymentProviderLogos' => $stripePluginConfig->shouldShowPaymentProviderLogos(),
        ]);

        $event->getPage()->addExtension(
            ShowPaymentProviderLogosPageExtension::PAGE_EXTENSION_NAME,
            $showPaymentProviderLogosPageExtension
        );
    }
}
