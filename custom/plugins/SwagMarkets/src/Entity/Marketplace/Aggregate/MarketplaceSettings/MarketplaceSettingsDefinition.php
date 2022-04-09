<?php declare(strict_types=1);


namespace Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings;


use Swag\Markets\Entity\Marketplace\MarketplaceDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\FkField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\CascadeDelete;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToOneAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\OneToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\OneToOneAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\System\Country\CountryDefinition;
use Shopware\Core\System\Currency\CurrencyDefinition;
use Shopware\Core\System\Language\LanguageDefinition;

class MarketplaceSettingsDefinition extends EntityDefinition
{
    /**
     * @var string
     */
    public const ENTITY_NAME = 'bf_marketplace_settings';

    /**
     * @return string
     */
    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    public function getCollectionClass(): string
    {
        return MarketplaceSettingsCollection::class;
    }

    public function getEntityClass(): string
    {
        return MarketplaceSettingsEntity::class;
    }

    public function getParentDefinitionClass(): ?string
    {
        return MarketplaceDefinition::class;
    }

    /**
     * @return bool
     */
//    public function isInheritanceAware(): bool
//    {
//        return true;
//    }

    /**
     * @return FieldCollection
     */
    protected function defineFields(): FieldCollection
    {
        return new FieldCollection(
            [
                (new IdField('id', 'id'))->addFlags(new PrimaryKey(), new Required()),
                (new FkField(
                    'bf_marketplace_id',
                    'bfMarketplaceId',
                    MarketplaceDefinition::class
                )
                )->addFlags(new Required()),
                (new FkField(
                    'currency_id',
                    'currencyId',
                    CurrencyDefinition::class
                )
                )->addFlags(new Required()),
                (new FkField(
                    'language_id',
                    'languageId',
                    LanguageDefinition::class
                ))->addFlags(new Required()),
                (new FkField(
                    'country_id',
                    'countryId',
                    CountryDefinition::class
                ))->addFlags(new Required()),

                (new ManyToOneAssociationField(
                    'marketplace',
                    'bf_marketplace_id',
                    MarketplaceDefinition::class,
                    'id',
                    true
                ))->addFlags(new CascadeDelete()),
                (new ManyToOneAssociationField(
                    'currency',
                    'currency_id',
                    CurrencyDefinition::class,
                    'id',
                    false
                ))->addFlags(new CascadeDelete()),
                (new ManyToOneAssociationField(
                    'language',
                    'language_id',
                    LanguageDefinition::class,
                    'id',
                    false
                ))->addFlags(new CascadeDelete()),
                (new ManyToOneAssociationField(
                    'country',
                    'country_id',
                    CountryDefinition::class,
                    'id',
                    false
                ))->addFlags(new CascadeDelete())
            ]
        );
    }
}