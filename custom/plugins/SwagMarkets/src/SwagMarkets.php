<?php
declare(strict_types=1);

namespace Swag\Markets;

use Doctrine\DBAL\DBALException;
use Exception;
use Shopware\Core\Framework\DataAbstractionLayer\Exception\InconsistentCriteriaIdsException;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\DeactivateContext;
use Shopware\Core\Framework\Plugin\Context\InstallContext;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Swag\Markets\Service\UninstallService;
use Swag\Markets\Service\UpdateService;
use Swag\Markets\Setup\ActivateDeactivate;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\XmlFileLoader;

class SwagMarkets extends Plugin
{
    /**
     * @var ActivateDeactivate
     */
    private $activateDeactivate;

    /**
     * @Required
     *
     * @param ActivateDeactivate $activateDeactivate
     */
    public function setActivate(ActivateDeactivate $activateDeactivate): void
    {
        $this->activateDeactivate = $activateDeactivate;
    }

    /**
     * @param ContainerBuilder $container
     * @throws Exception
     */
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        $loader = new XmlFileLoader($container, new FileLocator(__DIR__ . '/DependencyInjection'));
        $loader->load('installment.xml');
    }

    /**
     * @return string
     */
    public function getServicesFilePath(): string
    {
        return 'DependencyInjection/subscribers.xml';
    }

    /**
     * @param InstallContext $installContext
     */
    public function install(InstallContext $installContext): void
    {
        parent::install($installContext);
    }

    /**
     * @param  UninstallContext  $uninstallContext
     * @throws DBALException
     * @throws \ErrorException
     */
    public function uninstall(UninstallContext $uninstallContext): void
    {
        (new UninstallService($uninstallContext, $this->container))->uninstall();
        parent::uninstall($uninstallContext);
    }

    /**
     * @param ActivateContext $activateContext
     */
    public function activate(ActivateContext $activateContext): void
    {
        $this->activateDeactivate->activate($activateContext);

        parent::activate($activateContext);
    }

    /**
     * @param DeactivateContext $deactivateContext
     * @throws InconsistentCriteriaIdsException
     */
    public function deactivate(DeactivateContext $deactivateContext): void
    {
        parent::deactivate($deactivateContext);
    }

    /**
     * @param UpdateContext $updateContext
     */
    public function update(UpdateContext $updateContext): void
    {
        (new UpdateService())->update($updateContext, $this->container);
    }
}
