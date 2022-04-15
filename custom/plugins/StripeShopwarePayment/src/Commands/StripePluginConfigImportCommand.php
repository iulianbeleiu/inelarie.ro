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

use Stripe\ShopwarePayment\Config\StripePluginConfig;
use Stripe\ShopwarePayment\Config\StripePluginConfigService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Yaml\Yaml;

class StripePluginConfigImportCommand extends Command
{
    /**
     * @var StripePluginConfigService
     */
    private $stripePluginConfigService;

    public function __construct(StripePluginConfigService $stripePluginConfigService)
    {
        parent::__construct();
        $this->stripePluginConfigService = $stripePluginConfigService;
    }

    protected function configure(): void
    {
        $this->setName('stripe:config:import');
        $this->setDescription('Imports the Stripe plugin configuration from a YAML file');
        $this->addArgument('file', InputArgument::REQUIRED, 'Path to a YAML file containing the configuration to import.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Stripe plugin config import');

        $yamlFilePath = $input->getArgument('file');
        $pluginConfigArray = Yaml::parseFile($yamlFilePath);
        $stripePluginConfig = new StripePluginConfig($pluginConfigArray, false);
        $this->stripePluginConfigService->setStripePluginConfigForSalesChannel($stripePluginConfig);

        $io->success(sprintf('Configuration from file "%s" has been imported successfully.', $yamlFilePath));

        return 0;
    }
}
