<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\CookieConsent;

use Shopware\Storefront\Framework\Cookie\CookieProviderInterface;

class StripeCookieProvider implements CookieProviderInterface
{
    /**
     * @var CookieProviderInterface
     */
    private $decoratedInstance;

    public function __construct(CookieProviderInterface $decoratedInstance)
    {
        $this->decoratedInstance = $decoratedInstance;
    }

    private const REQUIRED_COOKIES = [
        [
            'snippet_name' => 'stripe-shopware-payment.cookies.session',
            'cookie' => 'session',
        ],
        [
            'snippet_name' => 'stripe-shopware-payment.cookies.session',
            'cookie' => 'cid',
            'hidden' => true,
        ],
        [
            'snippet_name' => 'stripe-shopware-payment.cookies.fraud-prevention',
            'cookie' => '__stripe_mid',
        ],
        [
            'snippet_name' => 'stripe-shopware-payment.cookies.fraud-prevention',
            'cookie' => 'muid',
            'hidden' => true,
        ],
        [
            'snippet_name' => 'stripe-shopware-payment.cookies.fraud-prevention',
            'cookie' => '__stripe_sid',
            'hidden' => true,
        ],
        [
            'snippet_name' => 'stripe-shopware-payment.cookies.fraud-prevention',
            'cookie' => 'sid',
            'hidden' => true,
        ],
    ];

    public function getCookieGroups(): array
    {
        $cookieGroups = $this->decoratedInstance->getCookieGroups();
        foreach ($cookieGroups as &$cookieGroup) {
            if ($cookieGroup['snippet_name'] === 'cookie.groupRequired') {
                $cookieGroup['entries'] = array_merge($cookieGroup['entries'], self::REQUIRED_COOKIES);
            }
        }

        return $cookieGroups;
    }
}
