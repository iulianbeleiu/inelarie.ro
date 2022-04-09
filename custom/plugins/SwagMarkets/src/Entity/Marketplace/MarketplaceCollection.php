<?php


namespace Swag\Markets\Entity\Marketplace;

use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings\MarketplaceSettingsCollection;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;

/**
 * @method void               add(MarketplaceEntity $entity)
 * @method void               set(string $key, MarketplaceEntity $entity)
 * @method MarketplaceEntity[]    getIterator()
 * @method MarketplaceEntity[]    getElements()
 * @method MarketplaceEntity|null get(string $key)
 * @method MarketplaceEntity|null first()
 * @method MarketplaceEntity|null last()
 */
class MarketplaceCollection extends EntityCollection
{
    public function getMarketplaceSettingsIds(): array
    {
        $ids = [[]];

        foreach ($this->getIterator() as $element) {
            $ids[] = $element->getMarketplaceSettings()->getIds();
        }

        return array_merge(...$ids);
    }

    public function getPrices(): MarketplaceSettingsCollection
    {
        $settings = [[]];

        foreach ($this->getIterator() as $element) {
            $settings[] = $element->getMarketplaceSettings();
        }

        $settings = array_merge(...$settings);

        return new MarketplaceSettingsCollection($settings);
    }
    /**
     * @return string
     */
    protected function getExpectedClass(): string
    {
        return MarketplaceEntity::class;
    }
}