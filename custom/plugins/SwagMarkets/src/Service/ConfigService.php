<?php

declare(strict_types=1);

namespace Swag\Markets\Service;


use Swag\Markets\Entity\Config\SwagMarketsConfigurationEntity;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;

class ConfigService
{
    /**
     * @var EntityRepositoryInterface
     */
    private $configRepository;

    /**
     * @param EntityRepositoryInterface $configRepository
     */
    public function __construct(EntityRepositoryInterface $configRepository)
    {
        $this->configRepository = $configRepository;
    }

    /**
     * @return array
     */
    public function getBySalesChannelId(): array
    {
        $config = [];

        $result = $this->configRepository->search(
            (new Criteria()),
            Context::createDefaultContext()
        );

        /** @var SwagMarketsConfigurationEntity $configEntity */
        foreach ($result->getEntities() as $configEntity) {
            $config[$configEntity->getConfigurationKey()] = $configEntity->getConfigurationValue();
        }

        return $config;
    }

    /**
     * @param array $data
     */
    public function singleStoreConfig(array $data): void
    {
        $upsertData = ['configurationKey' => $data['configurationKey']];

        /** @var SwagMarketsConfigurationEntity $entity */
        $entity = $this->configRepository->search(
            (new Criteria())->addFilter((new EqualsFilter('configurationKey', $data['configurationKey']))),
            Context::createDefaultContext()
        )->first();

        if ($entity !== null) {
            $newData = array_replace_recursive($entity->getConfigurationValue(), $data['data']);
            $upsertData['id'] = $entity->getId();
        }

        $upsertData['configurationValue'] = $newData;
        $this->configRepository->upsert([$upsertData], Context::createDefaultContext());
    }
}
