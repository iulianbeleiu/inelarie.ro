<?php

namespace Swag\Markets\Entity\ProductToDelete;

use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;

class SwagMarketsProductToDeleteEntityCollection extends EntityCollection
{
    protected function getExpectedClass(): string
    {
        return SwagMarketsProductToDeleteEntity::class;
    }
}