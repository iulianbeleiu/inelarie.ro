<?php declare(strict_types=1);

namespace Swag\Markets\Entity\Config;

use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;

class SwagMarketsConfigurationEntity extends Entity
{
    use EntityIdTrait;

    /**
     * @var string
     */
    protected $configurationKey;

    /**
     * @var array
     */
    protected $configurationValue;

    public function getConfigurationKey(): string
    {
        return $this->configurationKey;
    }

    public function setConfigurationKey(string $value): self
    {
        $this->configurationKey = $value;
        return $this;
    }

    public function getConfigurationValue(): array
    {
        return $this->configurationValue;
    }

    public function setConfigurationValue(array $values): self
    {
        foreach ($values as $key => $value) {
            $this->configurationValue[$key] = $value;
        }

        return $this;
    }
}
