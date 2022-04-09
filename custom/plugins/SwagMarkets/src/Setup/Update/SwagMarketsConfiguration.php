<?php declare(strict_types=1);


namespace Swag\Markets\Setup\Update;


use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Symfony\Component\DependencyInjection\ContainerInterface;

class SwagMarketsConfiguration
{
    /** @var ContainerInterface */
    private $container;

    /** @var UpdateContext */
    private $updateContext;

    /**
     * @param ContainerInterface $container
     * @param UpdateContext $updateContext
     */
    public function __construct(ContainerInterface $container, UpdateContext $updateContext)
    {
        $this->container = $container;
        $this->updateContext = $updateContext;
    }

    public function addSwagMarketsActiveStateConfiguration()
    {
        $configRepository = $this->container->get('bf_config.repository');

        $configRepository->upsert(
            [
                [
                    'configurationKey' => 'swagMarkets_active_state',
                    'configurationValue' => [
                        'active' => true
                    ]
                ]
            ], $this->updateContext->getContext()
        );
    }
}
