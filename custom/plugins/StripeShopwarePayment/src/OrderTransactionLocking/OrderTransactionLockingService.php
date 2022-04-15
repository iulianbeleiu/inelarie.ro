<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\OrderTransactionLocking;

use Doctrine\DBAL\Connection;

class OrderTransactionLockingService
{
    /**
     * @var Connection
     */
    private $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function executeWithLockedOrderTransaction(string $orderTransactionId, callable $callable): void
    {
        $this->connection->transactional(function () use ($orderTransactionId, $callable) {
            $lockedOrderTransactionId = $this->connection->executeQuery(
                'SELECT LOWER(HEX(id)) as id
                FROM order_transaction
                WHERE order_transaction.id = UNHEX(?)
                FOR UPDATE',
                [
                    $orderTransactionId,
                ]
            )->fetch()['id'] ?? null;
            if (!$lockedOrderTransactionId) {
                throw OrderTransactionLockingException::orderTransactionNotFound($orderTransactionId);
            }

            $callable();
        });
    }
}
