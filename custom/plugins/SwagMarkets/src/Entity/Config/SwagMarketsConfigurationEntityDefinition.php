<?php


namespace Swag\Markets\Entity\Config;


use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\JsonField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;

class SwagMarketsConfigurationEntityDefinition extends EntityDefinition
{
    public const ENTITY_NAME = 'bf_config';

    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    public function getEntityClass(): string
    {
        return SwagMarketsConfigurationEntity::class;
    }

    public function getCollectionClass(): string
    {
        return SwagMarketsConfigurationEntityCollection::class;
    }

    protected function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new IdField('id', 'id'))
                    ->addFlags(new PrimaryKey(), new Required()),
                (new StringField('configuration_key', 'configurationKey'))
                    ->addFlags(new Required()),
                (new JsonField('configuration_value', 'configurationValue')),
                (new StringField('sales_channel_id', 'salesChannelId')),
            ]
        );
    }
}
