<?php declare(strict_types=1);

namespace Swag\Markets\Entity\CategoryMapping;

use Swag\Markets\Entity\CategoryMapping\CategoryMappingEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;

/**
 * @method void               add(CategoryMappingEntity $entity)
 * @method void               set(string $key, CategoryMappingEntity $entity)
 * @method CategoryMappingEntity[]    getIterator()
 * @method CategoryMappingEntity[]    getElements()
 * @method CategoryMappingEntity|null get(string $key)
 * @method CategoryMappingEntity|null first()
 * @method CategoryMappingEntity|null last()
 */
class CategoryMappingCollection extends EntityCollection
{
    protected function getExpectedClass(): string
    {
        return CategoryMappingEntity::class;
    }
}