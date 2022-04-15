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

use Shopware\Core\System\SystemConfig\SystemConfigService;

class StripePluginConfigService
{
    private const CONFIG_DOMAIN = 'StripeShopwarePayment.config';

    private SystemConfigService $systemConfigService;

    public function __construct(SystemConfigService $systemConfigService)
    {
        $this->systemConfigService = $systemConfigService;
    }

    public function getStripePluginConfigForSalesChannel(?string $salesChannelId = null): StripePluginConfig
    {
        $rawConfig = $this->systemConfigService->get(self::CONFIG_DOMAIN, $salesChannelId);

        return new StripePluginConfig($rawConfig ?? [], true /* inherited */);
    }

    public function getStripePluginConfigForSalesChannelWithoutInheritance(
        ?string $salesChannelId = null
    ): StripePluginConfig {
        $rawConfig = $this->systemConfigService->getDomain(
            self::CONFIG_DOMAIN,
            $salesChannelId,
            false // no inheritance
        );

        $rawConfig = self::stripDomainFromKeys($rawConfig, self::CONFIG_DOMAIN);

        return new StripePluginConfig($rawConfig ?? [], false /* not inherited */);
    }

    public function setStripePluginConfigForSalesChannel(
        StripePluginConfig $stripePluginConfig,
        ?string $salesChannelId = null
    ): void {
        if ($stripePluginConfig->isInherited()) {
            throw new \InvalidArgumentException('Only a non-inherited configuration can be saved.');
        }
        foreach ($stripePluginConfig->getRawConfig() as $configKey => $configValue) {
            $this->systemConfigService->set(self::CONFIG_DOMAIN . '.' . $configKey, $configValue, $salesChannelId);
        }
    }

    private static function stripDomainFromKeys(array $array, string $domain): array
    {
        $arrayWithStrippedDomain = [];
        foreach ($array as $key => $value) {
            $arrayWithStrippedDomain[str_replace($domain . '.', '', $key)] = $value;
        }

        return $arrayWithStrippedDomain;
    }
}
