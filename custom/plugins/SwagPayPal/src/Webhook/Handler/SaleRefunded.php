<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Webhook\Handler;

use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Framework\Context;
use Swag\PayPal\RestApi\PayPalApiStruct;
use Swag\PayPal\RestApi\V1\Api\Webhook as WebhookV1;
use Swag\PayPal\Webhook\WebhookEventTypes;

class SaleRefunded extends AbstractWebhookHandler
{
    public function getEventType(): string
    {
        return WebhookEventTypes::PAYMENT_SALE_REFUNDED;
    }

    /**
     * @param WebhookV1 $webhook
     */
    public function invoke(PayPalApiStruct $webhook, Context $context): void
    {
        $orderTransaction = $this->getOrderTransaction($webhook, $context);

        if ($this->isChangeAllowed($orderTransaction, OrderTransactionStates::STATE_REFUNDED)) {
            $this->orderTransactionStateHandler->refund($orderTransaction->getId(), $context);
        }
    }
}
