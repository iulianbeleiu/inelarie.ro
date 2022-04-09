<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Pos\Sync\Inventory\Calculator;

use Shopware\Core\Content\Product\ProductEntity;
use Swag\PayPal\Pos\Sync\Context\InventoryContext;

interface LocalCalculatorInterface
{
    public function getChangeAmount(ProductEntity $productEntity, InventoryContext $inventoryContext): int;
}
