<?php

declare(strict_types=1);

namespace Swag\Markets\Entity\CategoryMapping;


use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;

class CategoryMappingEntity extends Entity
{
    use EntityIdTrait;

    /**
     * @var string
     */
    protected $categoryId;

    /**
     * @var string
     */
    protected $bfCategoryId;

    /**
     * @var string
     */
    protected $salesChannelId;

    /**
     * @return string
     */
    public function getCategoryId(): string
    {
        return $this->categoryId;
    }

    /**
     * @param string $categoryId
     */
    public function setCategoryId(string $categoryId): void
    {
        $this->categoryId = $categoryId;
    }

    /**
     * @return string
     */
    public function getBfCategoryId(): string
    {
        return $this->bfCategoryId;
    }

    /**
     * @param string $bfCategoryId
     */
    public function setBfCategoryId(string $bfCategoryId): void
    {
        $this->bfCategoryId = $bfCategoryId;
    }

    /**
     * @return string
     */
    public function getSalesChannelId(): string
    {
        return $this->salesChannelId;
    }

    /**
     * @param string $salesChannelId
     */
    public function setSalesChannelId(string $salesChannelId): void
    {
        $this->salesChannelId = $salesChannelId;
    }


}