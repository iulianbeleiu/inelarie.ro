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

use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Stripe\ShopwarePayment\StripeApi\StripeApi;

class StripeOrderService
{
    private StripePluginConfigService $stripePluginConfigService;
    private EntityRepositoryInterface $orderRepository;

    public function __construct(
        StripePluginConfigService $stripePluginConfigService,
        EntityRepositoryInterface $orderRepository
    ) {
        $this->stripePluginConfigService = $stripePluginConfigService;
        $this->orderRepository = $orderRepository;
    }

    public function getStatementDescriptor(string $orderId, Context $context): string
    {
        $criteria = new Criteria([$orderId]);
        $criteria->addAssociations(['salesChannel']);
        /** @var OrderEntity $order */
        $order = $this->orderRepository->search(
            $criteria,
            $context
        )->first();
        $config = $this->stripePluginConfigService->getStripePluginConfigForSalesChannel($order->getSalesChannel()->getId());

        $statementDescriptorSuffix = $config->getStatementDescriptor() ?: $order->getSalesChannel()->getName();
        $statementDescriptor = trim(sprintf('Ref. %s %s', $order->getOrderNumber(), $statementDescriptorSuffix ?: ''));

        // Strip all characters that are not allowed in statement descriptors
        $statementDescriptor = preg_replace('/[\\<\\>\\/\\(\\)\\{\\}\'"]/', '', $statementDescriptor);

        return mb_substr($statementDescriptor, 0, StripeApi::MAXIMUM_STATEMENT_DESCRIPTOR_LENGTH);
    }
}
