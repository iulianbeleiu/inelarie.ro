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

use Stripe\ShopwarePayment\StripeApi\StripeApiCredentials;

class StripePluginConfig
{
    private array $rawConfig;
    private bool $inherited;

    public function __construct(array $rawConfig, bool $inherited = true)
    {
        $this->rawConfig = $rawConfig;
        $this->inherited = $inherited;
    }

    public function isInherited(): bool
    {
        return $this->inherited;
    }

    public function getStripeSecretKey(): ?string
    {
        return $this->getConfigValueOrNull('stripeSecretKey');
    }

    public function getStripePublicKey(): ?string
    {
        return $this->getConfigValueOrNull('stripePublicKey');
    }

    public function shouldSendStripeChargeEmails(): ?bool
    {
        return $this->getConfigValueOrNull('sendStripeChargeEmails');
    }

    public function getStatementDescriptor(): ?string
    {
        return $this->getConfigValueOrNull('statementDescriptor');
    }

    public function getStripeWebhookSecret(): ?string
    {
        return $this->getConfigValueOrNull('stripeWebhookSecret');
    }

    public function getStripeWebhookId(): ?string
    {
        return $this->getConfigValueOrNull('stripeWebhookId');
    }

    public function setStripeWebhookSecret(?string $stripeWebhookSecret): void
    {
        $this->rawConfig['stripeWebhookSecret'] = $stripeWebhookSecret;
    }

    public function setStripeWebhookId(?string $stripeWebhookId): void
    {
        $this->rawConfig['stripeWebhookId'] = $stripeWebhookId;
    }

    public function isSavingCreditCardsAllowed(): ?bool
    {
        return $this->getConfigValueOrNull('isSavingCreditCardsAllowed');
    }

    public function isSavingSepaBankAccountsAllowed(): ?bool
    {
        return $this->getConfigValueOrNull('isSavingSepaBankAccountsAllowed');
    }

    public function shouldShowPaymentProviderLogos(): ?bool
    {
        return $this->getConfigValueOrNull('shouldShowPaymentProviderLogos');
    }

    public function getRawConfig(): array
    {
        return $this->rawConfig;
    }

    public function getStripeApiCredentials(): StripeApiCredentials
    {
        return new StripeApiCredentials($this->getStripeSecretKey(), $this->getStripeWebhookSecret());
    }

    private function getConfigValueOrNull(string $configKey)
    {
        return $this->rawConfig[$configKey] ?? null;
    }

    public function getStripeAccountCountryIso(): ?string
    {
        return $this->getConfigValueOrNull('stripeAccountCountryIso');
    }

    public function setStripeAccountCountryIso(?string $countryIso): void
    {
        $this->rawConfig['stripeAccountCountryIso'] = $countryIso;
    }
}
