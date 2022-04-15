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

use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

class SourcePaymentConfiguratorRegistryCompilerPass implements CompilerPassInterface
{
    public function process(ContainerBuilder $container): void
    {
        $sourcePaymentConfiguratorRegistryDefinition = $container->findDefinition(
            SourcePaymentConfiguratorRegistry::class
        );
        $sourcePaymentConfigurators = $container->findTaggedServiceIds(
            'stripe.shopware_payment.source_payment_configurator'
        );
        foreach ($sourcePaymentConfigurators as $sourcePaymentConfiguratorClassName => $tagAttributes) {
            $handlerIdentifier = $tagAttributes[0]['forHandlerIdentifier'];
            $sourcePaymentConfiguratorRegistryDefinition->addMethodCall(
                'addSourcePaymentConfigurator',
                [
                    $handlerIdentifier,
                    new Reference($sourcePaymentConfiguratorClassName),
                ]
            );
        }
    }
}
