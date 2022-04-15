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

use Shopware\Core\Framework\Struct\Struct;

class ShowPaymentProviderLogosPageExtension extends Struct
{
    public const PAGE_EXTENSION_NAME = 'stripePaymentShowPaymentProviderLogos';

    protected ?bool $showPaymentProviderLogos = false;

    /**
     * @return bool|null
     */
    public function shouldShowPaymentProviderLogos(): ?bool
    {
        return $this->showPaymentProviderLogos;
    }
}
