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

use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionDefinition;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\StateMachine\Aggregation\StateMachineTransition\StateMachineTransitionActions;
use Shopware\Core\System\StateMachine\Exception\IllegalTransitionException;
use Shopware\Core\System\StateMachine\Exception\StateMachineInvalidEntityIdException;
use Shopware\Core\System\StateMachine\StateMachineRegistry;
use Shopware\Core\System\StateMachine\Transition;

class IdempotentOrderTransactionStateHandler
{
    public const STATE_TRANSITION_ACTION_MAPPINGS = [
        OrderTransactionStates::STATE_PAID => StateMachineTransitionActions::ACTION_PAID,
        OrderTransactionStates::STATE_CANCELLED => StateMachineTransitionActions::ACTION_CANCEL,
        OrderTransactionStates::STATE_FAILED => StateMachineTransitionActions::ACTION_FAIL,
    ];

    /**
     * @var EntityRepositoryInterface
     */
    private $orderTransactionRepository;

    /**
     * @var StateMachineRegistry
     */
    private $stateMachineRegistry;

    public function __construct(
        StateMachineRegistry $stateMachineRegistry,
        EntityRepositoryInterface $orderTransactionRepository
    ) {
        $this->stateMachineRegistry = $stateMachineRegistry;
        $this->orderTransactionRepository = $orderTransactionRepository;
    }

    public function paid(string $orderTransactionId, Context $context): void
    {
        $this->transitionIdempotently($orderTransactionId, OrderTransactionStates::STATE_PAID, $context);
    }

    public function cancel(string $orderTransactionId, Context $context): void
    {
        $this->transitionIdempotently($orderTransactionId, OrderTransactionStates::STATE_CANCELLED, $context);
    }

    public function fail(string $orderTransactionId, Context $context): void
    {
        $this->transitionIdempotently($orderTransactionId, OrderTransactionStates::STATE_FAILED, $context);
    }

    private function transitionIdempotently(
        string $orderTransactionId,
        string $desiredState,
        Context $context
    ): void {
        try {
            $this->stateMachineRegistry->transition(
                new Transition(
                    OrderTransactionDefinition::ENTITY_NAME,
                    $orderTransactionId,
                    self::STATE_TRANSITION_ACTION_MAPPINGS[$desiredState],
                    'stateId'
                ),
                $context
            );
        } catch (IllegalTransitionException $e) {
            $orderTransaction = $this->fetchOrderTransaction($orderTransactionId, $context);
            if (!$orderTransaction) {
                throw new StateMachineInvalidEntityIdException(
                    OrderTransactionDefinition::ENTITY_NAME,
                    $orderTransactionId
                );
            }
            if ($orderTransaction->getStateMachineState()->getTechnicalName() === $desiredState) {
                return;
            }

            throw $e;
        }
    }

    private function fetchOrderTransaction(string $orderTransactionId, Context $context): ?OrderTransactionEntity
    {
        $criteria = new Criteria([$orderTransactionId]);
        $criteria->addAssociations([
            'stateMachineState',
        ]);

        return $this->orderTransactionRepository->search($criteria, $context)->first();
    }
}
