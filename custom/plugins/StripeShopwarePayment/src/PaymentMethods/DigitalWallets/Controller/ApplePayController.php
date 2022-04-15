<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\PaymentMethods\DigitalWallets\Controller;

use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ApplePayController
{
    /**
     * @RouteScope(scopes={"storefront"})
     * @Route(
     *     "/.well-known/apple-developer-merchantid-domain-association",
     *     name="stripe-payment.apple-pay.domain-association",
     *     options={"seo"="false"},
     *     methods={"GET"}
     * )
     */
    public function domainAssociationFile(): Response
    {
        return new Response(
            file_get_contents(__DIR__ . '/../../../Resources/apple-developer-merchantid-domain-association')
        );
    }
}
