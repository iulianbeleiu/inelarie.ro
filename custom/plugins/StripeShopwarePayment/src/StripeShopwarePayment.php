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

use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\DeactivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\Plugin\Util\PluginIdProvider;
use Stripe\ShopwarePayment\Installation\StripePaymentInstaller;
use Stripe\ShopwarePayment\Payment\DependencyInjection\SourcePaymentConfiguratorRegistryCompilerPass;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\XmlFileLoader;

if (file_exists(__DIR__ . '/../autoload-dist/vendor/autoload.php')) {
    // The file does not exist if the plugin was installed via composer require of the Shopware project
    require_once(__DIR__ . '/../autoload-dist/vendor/autoload.php');
}

class StripeShopwarePayment extends Plugin
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        $loader = new XmlFileLoader($container, new FileLocator(__DIR__));
        $loader->load('Commands/DependencyInjection/commands.xml');
        $loader->load('Config/DependencyInjection/service.xml');
        $loader->load('Config/DependencyInjection/controller.xml');
        $loader->load('CookieConsent/DependencyInjection/service.xml');
        $loader->load('Logging/DependencyInjection/service.xml');
        $loader->load('Payment/DependencyInjection/controller.xml');
        $loader->load('Payment/DependencyInjection/service.xml');
        $loader->load('Payment/DependencyInjection/subscriber.xml');
        $loader->load('PaymentMethods/Bancontact/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/Card/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/Card/DependencyInjection/subscriber.xml');
        $loader->load('PaymentMethods/DigitalWallets/DependencyInjection/controller.xml');
        $loader->load('PaymentMethods/DigitalWallets/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/DigitalWallets/DependencyInjection/subscriber.xml');
        $loader->load('PaymentMethods/Eps/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/Giropay/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/Ideal/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/Klarna/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/P24/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/Sepa/DependencyInjection/service.xml');
        $loader->load('PaymentMethods/Sepa/DependencyInjection/subscriber.xml');
        $loader->load('PaymentMethods/Sofort/DependencyInjection/service.xml');
        $loader->load('Session/DependencyInjection/service.xml');
        $loader->load('StripeApi/DependencyInjection/service.xml');
        $loader->load('Webhook/DependencyInjection/service.xml');
        $loader->load('OrderTransactionLocking/DependencyInjection/service.xml');

        $composerJsonPath = __DIR__ . '/../composer.json';
        $container->addCompilerPass(new PluginVersionCompilerPass($composerJsonPath));
        $container->addCompilerPass(new SourcePaymentConfiguratorRegistryCompilerPass());
    }

    public function postInstall(InstallContext $installContext): void
    {
        $installer = new StripePaymentInstaller(
            $installContext->getContext(),
            $this->container->get(PluginIdProvider::class),
            $this->container->get('payment_method.repository'),
            $this->container->get('language.repository')
        );
        $installer->postInstall();

        parent::postInstall($installContext);
    }

    public function postUpdate(UpdateContext $updateContext): void
    {
        $installer = new StripePaymentInstaller(
            $updateContext->getContext(),
            $this->container->get(PluginIdProvider::class),
            $this->container->get('payment_method.repository'),
            $this->container->get('language.repository')
        );
        $installer->postUpdate();

        parent::postUpdate($updateContext);
    }

    public function activate(ActivateContext $activateContext): void
    {
        $installer = new StripePaymentInstaller(
            $activateContext->getContext(),
            $this->container->get(PluginIdProvider::class),
            $this->container->get('payment_method.repository'),
            $this->container->get('language.repository')
        );
        $installer->activate();

        parent::activate($activateContext);
    }

    public function deactivate(DeactivateContext $deactivateContext): void
    {
        $installer = new StripePaymentInstaller(
            $deactivateContext->getContext(),
            $this->container->get(PluginIdProvider::class),
            $this->container->get('payment_method.repository'),
            $this->container->get('language.repository')
        );
        $installer->deactivate();

        parent::deactivate($deactivateContext);
    }
}
