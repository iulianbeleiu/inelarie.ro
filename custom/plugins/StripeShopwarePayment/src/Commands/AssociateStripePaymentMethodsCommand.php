<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Commands;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\ContainsFilter;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class AssociateStripePaymentMethodsCommand extends Command
{
    /**
     * @var EntityRepositoryInterface
     */
    private $paymentMethodRepository;

    /**
     * @var EntityRepositoryInterface
     */
    private $salesChannelRepository;

    public function __construct(
        EntityRepositoryInterface $paymentMethodRepository,
        EntityRepositoryInterface $salesChannelRepository
    ) {
        parent::__construct();
        $this->paymentMethodRepository = $paymentMethodRepository;
        $this->salesChannelRepository = $salesChannelRepository;
    }

    protected function configure(): void
    {
        $this->setName('stripe:payment-methods:associate');
        $this->setDescription('Associates all Stripe payment methods with all sales channels');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Stripe payment methods association');
        $context = Context::createDefaultContext();

        $stripePaymentMethodIds = $this->paymentMethodRepository->searchIds(
            (new Criteria())->addFilter(new ContainsFilter(
                'handlerIdentifier',
                'stripe.shopware_payment.payment_handler'
            )),
            $context
        )->getIds();

        // Associate all stripe payment methods with all sales channels
        $salesChannels = $this->salesChannelRepository->search(
            (new Criteria())->addAssociation('paymentMethods'),
            $context
        )->getElements();
        /** @var SalesChannelEntity $salesChannel */
        foreach ($salesChannels as $salesChannel) {
            $paymentMethodIdsForSalesChannel = array_merge(
                $stripePaymentMethodIds,
                $salesChannel->getPaymentMethodIds()
            );
            $this->salesChannelRepository->update([
                [
                    'id' => $salesChannel->getId(),
                    'paymentMethods' => array_values(array_map(function (string $paymentMethodId) {
                        return [
                            'id' => $paymentMethodId,
                        ];
                    }, $paymentMethodIdsForSalesChannel)),
                ],
            ], $context);
        }

        $io->success('Stripe payment methods successfully associated with sales channels.');

        return 0;
    }
}
