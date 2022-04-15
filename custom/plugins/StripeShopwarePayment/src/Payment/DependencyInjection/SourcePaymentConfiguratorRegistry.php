<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment\Payment\DependencyInjection;

use OutOfBoundsException;
use Stripe\ShopwarePayment\Payment\SourcePaymentConfig\SourcePaymentConfigurator;

class SourcePaymentConfiguratorRegistry
{
    /**
     * @var SourcePaymentConfigurator[]
     */
    private $sourcePaymentConfigurators = [];

    public function addSourcePaymentConfigurator(
        string $handlerIdentifier,
        SourcePaymentConfigurator $sourcePaymentConfigurator
    ): void {
        $this->sourcePaymentConfigurators[$handlerIdentifier] = $sourcePaymentConfigurator;
    }

    public function hasSourcePaymentConfigurator(string $handlerIdentifier): bool
    {
        return array_key_exists($handlerIdentifier, $this->sourcePaymentConfigurators);
    }

    public function getSourcePaymentConfiguratorByHandlerIdentifier(string $handlerIdentifier): SourcePaymentConfigurator
    {
        if (!$this->hasSourcePaymentConfigurator($handlerIdentifier)) {
            throw new OutOfBoundsException(sprintf(
                'SourcePaymentConfigurator for handler identifier "%s" is not installed',
                $handlerIdentifier
            ));
        }

        return $this->sourcePaymentConfigurators[$handlerIdentifier];
    }
}
