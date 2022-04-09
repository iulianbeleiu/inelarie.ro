<?php declare(strict_types=1);


namespace Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings;


use Swag\Markets\Entity\Marketplace\MarketplaceEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;

/**
 * @method void                     add(MarketplaceSettingsEntity $entity)
 * @method void                     set(string $key, MarketplaceSettingsEntity $entity)
 * @method MarketplaceSettingsEntity[]    getIterator()
 * @method MarketplaceSettingsEntity[]    getElements()
 * @method MarketplaceSettingsEntity|null get(string $key)
 * @method MarketplaceSettingsEntity|null first()
 * @method MarketplaceSettingsEntity|null last()
 */

class MarketplaceSettingsCollection extends EntityCollection
{
    public function getMarketplaceIds(): array
    {
        return $this->fmap(function (MarketplaceSettingsEntity $marketplace) {
            return $marketplace->getBfMarketplaceId();
        });
    }

    protected function getExpectedClass(): string
    {
        return MarketplaceSettingsEntity::class;
    }
}