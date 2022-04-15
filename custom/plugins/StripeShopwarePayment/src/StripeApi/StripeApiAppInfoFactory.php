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

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;

class StripeApiAppInfoFactory
{
    /**
     * @var EntityRepositoryInterface
     */
    private $salesChannelRepository;

    /**
     * @var string
     */
    private $pluginVersion;

    public function __construct(
        EntityRepositoryInterface $salesChannelRepository,
        string $pluginVersion
    ) {
        $this->salesChannelRepository = $salesChannelRepository;
        $this->pluginVersion = $pluginVersion;
    }

    public function createStripeApiAppInfoForSalesChannel(Context $context, ?string $salesChannelId = null): StripeApiAppInfo
    {
        return new StripeApiAppInfo(
            $this->pluginVersion,
            $salesChannelId ? $this->getHostUrlForSalesChannel($context, $salesChannelId) : null
        );
    }

    public function createStripeApiAppInfo(): StripeApiAppInfo
    {
        return new StripeApiAppInfo($this->pluginVersion);
    }

    private function getHostUrlForSalesChannel(Context $context, string $salesChannelId): ?string
    {
        $criteria = new Criteria([$salesChannelId]);
        $criteria->addAssociation('domains');

        /** @var SalesChannelEntity $salesChannel */
        $salesChannel = $this->salesChannelRepository->search($criteria, $context)->first();
        $domains = $salesChannel->getDomains();
        $languageId = $salesChannel->getLanguageId();

        foreach ($domains as $domain) {
            if ($domain->getLanguageId() === $languageId) {
                return $domain->getUrl();
            }
        }

        return null;
    }
}
