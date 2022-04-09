<?php declare(strict_types=1);

namespace Swag\Markets\Subscriber;

use Exception;
use Generator;
use Shopware\Core\Framework\DataAbstractionLayer\Event\EntityDeletedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityWriteResult;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;

class ProductDeleteSubscriber implements EventSubscriberInterface 
{
    /** @var EntityRepositoryInterface */
    private $productToDeleteRepository;

    /**
     * @param EntityRepositoryInterface $productToDeleteRepository
     */
    public function __construct(EntityRepositoryInterface $productToDeleteRepository)
    {
        $this->productToDeleteRepository = $productToDeleteRepository;
    }

    /**
     * Register events to listen to
     *
     * @return array
     */
    public static function getSubscribedEvents(): array
    {
        // Return the events to listen to as array like this:  <event to listen to> => <method to execute>
        return [
            ProductEvents::PRODUCT_DELETED_EVENT => 'onProductsDeleted',
        ];
    }

    /**
     * @param EntityDeletedEvent $event
     * @return void
     */
    public function onProductsDeleted(EntityDeletedEvent $event): void
    {
        try {
            $eventWriteResult = $event->getWriteResults();
            if ($event->getEntityName() === 'product') {
                $this->storeProductToDelete($eventWriteResult);
            }
        } catch (Exception $e) {

        }
    }

    /**
     * @param array $eventWriteResult
     * @return void
     */
    private function storeProductToDelete(array $eventWriteResult): void
    {
        /** @var EntityWriteResult $entityWriteResult */
        foreach ($this->getEntityWriteResult($eventWriteResult) as $entityWriteResult) {
            $data = [
                'productId' => $entityWriteResult->getPrimaryKey(),
                'isVariation' => $entityWriteResult->getExistence()->isChild() ? 1 : 0
            ];

            $this->productToDeleteRepository->upsert([$data], Context::createDefaultContext());
        }
    }

    /**
     * Returns a single EntityWriteResult with every loop to work with.
     *
     * @param array $eventWriteResult
     * @return Generator
     */
    private function getEntityWriteResult(array $eventWriteResult): Generator
    {
        if (count($eventWriteResult) > 0) {
            /** @var EntityWriteResult $entityWriteResult */
            foreach ($eventWriteResult as $entityWriteResult) {
                if ($entityWriteResult->getEntityName() === 'product' && $entityWriteResult->getOperation() === 'delete') {
                    yield $entityWriteResult;
                }
            }
        }
    }
}