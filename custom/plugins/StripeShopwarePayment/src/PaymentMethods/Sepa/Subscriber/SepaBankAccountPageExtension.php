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

use Shopware\Core\Framework\Struct\Struct;

class SepaBankAccountPageExtension extends Struct
{
    public const PAGE_EXTENSION_NAME = 'stripePaymentSepaBankAccount';

    protected ?bool $isSavingSepaBankAccountsAllowed = false;
    protected array $availableSepaBankAccounts = [];
    protected ?array $selectedSepaBankAccount = null;
    protected array $countries = [];
    protected ?string $mandateUrl = null;
    protected ?string $sepaCreditor = null;

    public function isSavingSepaBankAccountsAllowed(): ?bool
    {
        return $this->isSavingSepaBankAccountsAllowed;
    }

    public function getAvailableSepaBankAccounts(): array
    {
        return $this->availableSepaBankAccounts;
    }

    public function getSelectedSepaBankAccount(): ?array
    {
        return $this->selectedSepaBankAccount;
    }

    public function getCountries(): array
    {
        return $this->countries;
    }

    public function getMandateUrl(): ?string
    {
        return $this->mandateUrl;
    }

    public function getSepaCreditor(): ?string
    {
        return $this->sepaCreditor;
    }
}
