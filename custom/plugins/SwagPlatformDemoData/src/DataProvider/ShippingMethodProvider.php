<?php declare(strict_types=1);

namespace Swag\PlatformDemoData\DataProvider;

use Doctrine\DBAL\Connection;

class ShippingMethodProvider extends DemoDataProvider
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function getAction(): string
    {
        return 'upsert';
    }

    public function getEntity(): string
    {
        return 'shipping_method';
    }

    public function getPayload(): array
    {
        $ruleId = $this->getRuleId();
        $payload = [];
        foreach ($this->getShippingMethodIds() as $shippingMethodId) {
            $payload[] = [
                'id' => $shippingMethodId,
                'availabilityRuleId' => $ruleId,
            ];
        }

        return $payload;
    }

    private function getShippingMethodIds(): array
    {
        return $this->connection->fetchFirstColumn('
            SELECT LOWER(HEX(`id`))
            FROM `shipping_method`;
        ');
    }

    private function getRuleId(): string
    {
        $result = $this->connection->fetchOne('
            SELECT LOWER(HEX(`id`))
            FROM `rule`
        ');

        if (!$result) {
            throw new \RuntimeException('No rule found, please make sure that basic data is available by running the migrations.');
        }

        return (string) $result;
    }
}
