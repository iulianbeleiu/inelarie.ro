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

use Shopware\Core\Framework\Context;
use Stripe\Exception\InvalidRequestException;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Stripe\ShopwarePayment\StripeApi\StripeApi;
use Stripe\ShopwarePayment\StripeApi\StripeApiFactory;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RouterInterface;

class StripeWebhookRegistrationService
{
    private const STRIPE_WEBHOOK_ROUTE = 'frontend.stripe-payment.webhook.execute';

    private const WEBHOOK_RESULT_CREATED = 'created';
    private const WEBHOOK_RESULT_UPDATED = 'updated';
    private const WEBHOOK_RESULT_NO_CHANGES = 'no_changes';

    /**
     * @var StripeApiFactory
     */
    private $stripeApiFactory;

    /**
     * @var StripePluginConfigService
     */
    private $stripePluginConfigService;

    /**
     * @var RouterInterface
     */
    private $router;

    public function __construct(
        StripeApiFactory $stripeApiFactory,
        StripePluginConfigService $stripePluginConfigService,
        RouterInterface $router
    ) {
        $this->stripeApiFactory = $stripeApiFactory;
        $this->stripePluginConfigService = $stripePluginConfigService;
        $this->router = $router;
    }

    /**
     * Ensures a stripe webhook exists, is up-to-date and persisted in the plugin configuration associated with the
     * supplied sales channel.
     *
     * @param Context $context
     * @param string|null $salesChannelId
     * @return string|null
     */
    public function registerWebhook(Context $context, ?string $salesChannelId): ?string
    {
        $stripePluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel($salesChannelId);
        $stripeWebhookId = $stripePluginConfig->getStripeWebhookId();
        if (!$stripeWebhookId) {
            return $this->createWebhook($context, $salesChannelId);
        }

        return $this->updateWebhook($context, $stripeWebhookId, $salesChannelId);
    }

    private function createWebhook(Context $context, ?string $salesChannelId): string
    {
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);
        $webhookUrl = $this->router->generate(
            self::STRIPE_WEBHOOK_ROUTE,
            [],
            UrlGeneratorInterface::ABSOLUTE_URL
        );
        $webhook = $stripeApi->createWebhook([
            'enabled_events' => StripeWebhookEventDispatcher::STRIPE_WEBHOOK_EVENTS,
            'url' => $webhookUrl,
            'api_version' => StripeApi::API_VERSION,
        ]);
        $stripePluginConfig = $this->stripePluginConfigService->getStripePluginConfigForSalesChannelWithoutInheritance(
            $salesChannelId
        );
        $stripePluginConfig->setStripeWebhookSecret($webhook->secret);
        $stripePluginConfig->setStripeWebhookId($webhook->id);
        $this->stripePluginConfigService->setStripePluginConfigForSalesChannel(
            $stripePluginConfig,
            $salesChannelId
        );

        return self::WEBHOOK_RESULT_CREATED;
    }

    private function updateWebhook(Context $context, string $stripeWebhookId, ?string $salesChannelId): ?string
    {
        $stripeApi = $this->stripeApiFactory->createStripeApiForSalesChannel($context, $salesChannelId);
        $webhook = null;
        try {
            $webhook = $stripeApi->getWebhook($stripeWebhookId);
        } catch (InvalidRequestException $e) {
            if (!isset($e->getJsonBody()['error']['code']) || $e->getJsonBody()['error']['code'] !== 'resource_missing') {
                throw $e;
            }
        }
        if (!$webhook) {
            $stripePluginConfig = $this
                ->stripePluginConfigService
                ->getStripePluginConfigForSalesChannelWithoutInheritance($salesChannelId);
            $stripePluginConfig->setStripeWebhookSecret('');
            $stripePluginConfig->setStripeWebhookId('');
            $this->stripePluginConfigService->setStripePluginConfigForSalesChannel(
                $stripePluginConfig,
                $salesChannelId
            );

            return $this->createWebhook($context, $salesChannelId);
        }
        $webhookUrl = $this->router->generate(
            self::STRIPE_WEBHOOK_ROUTE,
            [],
            UrlGeneratorInterface::ABSOLUTE_URL
        );
        $webhookUpdateParams = [];
        if ($webhook->url !== $webhookUrl) {
            $webhookUpdateParams['url'] = $webhookUrl;
        }
        if ($webhook->api_version !== StripeApi::API_VERSION) {
            $webhookUpdateParams['api_version'] = StripeApi::API_VERSION;
        }
        if (count(array_diff(StripeWebhookEventDispatcher::STRIPE_WEBHOOK_EVENTS, $webhook->enabled_events)) > 0) {
            $webhookUpdateParams['enabled_events'] = StripeWebhookEventDispatcher::STRIPE_WEBHOOK_EVENTS;
        }
        if (count($webhookUpdateParams) > 0) {
            $stripeApi->updateWebhook($stripeWebhookId, $webhookUpdateParams);

            return self::WEBHOOK_RESULT_UPDATED;
        }

        return self::WEBHOOK_RESULT_NO_CHANGES;
    }
}
