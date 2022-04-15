<?php
/*
 * Copyright (c) Pickware GmbH. All rights reserved.
 * This file is part of software that is released under a proprietary license.
 * You must not copy, modify, distribute, make publicly available, or execute
 * its contents or parts thereof without express permission by the copyright
 * holder, unless otherwise permitted by law.
 */

declare(strict_types=1);

namespace Stripe\ShopwarePayment;

use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class PluginVersionCompilerPass implements CompilerPassInterface
{
    /**
     * @var string
     */
    private $composerJsonPath;

    public function __construct(string $composerJsonPath)
    {
        $this->composerJsonPath = $composerJsonPath;
    }

    /**
     * @inheritDoc
     */
    public function process(ContainerBuilder $container)
    {
        $container->setParameter('stripe.shopware_payment.plugin_version', $this->getPluginVersion());
    }

    private function getPluginVersion(): string
    {
        $composerJsonString = file_get_contents($this->composerJsonPath);
        $composerJson = json_decode($composerJsonString, true);

        if (!isset($composerJson['version'])) {
            return 'dev';
        }

        return $composerJson['version'];
    }
}
