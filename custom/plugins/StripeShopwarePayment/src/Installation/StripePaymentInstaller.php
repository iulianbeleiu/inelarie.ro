<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Installation;

use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin\Util\PluginIdProvider;
use Shopware\Core\System\Language\LanguageEntity;
use Stripe\ShopwarePayment\StripeShopwarePayment;

class StripePaymentInstaller
{
    private const PAYMENT_METHODS = [
        'stripe.shopware_payment.payment_handler.sofort' => [
            'en-GB' => [
                'name' => 'SOFORT (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'SOFORT (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.card' => [
            'en-GB' => [
                'name' => 'Credit Card (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'Kreditkarte (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.digital_wallets' => [
            'en-GB' => [
                'name' => 'Apple Pay / Google Pay (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'Apple Pay / Google Pay (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.sepa' => [
            'en-GB' => [
                'name' => 'SEPA Direct Debit (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'SEPA-Lastschrift (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.klarna' => [
            'en-GB' => [
                'name' => 'Klarna (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'Klarna (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.giropay' => [
            'en-GB' => [
                'name' => 'Giropay (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'Giropay (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.ideal' => [
            'en-GB' => [
                'name' => 'iDeal (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'iDeal (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.p24' => [
            'en-GB' => [
                'name' => 'P24 (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'P24 (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.eps' => [
            'en-GB' => [
                'name' => 'EPS (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'EPS (via Stripe)',
            ],
        ],
        'stripe.shopware_payment.payment_handler.bancontact' => [
            'en-GB' => [
                'name' => 'Bancontact (via Stripe)',
            ],
            'de-DE' => [
                'name' => 'Bancontact (via Stripe)',
            ],
        ],
    ];

    /**
     * @var Context
     */
    private $context;

    /**
     * @var PluginIdProvider
     */
    private $pluginIdProvider;

    /**
     * @var EntityRepositoryInterface
     */
    private $paymentMethodRepository;

    /**
     * @var EntityRepositoryInterface
     */
    private $languageRepository;

    public function __construct(
        Context $context,
        PluginIdProvider $pluginIdProvider,
        EntityRepositoryInterface $paymentMethodRepository,
        EntityRepositoryInterface $languageRepository
    ) {
        $this->context = $context;
        $this->pluginIdProvider = $pluginIdProvider;
        $this->paymentMethodRepository = $paymentMethodRepository;
        $this->languageRepository = $languageRepository;
    }

    public function postInstall(): void
    {
        $this->postUpdate();
    }

    public function postUpdate(): void
    {
        $this->ensurePaymentMethods();
    }

    public function activate(): void
    {
        $this->activatePaymentMethods();
    }

    public function deactivate(): void
    {
        $this->deactivatePaymentMethods();
    }

    private function activatePaymentMethods(): void
    {
        foreach (self::PAYMENT_METHODS as $paymentMethodHandlerIdentifier => $translations) {
            $paymentMethodId = $this->getPaymentMethodIdForHandlerIdentifier($paymentMethodHandlerIdentifier);
            if (!$paymentMethodId) {
                continue;
            }

            $this->paymentMethodRepository->update([
                [
                    'id' => $paymentMethodId,
                    'active' => true,
                ],
            ], $this->context);
        }
    }

    private function deactivatePaymentMethods(): void
    {
        foreach (self::PAYMENT_METHODS as $paymentMethodHandlerIdentifier => $translations) {
            $paymentMethodId = $this->getPaymentMethodIdForHandlerIdentifier($paymentMethodHandlerIdentifier);
            if (!$paymentMethodId) {
                continue;
            }

            $this->paymentMethodRepository->update([
                [
                    'id' => $paymentMethodId,
                    'active' => false,
                ],
            ], $this->context);
        }
    }

    private function ensurePaymentMethods(): void
    {
        $defaultLocaleCode = $this->getSystemDefaultLocaleCode($this->context);
        foreach (self::PAYMENT_METHODS as $paymentMethodHandlerIdentifier => $translations) {
            $paymentMethodId = $this->getPaymentMethodIdForHandlerIdentifier($paymentMethodHandlerIdentifier);
            if ($defaultLocaleCode && !isset($translations[$defaultLocaleCode])) {
                $translations[$defaultLocaleCode] = $translations['en-GB'];
            }

            $this->paymentMethodRepository->upsert([
                [
                    'id' => $paymentMethodId,
                    'handlerIdentifier' => $paymentMethodHandlerIdentifier,
                    'pluginId' => $this->getPluginId(),
                    'translations' => $translations,
                ],
            ], $this->context);
        }
    }

    private function getPaymentMethodIdForHandlerIdentifier(string $paymentMethodHandlerIdentifier): ?string
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('handlerIdentifier', $paymentMethodHandlerIdentifier));

        return $this->paymentMethodRepository
            ->searchIds($criteria, $this->context)
            ->firstId();
    }

    private function getPluginId(): string
    {
        return $this->pluginIdProvider->getPluginIdByBaseClass(
            StripeShopwarePayment::class,
            $this->context
        );
    }

    private function getSystemDefaultLocaleCode(Context $context): ?string
    {
        $criteria = new Criteria([Defaults::LANGUAGE_SYSTEM]);
        $criteria->addAssociation('locale');
        /** @var LanguageEntity $systemDefaultLanguage */
        $systemDefaultLanguage = $this->languageRepository->search($criteria, $context)->first();
        $locale = $systemDefaultLanguage->getLocale();
        if (!$locale) {
            return null;
        }

        return $locale->getCode();
    }
}
