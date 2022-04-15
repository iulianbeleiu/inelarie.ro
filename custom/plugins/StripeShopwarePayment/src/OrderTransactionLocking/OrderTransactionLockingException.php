<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\OrderTransactionLocking;

use Exception;

class OrderTransactionLockingException extends Exception
{
    public static function orderTransactionNotFound(string $orderTransactionId): self
    {
        return new self(sprintf('No order transaction found for id %s', $orderTransactionId));
    }
}
