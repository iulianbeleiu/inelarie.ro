<?php

declare(strict_types=1);

namespace Swag\Markets\DataAbstractionLayer;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityWrittenContainerEvent;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResultCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\IdSearchResult;
use Shopware\Core\Framework\DataAbstractionLayer\Write\CloneBehavior;
use Symfony\Component\Config\Definition\Exception\DuplicateKeyException;

class SalesChannelRepositoryDecorator implements EntityRepositoryInterface
{
    private const EBAY_SALES_CHANNEL_ID = "7ff39608fed04e4bbcc62710b7223966";
    private const AMAZON_SALES_CHANNEL_ID = "26a9ece25bd14b288b30c3d71e667d2c";
    /**
     * @var EntityRepositoryInterface $innerRepo
     */
    private $innerRepo;

    /**
     * @param EntityRepositoryInterface $innerRepo
     */
    public function __construct(EntityRepositoryInterface $innerRepo)
    {
        $this->innerRepo = $innerRepo;
    }

    /**
     * @return EntityDefinition
     */
    public function getDefinition(): EntityDefinition
    {
        return $this->innerRepo->getDefinition();
    }

    /**
     * @param Criteria $criteria
     * @param Context $context
     * @return AggregationResultCollection
     */
    public function aggregate(Criteria $criteria, Context $context): AggregationResultCollection
    {
        return $this->innerRepo->aggregate($criteria, $context);
    }

    /**
     * @param Criteria $criteria
     * @param Context $context
     * @return IdSearchResult
     */
    public function searchIds(Criteria $criteria, Context $context): IdSearchResult
    {
        return $this->innerRepo->searchIds($criteria, $context);
    }

    /**
     * @param string $id
     * @param Context $context
     * @param string|null $newId
     * @param CloneBehavior|null $behavior
     * @return EntityWrittenContainerEvent
     */
    public function clone(string $id, Context $context, ?string $newId = null, ?CloneBehavior $behavior = null): EntityWrittenContainerEvent
    {
        return $this->innerRepo->clone($id, $context, $newId);
    }

    /**
     * @param Criteria $criteria
     * @param Context $context
     * @return EntitySearchResult
     */
    public function search(Criteria $criteria, Context $context): EntitySearchResult
    {
        return $this->innerRepo->search($criteria, $context);
    }

    /**
     * @param array $data
     * @param Context $context
     * @return EntityWrittenContainerEvent
     */
    public function update(array $data, Context $context): EntityWrittenContainerEvent
    {
        return $this->innerRepo->update($data, $context);
    }

    /**
     * @param array $data
     * @param Context $context
     * @return EntityWrittenContainerEvent
     */
    public function upsert(array $data, Context $context): EntityWrittenContainerEvent
    {
        return $this->innerRepo->upsert($data, $context);
    }

    /**
     * @param array $data
     * @param Context $context
     * @return EntityWrittenContainerEvent
     */
    public function create(array $data, Context $context): EntityWrittenContainerEvent
    {

        if ($data[0]['typeId'] !== self::AMAZON_SALES_CHANNEL_ID && $data[0]['typeId'] !== self::EBAY_SALES_CHANNEL_ID) {
            return $this->innerRepo->create($data, $context);
        }

        $result = $this->search(
            (new Criteria())->addFilter(new EqualsFilter('typeId', $data[0]['typeId'])),
            $context
        )->count();

        if ($result >= 1) {
            // throw new InvalidSalesChannelIdException($data[0]['name']);
            throw new DuplicateKeyException("Sales channel of type \"{name}\" already exists", 999);
        }

        return $this->innerRepo->create($data, $context);
    }

    /**
     * @param array $data
     * @param Context $context
     * @return EntityWrittenContainerEvent
     */
    public function delete(array $data, Context $context): EntityWrittenContainerEvent
    {
        return $this->innerRepo->delete($data, $context);
    }

    /**
     * @param string $id
     * @param Context $context
     * @param string|null $name
     * @param string|null $versionId
     * @return string
     */
    public function createVersion(string $id, Context $context, ?string $name = null, ?string $versionId = null): string
    {
        return $this->createVersion($id, $context, $name, $versionId);
    }

    /**
     * @param string $versionId
     * @param Context $context
     */
    public function merge(string $versionId, Context $context): void
    {
        $this->innerRepo->merge($versionId, $context);
    }
}
