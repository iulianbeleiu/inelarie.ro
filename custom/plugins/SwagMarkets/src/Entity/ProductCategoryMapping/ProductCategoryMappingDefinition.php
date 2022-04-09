<?php

declare(strict_types=1);

namespace Swag\Markets\Entity\ProductCategoryMapping;


use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;

class ProductCategoryMappingDefinition
{
    /**
     * @var string
     */
    public const ENTITY_NAME = 'bf_product_category_mapping';

    /**
     * @return string
     */
    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    /**
     * @return string
     */
    public function getEntityClass(): string
    {
        return ProductCategoryMappingEntity::class;
    }

    /**
     * @return FieldCollection
     */
    protected function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new StringField('shopId', 'shopId'))->addFlags(new Required()),
                (new StringField('productId', 'productId'))->addFlags(new Required()),
                (new StringField('externalProductId', 'externalProductId'))->addFlags(new Required()),
                (new Field('productData', 'productData')),
                (new Field('shopCategories', 'shopCategories'))
            ]
        );
    }
}