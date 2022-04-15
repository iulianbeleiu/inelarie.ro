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

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;
use Shopware\Storefront\Page\Account\Order\AccountEditOrderPageLoadedEvent;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPageLoadedEvent;
use Shopware\Storefront\Page\PageLoadedEvent;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class StripeSdkSubscriber implements EventSubscriberInterface
{
    private EntityRepositoryInterface $languageRepository;
    private StripePluginConfigService $stripePluginConfigService;

    public function __construct(
        StripePluginConfigService $stripePluginConfigService,
        EntityRepositoryInterface $languageRepository
    ) {
        $this->stripePluginConfigService = $stripePluginConfigService;
        $this->languageRepository = $languageRepository;
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
        $salesChannelLocale = $this->getSalesChannelLocale($salesChannel, $salesChannelContext->getContext());
        $stripePluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel(
            $salesChannel->getId()
        );

        $stripeSdkPageExtension = new StripeSdkPageExtension();
        $stripeSdkPageExtension->assign([
            'stripePublicKey' => $stripePluginConfig->getStripePublicKey(),
            'salesChannelLocale' => $salesChannelLocale,
            'stripeAccountCountryIso' => $stripePluginConfig->getStripeAccountCountryIso(),
        ]);

        $event->getPage()->addExtension(StripeSdkPageExtension::PAGE_EXTENSION_NAME, $stripeSdkPageExtension);
    }

    private function getSalesChannelLocale(SalesChannelEntity $salesChannel, Context $context): ?string
    {
        $salesChannelLanguageId = $salesChannel->getLanguageId();
        $criteria = new Criteria([$salesChannelLanguageId]);
        $criteria->addAssociation('locale');
        $salesChannelLanguage = $this->languageRepository->search(
            $criteria,
            $context
        )->get($salesChannelLanguageId);

        return $salesChannelLanguage ? $salesChannelLanguage->getLocale()->getCode() : null;
    }
}
