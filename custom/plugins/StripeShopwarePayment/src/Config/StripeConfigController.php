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

use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class StripeConfigController
{
    private LoggerInterface $logger;
    private StripeApiFactory $stripeApiFactory;
    private StripePluginConfigService $stripePluginConfigService;

    public function __construct(
        StripeApiFactory $stripeApiFactory,
        LoggerInterface $logger,
        StripePluginConfigService $stripePluginConfigService
    ) {
        $this->stripeApiFactory = $stripeApiFactory;
        $this->logger = $logger;
        $this->stripePluginConfigService = $stripePluginConfigService;
    }

    /**
     * @RouteScope(scopes={"api"})
     * @Route(
     *     "/api/_action/stripe-payment/validate-secret-key",
     *     name="api.action.stripe-payment.validate-secret-key",
     *     methods={"POST"}
     * )
     * @param Request $request
     * @return JsonResponse
     */
    public function validateSecretKey(Request $request): JsonResponse
    {
        $requestBody = json_decode($request->getContent(), true);
        $stripeApi = $this->stripeApiFactory->createStripeApiForSecretKey($requestBody['stripeSecretKey']);
        $isSecretKeyValid = $stripeApi->isSecretKeyValid();

        $logMessage = 'A Stripe secret key was validated via API. Validation result: ';
        if ($isSecretKeyValid) {
            $logMessage .= 'The Stripe API secret key is valid.';
        } else {
            $logMessage .= 'The Stripe API secret key is invalid.';
        }
        $this->logger->info($logMessage);

        return new JsonResponse($isSecretKeyValid);
    }

    /**
     * @RouteScope(scopes={"api"})
     * @Route(
     *     "/api/_action/stripe-payment/update-stripe-account-country",
     *     name="api.action.stripe-payment.update-stripe-account-country",
     *     methods={"POST"}
     * )
     */
    public function updateStripeAccountCountry(Request $request): Response
    {
        $requestBody = json_decode($request->getContent(), true);
        $salesChannelId = $requestBody['salesChannelId'] ?? null;
        $stripePluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannelWithoutInheritance(
            $salesChannelId
        );
        if ($stripePluginConfig->getStripeSecretKey() === null) {
            $stripePluginConfig->setStripeAccountCountryIso(null);
        } else {
            $api = $this->stripeApiFactory->createStripeApiForSecretKey($stripePluginConfig->getStripeSecretKey());
            $account = $api->getAccount();
            $stripePluginConfig->setStripeAccountCountryIso($account->country);
        }

        $this->stripePluginConfigService->setStripePluginConfigForSalesChannel(
            $stripePluginConfig,
            $salesChannelId
        );

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
