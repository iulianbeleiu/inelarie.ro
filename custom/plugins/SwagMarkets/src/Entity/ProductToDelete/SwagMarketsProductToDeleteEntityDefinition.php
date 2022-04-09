<?php

namespace Swag\Markets\Entity\ProductToDelete;

use Shopware\Core\Defaults;
use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IntField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;

class SwagMarketsProductToDeleteEntityDefinition extends EntityDefinition
{
    public const ENTITY_NAME = 'bf_product_to_delete';

    /**
     * @return string
     */
    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    public function getEntityClass(): string
    {
        return SwagMarketsProductToDeleteEntity::class;
    }

    public function getCollectionClass(): string
    {
        return SwagMarketsProductToDeleteEntityCollection::class;    
    }

    public function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new IdField('id', 'id'))->addFlags(new PrimaryKey(), new Required()),
                (new IdField('product_id', 'productId'))->addFlags(new Required()),
                (new IntField('is_variation', 'isVariation'))
            ]
        );
    }
}