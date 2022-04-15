<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\Sepa\Subscriber;

use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\Account\Order\AccountEditOrderPageLoadedEvent;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPageLoadedEvent;
use Shopware\Storefront\Page\Checkout\Finish\CheckoutFinishPageLoadedEvent;
use Shopware\Storefront\Page\PageLoadedEvent;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;
use Stripe\ShopwarePayment\StripeApi\StripeApi;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class SepaBankAccountSubscriber implements EventSubscriberInterface
{
    private const SHOP_NAME_CONFIG_KEY = 'core.basicInformation.shopName';

    private StripeApiFactory $stripeApiFactory;
    private StripePluginConfigService $stripePluginConfigService;
    private StripePaymentMethodSettings $stripePaymentMethodSettings;
    private EntityRepositoryInterface $countryRepository;
    private SystemConfigService $systemConfigService;

    public function __construct(
        StripePluginConfigService $stripePluginConfigService,
        StripeApiFactory $stripeApiFactory,
        StripePaymentMethodSettings $stripePaymentMethodSettings,
        EntityRepositoryInterface $countryRepository,
        SystemConfigService $systemConfigService
    ) {
        $this->stripePluginConfigService = $stripePluginConfigService;
        $this->stripeApiFactory = $stripeApiFactory;
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
        $this->countryRepository = $countryRepository;
        $this->systemConfigService = $systemConfigService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CheckoutConfirmPageLoadedEvent::class => 'onPageWithPaymentSelectionLoaded',
            AccountEditOrderPageLoadedEvent::class => 'onPageWithPaymentSelectionLoaded',
            CheckoutFinishPageLoadedEvent::class => 'onCheckoutFinishLoaded',
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
        $availableSepaBankAccounts = $this->fetchAvailableSepaBankAccounts(
            $stripeApi,
            $salesChannelContext->getCustomer()
        );
        $stripePluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel(
            $salesChannel->getId()
        );
        $countries = $this->countryRepository->search(
            new Criteria(),
            $salesChannelContext->getContext()
        )->getElements();
        $sepaCreditor = $this->systemConfigService->get(self::SHOP_NAME_CONFIG_KEY, $salesChannelId);

        $sepaBankAccountPageExtension = new SepaBankAccountPageExtension();
        $sepaBankAccountPageExtension->assign([
            'isSavingSepaBankAccountsAllowed' => $stripePluginConfig->isSavingSepaBankAccountsAllowed(),
            'availableSepaBankAccounts' => $availableSepaBankAccounts,
            'selectedSepaBankAccount' => $this->stripePaymentMethodSettings->getSelectedSepaBankAccount(),
            'countries' => $countries,
            'sepaCreditor' => $sepaCreditor,
        ]);
        $event->getPage()->addExtension(
            SepaBankAccountPageExtension::PAGE_EXTENSION_NAME,
            $sepaBankAccountPageExtension
        );
    }

    public function onCheckoutFinishLoaded(CheckoutFinishPageLoadedEvent $event): void
    {
        $formattedPaymentHandlerIdentifier = $event->getSalesChannelContext()
            ->getPaymentMethod()
            ->getFormattedHandlerIdentifier();
        if ($formattedPaymentHandlerIdentifier !== 'stripe.shopware_payment.payment_handler.sepa') {
            return;
        }
        $order = $event->getPage()->getOrder();
        $orderTransaction = $order->getTransactions()->first();
        if (!$orderTransaction) {
            return;
        }
        $orderTransactionCustomFields = $orderTransaction->getCustomFields();
        if (!$orderTransactionCustomFields
            || !isset($orderTransactionCustomFields['stripe_payment_context']['payment']['charge_id'])
        ) {
            return;
        }

        $salesChannelId = $event->getSalesChannelContext()->getSalesChannel()->getId();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($event->getContext(), $salesChannelId);
        $chargeId = $orderTransactionCustomFields['stripe_payment_context']['payment']['charge_id'];
        $charge = $stripeApi->getCharge($chargeId);
        if (!$charge->payment_method_details
            || !$charge->payment_method_details->sepa_debit
            || !$charge->payment_method_details->sepa_debit->mandate
        ) {
            return;
        }
        $mandateId = $charge->payment_method_details->sepa_debit->mandate;
        $mandate = $stripeApi->getMandate($mandateId);
        if (!$mandate->payment_method_details
            || !$mandate->payment_method_details->sepa_debit
            || !$mandate->payment_method_details->sepa_debit->url
        ) {
            return;
        }
        $mandateUrl = $mandate->payment_method_details->sepa_debit->url;

        $sepaBankAccountPageExtension = new SepaBankAccountPageExtension();
        $sepaBankAccountPageExtension->assign([
            'mandateUrl' => $mandateUrl,
        ]);

        $event->getPage()->addExtension(
            SepaBankAccountPageExtension::PAGE_EXTENSION_NAME,
            $sepaBankAccountPageExtension
        );
    }

    private function fetchAvailableSepaBankAccounts(StripeApi $stripeApi, ?CustomerEntity $customer): array
    {
        $availableSepaBankAccounts = [];
        if ($customer && $customer->getCustomFields() && isset($customer->getCustomFields()['stripeCustomerId'])) {
            $availableSepaBankAccounts = $stripeApi->getSavedSepaBankAccountsOfStripeCustomer(
                $customer->getCustomFields()['stripeCustomerId']
            );
        }

        $selectedSepaBankAccount = $this->stripePaymentMethodSettings->getSelectedSepaBankAccount();
        if ($selectedSepaBankAccount) {
            // Ensure the selected SEPA bank account is part of the list of available SEPA bank accounts
            $sepaBankAccountExists = false;
            foreach ($availableSepaBankAccounts as $sepaBankAccount) {
                if ($sepaBankAccount['id'] === $selectedSepaBankAccount['id']) {
                    $sepaBankAccountExists = true;
                    break;
                }
            }
            if (!$sepaBankAccountExists) {
                $availableSepaBankAccounts[] = $selectedSepaBankAccount;
            }
        }

        return $availableSepaBankAccounts;
    }
}
