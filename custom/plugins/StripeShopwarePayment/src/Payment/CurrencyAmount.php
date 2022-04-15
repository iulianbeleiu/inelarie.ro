<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment;

class CurrencyAmount
{
    /**
     * @var float
     */
    private $amount;

    /**
     * @var int
     */
    private $decimalPlaces;

    public function __construct(float $amount, int $decimalPlaces)
    {
        $this->amount = $amount;
        $this->decimalPlaces = $decimalPlaces;
    }

    public function getAmountInSmallestUnit(): int
    {
        $factor = 10 ** $this->decimalPlaces;

        return intval(round($factor * $this->amount));
    }
}
