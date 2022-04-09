<?php


namespace Swag\Markets\Entity\Extension;


use Shopware\Core\Framework\DataAbstractionLayer\EntityExtension;
use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings\MarketplaceSettingsDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\OneToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\System\Country\CountryDefinition;

class CountryExtension extends EntityExtension
{

    /**
     * @inheritDoc
     */
    public function getDefinitionClass(): string
    {
        return CountryDefinition::class;
    }


    /**
     * @inheritDoc
     */
    public function extendFields(FieldCollection $collection): void
    {
        $collection->add(
            new OneToManyAssociationField(
                'marketplaceSettings',
                MarketplaceSettingsDefinition::class,
                'country_id',
                'id'
            )
        );
    }

}
