<?php declare(strict_types=1);


namespace Swag\Markets\Entity\Marketplace\Aggregate\MarketplaceSettings;


use Swag\Markets\Entity\Marketplace\MarketplaceEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;

class MarketplaceSettingsEntity extends Entity
{
    use EntityIdTrait;

    /**
     * @var string
     */
    protected $bfMarketplaceId;

    /**
     * @var string
     */
    protected $currencyId;

    /**
     * @var string
     */
    protected $languageId;

    /**
     * @var string
     */
    protected $countryId;

    /**
     * @var MarketplaceEntity | null
     */
    protected $marketplace;

    public function getBfMarketplaceId()
    {
        return $this->bfMarketplaceId;
    }

    public function setBfMarketplaceId($bfMarketplaceId): void
    {
        $this->bfMarketplaceId = $bfMarketplaceId;
    }

    public function getCurrencyId()
    {
        return $this->currencyId;
    }

    public function setCurrencyId($currencyId): void
    {
        $this->currencyId = $currencyId;
    }

    public function getLanguageId()
    {
        return $this->languageId;
    }

    public function setLanguageId($languageId): void
    {
        $this->languageId = $languageId;
    }

    public function getCountryId()
    {
        return $this->countryId;
    }

    public function setCountryId($countryId): void
    {
        $this->countryId = $countryId;
    }

    public function getMarketplace(): ?MarketplaceEntity
    {
        return $this->marketplace;
    }

    public function setMarketplace(MarketplaceEntity $marketplace): ?MarketplaceEntity
    {
        $this->marketplace = $marketplace;
    }


}