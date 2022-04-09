<?php

declare(strict_types=1);

namespace Swag\Markets\Entity\ProductCategoryMapping;


use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\Struct\Collection;

class ProductCategoryMappingEntity extends Entity
{
    /**
     * @var string $shopId
     */
    protected $shopId;

    /**
     * @var string $productId
     */
    protected $productId;

    /**
     * @var string $externalProductId
     */
    protected $externalProductId;

    /**
     * @var Collection $productData
     */
    protected $productData;

    /**
     * @var array $shopCategories
     */
    protected $shopCategories;
}