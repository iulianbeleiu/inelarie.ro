<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Test\OrdersApi\Builder\Util;

use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\Tax\Struct\CalculatedTaxCollection;
use Shopware\Core\Checkout\Cart\Tax\Struct\TaxRuleCollection;
use Shopware\Core\Framework\Test\TestCaseBase\IntegrationTestBehaviour;
use Swag\PayPal\OrdersApi\Builder\Util\AmountProvider;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit\Amount;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit\Item;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit\Item\Tax;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit\Item\UnitAmount;
use Swag\PayPal\Test\Helper\CheckoutRouteTrait;
use Swag\PayPal\Util\PriceFormatter;

class AmountProviderTest extends TestCase
{
    use IntegrationTestBehaviour;
    use CheckoutRouteTrait;

    private PriceFormatter $priceFormatter;

    private AmountProvider $amountProvider;

    protected function setUp(): void
    {
        $this->priceFormatter = new PriceFormatter();
        $this->amountProvider = new AmountProvider($this->priceFormatter);
    }

    public function testPositiveMismatch(): void
    {
        $purchaseUnit = new PurchaseUnit();
        $purchaseUnit->setItems([
            $this->getItem(10, 0.503, 0.0, 19.0),
        ]);

        $breakdown = $this->createAmount($purchaseUnit, 10.03, 5.0)->getBreakdown();

        static::assertNotNull($breakdown);
        static::assertSame('5.00', $breakdown->getItemTotal()->getValue());
        static::assertSame('0.03', $breakdown->getHandling()->getValue());
        static::assertSame('0.00', $breakdown->getDiscount()->getValue());
    }

    public function testNegativeMismatch(): void
    {
        $purchaseUnit = new PurchaseUnit();
        $purchaseUnit->setItems([
            $this->getItem(10, 0.496, 0.0, 19.0),
        ]);

        $breakdown = $this->createAmount($purchaseUnit, 9.96, 5.0)->getBreakdown();

        static::assertNotNull($breakdown);
        static::assertSame('5.00', $breakdown->getItemTotal()->getValue());
        static::assertSame('0.00', $breakdown->getHandling()->getValue());
        static::assertSame('0.04', $breakdown->getDiscount()->getValue());
    }

    public function testNegativeItem(): void
    {
        $purchaseUnit = new PurchaseUnit();
        $purchaseUnit->setItems([
            $this->getItem(1, 10, 0.0, 19.0),
            $this->getItem(1, -5, 0.0, 19.0),
        ]);

        $breakdown = $this->createAmount($purchaseUnit, 10, 5.0)->getBreakdown();

        static::assertNotNull($breakdown);
        static::assertSame('10.00', $breakdown->getItemTotal()->getValue());
        static::assertSame('0.00', $breakdown->getHandling()->getValue());
        static::assertSame('5.00', $breakdown->getDiscount()->getValue());
    }

    private function createAmount(PurchaseUnit $purchaseUnit, float $total, float $shipping): Amount
    {
        return $this->amountProvider->createAmount(
            new CalculatedPrice($total, $total, new CalculatedTaxCollection(), new TaxRuleCollection()),
            new CalculatedPrice($shipping, $shipping, new CalculatedTaxCollection(), new TaxRuleCollection()),
            $this->getCurrency(),
            $purchaseUnit,
            true
        );
    }

    private function getItem(int $quantity, float $unitAmount, float $taxAmount, float $taxRate): Item
    {
        $item = new Item();

        $unit = new UnitAmount();
        $unit->setValue($this->priceFormatter->formatPrice($unitAmount));
        $unit->setCurrencyCode('EUR');
        $item->setUnitAmount($unit);

        $tax = new Tax();
        $tax->setValue($this->priceFormatter->formatPrice($taxAmount));
        $tax->setCurrencyCode('EUR');
        $item->setTax($tax);

        $item->setTaxRate($taxRate);
        $item->setQuantity($quantity);

        return $item;
    }
}
