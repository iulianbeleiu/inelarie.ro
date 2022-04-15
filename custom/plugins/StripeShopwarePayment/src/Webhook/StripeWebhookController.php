<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Webhook;

use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Stripe\Exception\ExceptionInterface as StripeExceptionInterface;
use Stripe\ShopwarePayment\OrderTransactionLocking\OrderTransactionLockingException;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class StripeWebhookController
{
    /**
     * @var StripeApiFactory
     */
    private $stripeApiFactory;

    /**
     * @var StripeWebhookEventDispatcher
     */
    private $stripeWebhookEventDispatcher;

    /**
     * @var StripeWebhookRegistrationService
     */
    private $stripeWebhookRegistrationService;

    /**
     * @var LoggerInterface
     */
    private $logger;

    public function __construct(
        StripeApiFactory $stripeApiFactory,
        StripeWebhookEventDispatcher $stripeWebhookEventDispatcher,
        StripeWebhookRegistrationService $stripeWebhookRegistrationService,
        LoggerInterface $logger
    ) {
        $this->stripeApiFactory = $stripeApiFactory;
        $this->stripeWebhookEventDispatcher = $stripeWebhookEventDispatcher;
        $this->stripeWebhookRegistrationService = $stripeWebhookRegistrationService;
        $this->logger = $logger;
    }

    /**
     * @RouteScope(scopes={"api"})
     * @Route(
     *     "/api/_action/stripe-payment/register-webhook",
     *     name="api.action.stripe-payment.register-webhook",
     *     methods={"PUT"}
     * )
     * @param Request $request
     * @param Context $context
     * @return JsonResponse
     */
    public function registerWebhook(Request $request, Context $context): JsonResponse
    {
        $requestBody = json_decode($request->getContent(), true);
        try {
            $result = $this->stripeWebhookRegistrationService->registerWebhook(
                $context,
                $requestBody['salesChannelId'] ?? null
            );

            return new JsonResponse(['result' => $result]);
        } catch (StripeExceptionInterface $e) {
            return new JsonResponse(['result' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @RouteScope(scopes={"storefront"})
     * @Route(
     *     "/stripe-payment/webhook/execute",
     *     name="frontend.stripe-payment.webhook.execute",
     *     methods={"POST"},
     *     defaults={"csrf_protected"=false}
     * )
     *
     * @param Request $request
     * @param Context $context
     * @return Response
     */
    public function executeWebhook(Request $request, Context $context): Response
    {
        $webhookSignature = $request->headers->get('stripe-signature');
        if (!$webhookSignature) {
            return new Response('Missing stripe-signature header', Response::HTTP_BAD_REQUEST);
        }
        $webhookPayload = $request->getContent();
        if (!$webhookPayload) {
            return new Response('Missing webhook payload', Response::HTTP_BAD_REQUEST);
        }

        $salesChannelId = $context->getSource()->getSalesChannelId();
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);

        try {
            $event = $stripeApi->createWebhookEvent($webhookPayload, $webhookSignature);
        } catch (StripeExceptionInterface $e) {
            $this->logger->error(
                'Received an invalid Stripe webhook request and could not process the event because of the '
                . 'following error: ' . $e->getMessage(),
                [
                    'webhookPayload' => $webhookPayload,
                    'webhookSignature' => $webhookSignature,
                    'exceptionStackTrace' => $e->getTraceAsString(),
                    'exception' => $e,
                ]
            );

            return new Response('Invalid stripe event', Response::HTTP_BAD_REQUEST);
        }

        try {
            $this->stripeWebhookEventDispatcher->dispatch($event, $context);
        } catch (OrderTransactionLockingException | WebhookException $e) {
            $this->logger->error(
                $e->getMessage(),
                [
                    'event' => $event,
                    'exception' => $e,
                ]
            );

            // Return HTTP status 200 because Stripe expects Webhook delivery to always return 2XX
            // https://stripe.com/docs/webhooks/build#return-a-2xx-status-code-quickly
            return new Response($e->getMessage(), Response::HTTP_OK);
        }

        return new Response('', Response::HTTP_OK);
    }
}
