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

use Stripe\Account;
use Stripe\Charge;
use Stripe\Customer;
use Stripe\Event;
use Stripe\Exception\AuthenticationException;
use Stripe\Mandate;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\ShopwarePayment\Payment\PaymentIntentPaymentConfig\PaymentIntentConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\ChargeConfig;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourceConfig;
use Stripe\Source;
use Stripe\Stripe;
use Stripe\Token;
use Stripe\Webhook;
use Stripe\WebhookEndpoint;

class StripeApi
{
    public const STRIPE_PLATFORM_NAME = 'UMXJ4nBknsWR3LN_shopware_v50';

    public const API_VERSION = '2020-03-02';

    public const MAXIMUM_STATEMENT_DESCRIPTOR_LENGTH = 35;

    /**
     * @var StripeApiCredentials
     */
    private $stripeApiCredentials;

    /**
     * @var StripeApiAppInfo
     */
    private $stripeApiAppInfo;

    public function __construct(
        StripeApiCredentials $stripeApiCredentials,
        StripeApiAppInfo $stripeApiAppInfo
    ) {
        $this->stripeApiCredentials = $stripeApiCredentials;
        $this->stripeApiAppInfo = $stripeApiAppInfo;

        Stripe::setApiVersion(self::API_VERSION);
    }

    public function getSavedCardsOfStripeCustomer(string $stripeCustomerId): array
    {
        $cardPaymentMethods = $this->getSavedPaymentMethodsOfStripeCustomer($stripeCustomerId, 'card');

        return array_map(
            function ($paymentMethod) {
                return [
                    'id' => $paymentMethod->id,
                    'name' => $paymentMethod->billing_details->name,
                    'brand' => $paymentMethod->card->brand,
                    'last4' => $paymentMethod->card->last4,
                    'exp_month' => $paymentMethod->card->exp_month,
                    'exp_year' => $paymentMethod->card->exp_year,
                ];
            },
            $cardPaymentMethods
        );
    }

    public function getSavedSepaBankAccountsOfStripeCustomer(string $stripeCustomerId): array
    {
        $sepaPaymentMethods = $this->getSavedPaymentMethodsOfStripeCustomer($stripeCustomerId, 'sepa_debit');

        return array_map(
            function ($paymentMethod) {
                return [
                    'id' => $paymentMethod->id,
                    'name' => $paymentMethod->billing_details->name,
                    'country' => $paymentMethod->sepa_debit->country,
                    'last4' => $paymentMethod->sepa_debit->last4,
                ];
            },
            $sepaPaymentMethods
        );
    }

    public function isSecretKeyValid(): bool
    {
        $this->initializeStripeApi();

        try {
            // Verify the secret key by creating a one time use personal id. This does not affect any other stripe
            // resources and does not have any other side effects.
            Token::create([
                'pii' => [
                    'personal_id_number' => 'test',
                ],
            ]);

            return true;
        } catch (AuthenticationException $e) {
            return false;
        }
    }

    public function createPaymentMethod(array $params): PaymentMethod
    {
        $this->initializeStripeApi();

        return PaymentMethod::create(self::insertPlatformNameIntoMetadata($params));
    }

    public function getMandate(string $id): Mandate
    {
        $this->initializeStripeApi();

        return Mandate::retrieve($id);
    }

    public function getPaymentIntent(string $id): PaymentIntent
    {
        $this->initializeStripeApi();

        return PaymentIntent::retrieve($id);
    }

    public function createPaymentIntent(PaymentIntentConfig $paymentIntentConfig): PaymentIntent
    {
        $this->initializeStripeApi();

        return PaymentIntent::create(self::insertPlatformNameIntoMetadata($paymentIntentConfig->toArray()));
    }

    public function updateWebhook(string $id, array $params): WebhookEndpoint
    {
        $this->initializeStripeApi();

        return WebhookEndpoint::update($id, $params);
    }

    public function getWebhook(string $id): WebhookEndpoint
    {
        $this->initializeStripeApi();

        return WebhookEndpoint::retrieve($id);
    }

    public function createWebhook(array $params): WebhookEndpoint
    {
        $this->initializeStripeApi();

        return WebhookEndpoint::create($params);
    }

    public function getSource(string $id): Source
    {
        $this->initializeStripeApi();

        return Source::retrieve($id);
    }

    public function createSource(SourceConfig $sourceConfig): Source
    {
        $this->initializeStripeApi();

        return Source::create(self::insertPlatformNameIntoMetadata($sourceConfig->toArray()));
    }

    public function getCharge(string $id): Charge
    {
        $this->initializeStripeApi();

        return Charge::retrieve($id);
    }

    public function createCharge(ChargeConfig $chargeConfig): Charge
    {
        $this->initializeStripeApi();

        return Charge::create(self::insertPlatformNameIntoMetadata($chargeConfig->toArray()));
    }

    public function getPaymentMethod(string $paymentMethodId): PaymentMethod
    {
        $this->initializeStripeApi();

        return PaymentMethod::retrieve($paymentMethodId);
    }

    public function getCustomer(string $stripeCustomerId): Customer
    {
        $this->initializeStripeApi();

        return Customer::retrieve($stripeCustomerId);
    }

    public function createCustomer(array $params): Customer
    {
        $this->initializeStripeApi();

        return Customer::create(self::insertPlatformNameIntoMetadata($params));
    }

    public function createWebhookEvent(string $webhookPayload, string $webhookSignature): Event
    {
        $this->initializeStripeApi();

        return Webhook::constructEvent($webhookPayload, $webhookSignature, $this->stripeApiCredentials->webhookSecret);
    }

    private function getSavedPaymentMethodsOfStripeCustomer(string $stripeCustomerId, string $paymentMethodType): array
    {
        $this->initializeStripeApi();

        $paymentMethods = PaymentMethod::all([
            'customer' => $stripeCustomerId,
            'type' => $paymentMethodType,
        ])->data;

        // Sort the payment methods by id (which correspond to the date, the payment method was created/added)
        usort($paymentMethods, function ($paymentMethodA, $paymentMethodB) {
            return $paymentMethodA->id <=> $paymentMethodB->id;
        });

        return $paymentMethods;
    }

    private function initializeStripeApi(): void
    {
        Stripe::setApiKey($this->stripeApiCredentials->secretKey);
        Stripe::setAppInfo(
            self::STRIPE_PLATFORM_NAME,
            $this->stripeApiAppInfo->appVersion,
            $this->stripeApiAppInfo->appUrl
        );
    }

    private static function insertPlatformNameIntoMetadata(array $params): array
    {
        $params['metadata'] = array_replace_recursive(
            $params['metadata'] ?? [],
            ['platform_name' => self::STRIPE_PLATFORM_NAME]
        );

        return $params;
    }

    public function getAccount(): Account
    {
        $this->initializeStripeApi();

        return Account::retrieve();
    }
}
