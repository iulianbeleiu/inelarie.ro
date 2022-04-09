<?php declare(strict_types=1);

namespace Swag\Markets\Entity\Extension;


use Shopware\Core\Framework\DataAbstractionLayer\EntityExtension;
use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSalesChannel\MarketplaceSalesChannelDefinition;
use Swag\Markets\Entity\Marketplace\MarketplaceDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\System\SalesChannel\SalesChannelDefinition;

class SalesChannelExtension extends EntityExtension
{

    /**
     * @inheritDoc
     */
    public function getDefinitionClass(): string
    {
        return SalesChannelDefinition::class;
    }

    /**
     * @inheritDoc
     */
    public function extendFields(FieldCollection $collection): void
    {
        $collection->add(
            new ManyToManyAssociationField(
                'marketplaces',
                MarketplaceDefinition::class,
                MarketplaceSalesChannelDefinition::class,
                'sales_channel_id',
                'bf_marketplace_id',
                'id'
            )
        );
    }
}
