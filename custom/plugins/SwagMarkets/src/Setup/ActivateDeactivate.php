<?php


namespace Swag\Markets\Setup;

use Doctrine\DBAL\DBALException;
use Shopware\Core\Framework\DataAbstractionLayer\Exception\InconsistentCriteriaIdsException;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Shopware\Core\Framework\Plugin\Context\DeactivateContext;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Swag\Markets\Service\ActivationService;
use Swag\Markets\Service\DeactivationService;

class ActivateDeactivate
{
    /**
     * @var ActivationService $activationService
     */
    private $activationService;

    /**
     * @var DeactivationService $deactivationService
     */
    private $deactivationService;

    /**
     * @param ActivationService $activationService
     * @param DeactivationService $deactivationService
     */
    public function __construct(
        ActivationService $activationService,
        DeactivationService $deactivationService
    ) {
        $this->activationService = $activationService;
        $this->deactivationService = $deactivationService;
    }

    /**
     * @param \Shopware\Core\Framework\Plugin\Context\ActivateContext $context
     * @return void
     */
    public function activate(ActivateContext $context): void
    {
        $this->activationService->activate($context);
    }

    /**
     * @param UninstallContext $context
     * @return void
     * @throws InconsistentCriteriaIdsException
     * @throws DBALException
     *
     * @throws DBALException
     */
    public function deactivate(UninstallContext $context): void
    {
        $this->deactivationService->deactivate($context);
    }
}
