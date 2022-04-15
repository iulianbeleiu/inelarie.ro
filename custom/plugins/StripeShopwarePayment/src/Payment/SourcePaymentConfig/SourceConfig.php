<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\SourcePaymentConfig;

class SourceConfig
{
    /**
     * @var int
     */
    private $amountToPayInSmallestCurrencyUnit;

    /**
     * @var string
     */
    private $currencyIsoCode;

    /**
     * @var string
     */
    private $type;

    /**
     * @var string
     */
    private $ownerName;

    /**
     * @var array
     */
    private $ownerFields = [];

    /**
     * @var array
     */
    private $metadata = [];

    /**
     * @var array
     */
    private $methodSpecificElements = [];

    /**
     * @var string
     */
    private $returnUrl;

    public function toArray(): array
    {
        return array_merge([
            'type' => $this->type,
            'amount' => $this->amountToPayInSmallestCurrencyUnit,
            'currency' => $this->currencyIsoCode,
            'owner' => $this->buildOwnerArray(),
            'redirect' => [
                'return_url' => $this->returnUrl,
            ],
            'metadata' => $this->metadata,
        ], $this->methodSpecificElements);
    }

    public function setType(string $type): void
    {
        $this->type = $type;
    }

    public function setOwnerFields(array $ownerFields): void
    {
        $this->ownerFields = $ownerFields;
    }

    public function setMethodSpecificElements(array $methodSpecificElements): void
    {
        $this->methodSpecificElements = $methodSpecificElements;
    }

    public function setReturnUrl(string $returnUrl): void
    {
        $this->returnUrl = $returnUrl;
    }

    public function setAmountToPayInSmallestCurrencyUnit(int $amountToPayInSmallestCurrencyUnit): void
    {
        $this->amountToPayInSmallestCurrencyUnit = $amountToPayInSmallestCurrencyUnit;
    }

    public function setMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
    }

    public function setCurrencyIsoCode(string $currencyIsoCode): void
    {
        $this->currencyIsoCode = $currencyIsoCode;
    }

    public function setOwnerName(string $ownerName): void
    {
        $this->ownerName = $ownerName;
    }

    private function buildOwnerArray(): array
    {
        return array_merge([
            'name' => $this->ownerName,
        ], $this->ownerFields);
    }
}
