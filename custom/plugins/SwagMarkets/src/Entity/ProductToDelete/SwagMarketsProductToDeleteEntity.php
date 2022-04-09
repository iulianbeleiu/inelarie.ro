<?php declare(strict_types=1);

namespace Swag\Markets\Entity\ProductToDelete;

use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;

class SwagMarketsProductToDeleteEntity extends Entity 
{
    use EntityIdTrait;

    /**
     * @var int
     */
    protected $productId;

    /**
     * @var int
     */
    protected $isVariation;

    /**
     * @return  int
     */ 
    public function getProductId(): int
    {
        return $this->productId;
    }

    /**
     * @param  int  $productId
     *
     * @return  self
     */ 
    public function setProductId(int $productId)
    {
        $this->productId = $productId;

        return $this;
    }

    /**
     * @return  int
     */ 
    public function getIsVariation(): int
    {
        return $this->isVariation;
    }

    /**
     * @param  int  $isVariation
     *
     * @return  self
     */ 
    public function setIsVariation(int $isVariation)
    {
        $this->isVariation = $isVariation;

        return $this;
    }
}