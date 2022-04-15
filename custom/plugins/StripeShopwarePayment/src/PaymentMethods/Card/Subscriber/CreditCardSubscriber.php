<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\Card\Subscriber;

use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Storefront\Page\Account\Order\AccountEditOrderPageLoadedEvent;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPageLoadedEvent;
use Shopware\Storefront\Page\PageLoadedEvent;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;
use Stripe\ShopwarePayment\StripeApi\StripeApi;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class CreditCardSubscriber implements EventSubscriberInterface
{
    private StripeApiFactory $stripeApiFactory;
    private StripePluginConfigService $stripePluginConfigService;
    private StripePaymentMethodSettings $stripePaymentMethodSettings;

    public function __construct(
        StripePluginConfigService $stripePluginConfigService,
        StripeApiFactory $stripeApiFactory,
        StripePaymentMethodSettings $stripePaymentMethodSettings
    ) {
        $this->stripePluginConfigService = $stripePluginConfigService;
        $this->stripeApiFactory = $stripeApiFactory;
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
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
        $salesChannelId = $salesChannel->getId();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel(
            $salesChannelContext->getContext(),
            $salesChannelId
        );
        $availableCards = $this->fetchAvailableCards($stripeApi, $salesChannelContext->getCustomer());
        $stripePluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel(
            $salesChannel->getId()
        );

        $creditCardPageExtension = new CreditCardPageExtension();
        $creditCardPageExtension->assign([
            'isSavingCreditCardsAllowed' => $stripePluginConfig->isSavingCreditCardsAllowed(),
            'availableCards' => $availableCards,
            'selectedCard' => $this->stripePaymentMethodSettings->getSelectedCard(),
        ]);
        $event->getPage()->addExtension(CreditCardPageExtension::PAGE_EXTENSION_NAME, $creditCardPageExtension);
    }

    private function fetchAvailableCards(StripeApi $stripeApi, ?CustomerEntity $customer): array
    {
        $availableCards = [];
        if ($customer && $customer->getCustomFields() && isset($customer->getCustomFields()['stripeCustomerId'])) {
            $availableCards = $stripeApi->getSavedCardsOfStripeCustomer(
                $customer->getCustomFields()['stripeCustomerId']
            );
        }

        $selectedCard = $this->stripePaymentMethodSettings->getSelectedCard();
        if ($selectedCard) {
            // Ensure the selected card is part of the list of available cards
            $cardExists = false;
            foreach ($availableCards as $card) {
                if ($card['id'] === $selectedCard['id']) {
                    $cardExists = true;
                    break;
                }
            }
            if (!$cardExists) {
                $availableCards[] = $selectedCard;
            }
        }

        return $availableCards;
    }
}
