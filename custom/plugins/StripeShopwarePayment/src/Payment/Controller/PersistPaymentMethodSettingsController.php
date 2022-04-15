<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\Controller;

use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Stripe\ShopwarePayment\Session\StripePaymentMethodSettings;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PersistPaymentMethodSettingsController
{
    /**
     * @var StripePaymentMethodSettings
     */
    private $stripePaymentMethodSettings;

    public function __construct(StripePaymentMethodSettings $stripePaymentMethodSettings)
    {
        $this->stripePaymentMethodSettings = $stripePaymentMethodSettings;
    }

    /**
     * @RouteScope(scopes={"storefront"})
     * @Route(
     *     "/stripe-payment/payment-method-settings",
     *     name="frontend.stripe-payment.payment-method-settings",
     *     options={"seo"="false"},
     *     methods={"PATCH"},
     *     defaults={"XmlHttpRequest"=true}
     * )
     * @param Request $request
     * @return Response
     */
    public function updatePaymentMethodSettings(Request $request): Response
    {
        if ($request->get('card')) {
            $this->stripePaymentMethodSettings->setSelectedCard($request->get('card'));
        }
        if ($request->get('saveCardForFutureCheckouts')) {
            $this->stripePaymentMethodSettings->setIsSaveCardForFutureCheckouts(
                $request->get('saveCardForFutureCheckouts')
            );
        }
        if ($request->get('sepaBankAccount')) {
            $this->stripePaymentMethodSettings->setSelectedSepaBankAccount($request->get('sepaBankAccount'));
        }
        if ($request->get('saveSepaBankAccountForFutureCheckouts')) {
            $this->stripePaymentMethodSettings->setIsSaveSepaBankAccountForFutureCheckouts(
                $request->get('saveSepaBankAccountForFutureCheckouts')
            );
        }

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
