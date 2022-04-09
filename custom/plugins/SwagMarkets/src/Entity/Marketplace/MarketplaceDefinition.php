<?php declare(strict_types=1);

namespace Swag\Markets\Entity\Marketplace;

use Swag\Markets\Entity\Extension\SalesChannelExtension;
use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSalesChannel\MarketplaceSalesChannelDefinition;
use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings\MarketplaceSettingsDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\CascadeDelete;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\OneToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\System\SalesChannel\SalesChannelDefinition;

class MarketplaceDefinition extends EntityDefinition
{
    /**
     * @var string
     */
    public const ENTITY_NAME = 'bf_marketplace';

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
        return MarketplaceCollection::class;
    }

    /**
     * @return string
     */
    public function getEntityClass(): string
    {
        return MarketplaceEntity::class;
    }

    /**
     * @return FieldCollection
     */
    protected function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new IdField('id', 'id'))->addFlags(new PrimaryKey(), new Required()),
                (new StringField('name', 'name'))->addFlags(new Required()),
                (new StringField('type', 'type'))->addFlags(new Required()),
                (new OneToManyAssociationField(
                    'marketplaceSettings',
                    MarketplaceSettingsDefinition::class,
                    'bf_marketplace_id',
                    'id'
                ))->addFlags(new CascadeDelete()),
                new ManyToManyAssociationField(
                    'salesChannels',
                    SalesChannelDefinition::class,
                    MarketplaceSalesChannelDefinition::class,
                    'bf_marketplace_id',
                    'sales_channel_id'
                ),
            ]
        );
    }
}
/*
 * TagDefinition
 * (new ManyToManyAssociationField(
 * 'orders',
 * OrderDefinition::class,
 * OrderTagDefinition::class,
 * 'tag_id',
 * 'order_id'))->addFlags(new ReadProtected(SalesChannelApiSource::class)),
 */
