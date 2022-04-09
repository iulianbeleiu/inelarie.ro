<?php declare(strict_types=1);


namespace Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSalesChannel;


use Swag\Markets\Entity\Marketplace\MarketplaceDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\FkField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToOneAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\Framework\DataAbstractionLayer\MappingEntityDefinition;
use Shopware\Core\System\SalesChannel\SalesChannelDefinition;

class MarketplaceSalesChannelDefinition extends MappingEntityDefinition
{
    public function getEntityName(): string
    {
        return 'bf_marketplace_sales_channel';
    }

    protected function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new FkField('bf_marketplace_id', 'bfMarketplaceId', MarketplaceDefinition::class))->addFlags(
                    new PrimaryKey(),
                    new Required()
                ),
                (new FkField('sales_channel_id', 'salesChannelId', SalesChannelDefinition::class))->addFlags(
                    new PrimaryKey(),
                    new Required()
                ),

                new ManyToOneAssociationField(
                    'marketplace', 'marketplace_id', MarketplaceDefinition::class, 'id', false
                ),
                new ManyToOneAssociationField(
                    'salesChannel',
                    'sales_channel_id',
                    SalesChannelDefinition::class,
                    'id',
                    false
                ),
            ]
        );
    }

    /*
     * return new FieldCollection([
     *  (new FkField('order_id', 'orderId', OrderDefinition::class))->addFlags(new PrimaryKey(), new Required()),
     *  (new ReferenceVersionField(OrderDefinition::class))->addFlags(new PrimaryKey(), new Required()),
     *  (new FkField('tag_id', 'tagId', TagDefinition::class))->addFlags(new PrimaryKey(), new Required()),
     *
     *  new ManyToOneAssociationField('order', 'order_id', OrderDefinition::class, 'id', false),
     *  new ManyToOneAssociationField('tag', 'tag_id', TagDefinition::class, 'id', false),
     * ]);
    */
}