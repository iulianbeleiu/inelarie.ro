<?php declare(strict_types=1);


namespace Swag\Markets\Entity\CategoryMapping;


use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;

class CategoryMappingDefinition extends EntityDefinition
{
    /**
     * @var string
     */
    public const ENTITY_NAME = 'bf_category_mapping';

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
    public function getCollectionClass(): string
    {
        return CategoryMappingCollection::class;
    }

    /**
     * @return string
     */
    public function getEntityClass(): string
    {
        return CategoryMappingEntity::class;
    }

    protected function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new IdField('id', 'id'))->addFlags(new PrimaryKey(), new Required()),
                (new StringField('category_id', 'categoryId'))->addFlags(new Required()),
                (new StringField('bf_category_id', 'bfCategoryId'))->addFlags(new Required()),
                (new StringField('sales_channel_id', 'salesChannelId'))->addFlags(new Required())
            ]
        );
    }
}