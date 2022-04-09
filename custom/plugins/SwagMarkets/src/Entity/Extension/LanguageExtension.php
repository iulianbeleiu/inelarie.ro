<?php


namespace Swag\Markets\Entity\Extension;


use Shopware\Core\Framework\DataAbstractionLayer\EntityExtension;
use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings\MarketplaceSettingsDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\OneToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\System\Language\LanguageDefinition;

class LanguageExtension extends EntityExtension
{
    /**
     * @inheritDoc
     */
    public function getDefinitionClass(): string
    {
        return LanguageDefinition::class;
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
                'language_id',
                'id'
            )
        );
    }

}
