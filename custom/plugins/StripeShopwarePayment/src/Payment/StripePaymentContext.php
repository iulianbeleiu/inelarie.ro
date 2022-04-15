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

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;

class StripePaymentContext
{
    /**
     * @var string
     */
    public $orderTransactionId;

    /**
     * @var RequestDataBag
     */
    public $requestDataBag;

    /**
     * @var Context
     */
    public $context;

    public function __construct(
        string $orderTransactionId,
        RequestDataBag $requestDataBag,
        Context $context
    ) {
        $this->orderTransactionId = $orderTransactionId;
        $this->requestDataBag = $requestDataBag;
        $this->context = $context;
    }
}
