<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\StripeApi;

class StripeApiCredentials
{
    /**
     * @var string|null
     */
    public $secretKey;

    /**
     * @var string|null
     */
    public $webhookSecret;

    public function __construct(?string $secretKey, ?string $webhookSecret = null)
    {
        $this->secretKey = $secretKey;
        $this->webhookSecret = $webhookSecret;
    }
}
