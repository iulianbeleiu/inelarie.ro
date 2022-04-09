<?php declare(strict_types=1);


namespace Swag\Markets\Service;


use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Swag\Markets\Setup\Update\AmazonPaymentMethod;
use Swag\Markets\Setup\Update\EbayPaymentMethod;
use Swag\Markets\Setup\Update\SwagMarketsConfiguration;
use Symfony\Component\DependencyInjection\ContainerInterface;

class UpdateService
{
    /**
     * @param UpdateContext $updateContext
     * @param ContainerInterface $container
     */
    public function update(UpdateContext $updateContext, ContainerInterface $container)
    {
        if (version_compare($updateContext->getCurrentPluginVersion(), '1.2.0', '<')) {
            (new AmazonPaymentMethod($container, $updateContext))->update();
        }

        if (version_compare($updateContext->getCurrentPluginVersion(), '1.2.2', '<')) {
            (new AmazonPaymentMethod($container, $updateContext))->updatePaymentMethodName();
        }

        if (version_compare($updateContext->getCurrentPluginVersion(), '1.2.5', '<')) {
            (new SwagMarketsConfiguration($container, $updateContext))->addSwagMarketsActiveStateConfiguration();
        }

        if (version_compare($updateContext->getCurrentPluginVersion(), '1.3.0', '<')) {
            (new EbayPaymentMethod($container, $updateContext))->update();
        }
    }
}
