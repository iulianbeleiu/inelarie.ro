<?php


namespace Swag\Markets\Service;

use Exception;
use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Sorting\FieldSorting;

class SwagMarketsService
{
    /**
     * @var Connection
     */
    private $connection;

    /**
     * @param Connection $connection
     */
    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * @return mixed[]
     */
    public function getVariationsUsedByProducts()
    {
        $queryBuilder = $this->connection->createQueryBuilder();

        $queryBuilder
            ->select('LOWER(HEX(pg.id)) AS id, pgt.name AS name, LOWER(HEX(l.translation_code_id)) AS language')
            ->from('product_option', 'po')
            ->leftJoin('po', 'product', 'p', 'p.id = po.product_id')
            ->leftJoin('po', 'property_group_option', 'pgo', 'po.property_group_option_id = pgo.id')
            ->leftJoin('pgo', 'property_group', 'pg', 'pgo.property_group_id = pg.id')
            ->leftJoin('pg', 'property_group_translation', 'pgt', 'pg.id = pgt.property_group_id')
            ->leftJoin('pgt', 'language', 'l', 'pgt.language_id = l.id')
            ->addGroupBy('pg.id')
            ->addGroupBy('pgt.name');

        return $queryBuilder->execute()->fetchAll(2);
    }

    /**
     * @param Context $context
     * @param EntityRepositoryInterface $productToDeleteRepository
     * @return array
     */
    public function getToDeleteProducts(Context $context, EntityRepositoryInterface $productToDeleteRepository): array
    {
        $criteria = new Criteria();
        $criteria->setLimit(500);
        $criteria->addSorting(new FieldSorting('createdAt', FieldSorting::ASCENDING));

        /** @var EntitySearchResult $toDeleteProducts */
        $toDeleteProducts = $productToDeleteRepository->search($criteria, $context);

        return $toDeleteProducts->jsonSerialize();
    }

    /**
     * @param Context $context
     * @param EntityRepositoryInterface $productToDeleteRepository
     * @param array $ids
     * @return bool
     */
    public function removeToDeleteProducts(Context $context, EntityRepositoryInterface $productToDeleteRepository, array $ids): bool
    {
        try {
            $productToDeleteRepository->delete($ids, $context);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}
