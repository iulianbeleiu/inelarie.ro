<?php declare(strict_types=1);


namespace Swag\Markets\Entity\Marketplace;


use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSalesChannel\MarketplaceSalesChannelDefinition;
use Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings\MarketplaceSettingsCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;
use Shopware\Core\System\SalesChannel\SalesChannelDefinition;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;

class MarketplaceEntity extends Entity
{
    use EntityIdTrait;

    /**
     * @var string
     */
    protected $name;

    /**
     * @var string
     */
    protected $type;

    /**
     * @var MarketplaceSettingsCollection|null
     */
    protected $marketplaceSettings;

    /**
     * @return string
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * @param string $value
     * @return $this
     */
    public function setName(string $value): self
    {
        $this->name = $value;
        return $this;
    }

    /**
     * @return string
     */
    public function getType(): string
    {
        return $this->type;
    }

    /**
     * @param string $value
     * @return $this
     */
    public function setType(string $value): self
    {
        $this->type = $value;
        return $this;
    }

    public function getMarketplaceSettings(): ?MarketplaceSettingsCollection
    {
        return $this->marketplaceSettings;
    }

    public function setMarketplaceSettings(MarketplaceSettingsCollection $marketplaceSettings): void
    {
        $this->marketplaceSettings = $marketplaceSettings;
    }
}