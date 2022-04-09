<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit;

use OpenApi\Annotations as OA;
use Swag\PayPal\RestApi\PayPalApiStruct;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit\Payments\Authorization;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit\Payments\Capture;
use Swag\PayPal\RestApi\V2\Api\Order\PurchaseUnit\Payments\Refund;

/**
 * @OA\Schema(schema="swag_paypal_v2_order_payments")
 */
class Payments extends PayPalApiStruct
{
    /**
     * @var Authorization[]|null
     * @OA\Property(type="array", items={"$ref": "#/components/schemas/swag_paypal_v2_order_authorization"}, nullable=true)
     */
    protected ?array $authorizations = null;

    /**
     * @var Capture[]|null
     * @OA\Property(type="array", items={"$ref": "#/components/schemas/swag_paypal_v2_order_capture"}, nullable=true)
     */
    protected ?array $captures = null;

    /**
     * @var Refund[]|null
     * @OA\Property(type="array", items={"$ref": "#/components/schemas/swag_paypal_v2_order_refund"}, nullable=true)
     */
    protected ?array $refunds = null;

    /**
     * @return Authorization[]|null
     */
    public function getAuthorizations(): ?array
    {
        return $this->authorizations;
    }

    /**
     * @param Authorization[]|null $authorizations
     */
    public function setAuthorizations(?array $authorizations): void
    {
        $this->authorizations = $authorizations;
    }

    /**
     * @return Capture[]|null
     */
    public function getCaptures(): ?array
    {
        return $this->captures;
    }

    /**
     * @param Capture[]|null $captures
     */
    public function setCaptures(?array $captures): void
    {
        $this->captures = $captures;
    }

    /**
     * @return Refund[]|null
     */
    public function getRefunds(): ?array
    {
        return $this->refunds;
    }

    /**
     * @param Refund[]|null $refunds
     */
    public function setRefunds(?array $refunds): void
    {
        $this->refunds = $refunds;
    }
}
