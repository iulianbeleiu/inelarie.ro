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

use Shopware\Core\Framework\Struct\Struct;
use Stripe\ShopwarePayment\StripeApi\StripeApi;

class StripeSdkPageExtension extends Struct
{
    public const PAGE_EXTENSION_NAME = 'stripePaymentStripeSdk';

    protected string $stripeApiVersion = StripeApi::API_VERSION;
    protected ?string $stripePublicKey = null;
    protected ?string $salesChannelLocale = null;
    protected ?string $stripeAccountCountryIso = null;

    /**
     * @return string
     */
    public function getStripeApiVersion(): string
    {
        return $this->stripeApiVersion;
    }

    /**
     * @return string|null
     */
    public function getStripePublicKey(): ?string
    {
        return $this->stripePublicKey;
    }

    /**
     * @return string|null
     */
    public function getSalesChannelLocale(): ?string
    {
        return $this->salesChannelLocale;
    }

    public function getStripeAccountCountryIso(): ?string
    {
        return $this->stripeAccountCountryIso;
    }
}
