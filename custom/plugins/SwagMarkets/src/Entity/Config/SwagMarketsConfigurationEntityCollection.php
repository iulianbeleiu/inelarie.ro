<?php declare(strict_types=1);


namespace Swag\Markets\Entity\Config;


use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;

class SwagMarketsConfigurationEntityCollection extends EntityCollection
{
    protected function getExpectedClass(): string
    {
        return SwagMarketsConfigurationEntity::class;
    }
}
