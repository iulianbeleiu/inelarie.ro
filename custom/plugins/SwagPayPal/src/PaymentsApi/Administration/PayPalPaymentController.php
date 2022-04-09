<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\PaymentsApi\Administration;

use OpenApi\Annotations as OA;
use Shopware\Core\Checkout\Cart\Exception\OrderNotFoundException;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Routing\Annotation\Acl;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\Framework\Routing\Annotation\Since;
use Swag\PayPal\PaymentsApi\Administration\Exception\RequiredParameterInvalidException;
use Swag\PayPal\RestApi\V1\Api\Capture;
use Swag\PayPal\RestApi\V1\Api\Capture\Amount as CaptureAmount;
use Swag\PayPal\RestApi\V1\Api\Payment\Transaction\RelatedResource;
use Swag\PayPal\RestApi\V1\Api\Refund;
use Swag\PayPal\RestApi\V1\Api\Refund\Amount as RefundAmount;
use Swag\PayPal\RestApi\V1\Resource\AuthorizationResource;
use Swag\PayPal\RestApi\V1\Resource\CaptureResource;
use Swag\PayPal\RestApi\V1\Resource\OrdersResource;
use Swag\PayPal\RestApi\V1\Resource\PaymentResource;
use Swag\PayPal\RestApi\V1\Resource\SaleResource;
use Swag\PayPal\Util\PaymentStatusUtil;
use Swag\PayPal\Util\PriceFormatter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @RouteScope(scopes={"api"})
 */
class PayPalPaymentController extends AbstractController
{
    public const REQUEST_PARAMETER_CURRENCY = 'currency';
    public const REQUEST_PARAMETER_REFUND_AMOUNT = 'refundAmount';
    public const REQUEST_PARAMETER_REFUND_INVOICE_NUMBER = 'refundInvoiceNumber';
    public const REQUEST_PARAMETER_CAPTURE_AMOUNT = 'captureAmount';
    public const REQUEST_PARAMETER_CAPTURE_IS_FINAL = 'captureIsFinal';
    public const REQUEST_PARAMETER_DESCRIPTION = 'description';
    public const REQUEST_PARAMETER_REASON = 'reason';

    private PaymentResource $paymentResource;

    private SaleResource $saleResource;

    private AuthorizationResource $authorizationResource;

    private OrdersResource $ordersResource;

    private CaptureResource $captureResource;

    private PaymentStatusUtil $paymentStatusUtil;

    private EntityRepositoryInterface $orderRepository;

    private PriceFormatter $priceFormatter;

    public function __construct(
        PaymentResource $paymentResource,
        SaleResource $saleResource,
        AuthorizationResource $authorizationResource,
        OrdersResource $ordersResource,
        CaptureResource $captureResource,
        PaymentStatusUtil $paymentStatusUtil,
        EntityRepositoryInterface $orderRepository,
        PriceFormatter $priceFormatter
    ) {
        $this->paymentResource = $paymentResource;
        $this->saleResource = $saleResource;
        $this->authorizationResource = $authorizationResource;
        $this->ordersResource = $ordersResource;
        $this->captureResource = $captureResource;
        $this->paymentStatusUtil = $paymentStatusUtil;
        $this->orderRepository = $orderRepository;
        $this->priceFormatter = $priceFormatter;
    }

    /**
     * @Since("0.10.0")
     * @OA\Get(
     *     path="/paypal/payment-details/{orderId}/{paymentId}",
     *     description="Loads the Payment details of the given PayPal ID",
     *     operationId="paymentDetails",
     *     tags={"Admin API", "PayPal"},
     *     @OA\Parameter(
     *         parameter="orderId",
     *         name="orderId",
     *         in="path",
     *         description="ID of the order which contains the PayPal payment",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         parameter="paymentId",
     *         name="paymentId",
     *         in="path",
     *         description="ID of the PayPal payment",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response="200",
     *         description="Details of the PayPal payment",
     *         @OA\JsonContent(ref="#/components/schemas/swag_paypal_v1_payment")
     *     )
     * )
     * @Route("/api/paypal/payment-details/{orderId}/{paymentId}", name="api.paypal.payment_details", methods={"GET"})
     * @Acl({"order.viewer"})
     */
    public function paymentDetails(string $orderId, string $paymentId, Context $context): JsonResponse
    {
        $payment = $this->paymentResource->get($paymentId, $this->getSalesChannelIdByOrderId($orderId, $context));

        return new JsonResponse($payment);
    }

    /**
     * @Since("1.5.1")
     * @OA\Get(
     *     path="/paypal/resource-details/{resourceType}/{resourceId}/{orderId}",
     *     description="Loads the PayPal resource details of the given resource ID",
     *     operationId="resourceDetails",
     *     tags={"Admin API", "PayPal"},
     *     @OA\Parameter(
     *         parameter="resourceType",
     *         name="resourceType",
     *         in="path",
     *         description="Type of the resource. Possible values: sale, authorization, order, capture, refund",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         parameter="resourceId",
     *         name="resourceId",
     *         in="path",
     *         description="ID of the PayPal resource",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         parameter="orderId",
     *         name="orderId",
     *         in="path",
     *         description="ID of the order which contains the PayPal resource",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Response(
     *         response="200",
     *         description="Details of the PayPal resource",
     *         @OA\JsonContent(oneOf={
     *             @OA\Schema(ref="#/components/schemas/swag_paypal_v1_payment_transaction_sale"),
     *             @OA\Schema(ref="#/components/schemas/swag_paypal_v1_payment_transaction_authorization"),
     *             @OA\Schema(ref="#/components/schemas/swag_paypal_v1_payment_transaction_order"),
     *             @OA\Schema(ref="#/components/schemas/swag_paypal_v1_capture")
     *         })
     *     )
     * )
     * @Route("/api/paypal/resource-details/{resourceType}/{resourceId}/{orderId}", name="api.paypal.resource_details", methods={"GET"})
     * @Acl({"order.viewer"})
     */
    public function resourceDetails(Context $context, string $resourceType, string $resourceId, string $orderId): JsonResponse
    {
        $salesChannelId = $this->getSalesChannelIdByOrderId($orderId, $context);
        switch ($resourceType) {
            case RelatedResource::SALE:
                $resource = $this->saleResource->get($resourceId, $salesChannelId);

                break;
            case RelatedResource::AUTHORIZE:
                $resource = $this->authorizationResource->get($resourceId, $salesChannelId);

                break;
            case RelatedResource::ORDER:
                $resource = $this->ordersResource->get($resourceId, $salesChannelId);

                break;
            case RelatedResource::CAPTURE:
                $resource = $this->captureResource->get($resourceId, $salesChannelId);

                break;
            default:
                throw new RequiredParameterInvalidException('resourceType');
        }

        return new JsonResponse($resource);
    }

    /**
     * @Since("0.9.0")
     * @Route("/api/_action/paypal/refund-payment/{resourceType}/{resourceId}/{orderId}", name="api.action.paypal.refund_payment", methods={"POST"})
     * @Acl({"order.editor"})
     *
     * @throws RequiredParameterInvalidException
     */
    public function refundPayment(
        Request $request,
        Context $context,
        string $resourceType,
        string $resourceId,
        string $orderId
    ): JsonResponse {
        $refund = $this->createRefund($request);
        $salesChannelId = $this->getSalesChannelIdByOrderId($orderId, $context);

        switch ($resourceType) {
            case RelatedResource::SALE:
                $refundResponse = $this->saleResource->refund(
                    $resourceId,
                    $refund,
                    $salesChannelId
                );
                $this->paymentStatusUtil->applyRefundStateToPayment($orderId, $refundResponse, $context);

                break;
            case RelatedResource::CAPTURE:
                $refundResponse = $this->captureResource->refund(
                    $resourceId,
                    $refund,
                    $salesChannelId
                );
                $paymentResponse = $this->paymentResource->get($refundResponse->getParentPayment(), $salesChannelId);
                $this->paymentStatusUtil->applyRefundStateToCapture($orderId, $refundResponse, $paymentResponse, $context);

                break;
            default:
                throw new RequiredParameterInvalidException('resourceType');
        }

        return new JsonResponse($refundResponse);
    }

    /**
     * @Since("0.9.0")
     * @Route("/api/_action/paypal/capture-payment/{resourceType}/{resourceId}/{orderId}", name="api.action.paypal.catpure_payment", methods={"POST"})
     * @Acl({"order.editor"})
     *
     * @throws RequiredParameterInvalidException
     */
    public function capturePayment(
        Request $request,
        Context $context,
        string $resourceType,
        string $resourceId,
        string $orderId
    ): JsonResponse {
        $capture = $this->createCapture($request);

        switch ($resourceType) {
            case RelatedResource::AUTHORIZE:
                $captureResponse = $this->authorizationResource->capture(
                    $resourceId,
                    $capture,
                    $this->getSalesChannelIdByOrderId($orderId, $context)
                );

                break;
            case RelatedResource::ORDER:
                $salesChannelId = $this->getSalesChannelIdByOrderId($orderId, $context);
                $captureResponse = $this->ordersResource->capture($resourceId, $capture, $salesChannelId);

                break;
            default:
                throw new RequiredParameterInvalidException('resourceType');
        }

        $this->paymentStatusUtil->applyCaptureState($orderId, $captureResponse, $context);

        return new JsonResponse($captureResponse);
    }

    /**
     * @Since("0.9.0")
     * @Route("/api/_action/paypal/void-payment/{resourceType}/{resourceId}/{orderId}", name="api.action.paypal.void_payment", methods={"POST"})
     * @Acl({"order.editor"})
     *
     * @throws RequiredParameterInvalidException
     */
    public function voidPayment(
        Context $context,
        string $resourceType,
        string $resourceId,
        string $orderId
    ): JsonResponse {
        switch ($resourceType) {
            case RelatedResource::AUTHORIZE:
                $voidResponse = $this->authorizationResource->void(
                    $resourceId,
                    $this->getSalesChannelIdByOrderId($orderId, $context)
                );

                break;
            case RelatedResource::ORDER:
                $voidResponse = $this->ordersResource->void(
                    $resourceId,
                    $this->getSalesChannelIdByOrderId($orderId, $context)
                );

                break;
            default:
                throw new RequiredParameterInvalidException('resourceType');
        }

        $this->paymentStatusUtil->applyVoidStateToOrder($orderId, $context);

        return new JsonResponse($voidResponse);
    }

    /**
     * @throws OrderNotFoundException
     */
    private function getSalesChannelIdByOrderId(string $orderId, Context $context): string
    {
        /** @var OrderEntity|null $order */
        $order = $this->orderRepository->search(new Criteria([$orderId]), $context)->first();

        if ($order === null) {
            throw new OrderNotFoundException($orderId);
        }

        return $order->getSalesChannelId();
    }

    private function createRefund(Request $request): Refund
    {
        $refundAmount = $this->priceFormatter->formatPrice((float) $request->request->get(self::REQUEST_PARAMETER_REFUND_AMOUNT));
        $currency = $request->request->getAlpha(self::REQUEST_PARAMETER_CURRENCY);
        $invoiceNumber = (string) $request->request->get(self::REQUEST_PARAMETER_REFUND_INVOICE_NUMBER, '');
        $description = (string) $request->request->get(self::REQUEST_PARAMETER_DESCRIPTION, '');
        $reason = (string) $request->request->get(self::REQUEST_PARAMETER_REASON, '');

        $refund = new Refund();

        if ($invoiceNumber !== '') {
            $refund->setInvoiceNumber($invoiceNumber);
        }

        if ($refundAmount !== '0.00') {
            $amount = new RefundAmount();
            $amount->setTotal($refundAmount);
            $amount->setCurrency($currency);

            $refund->setAmount($amount);
        }

        if ($description !== '') {
            $refund->setDescription($description);
        }
        if ($reason !== '') {
            $refund->setReason($reason);
        }

        return $refund;
    }

    private function createCapture(Request $request): Capture
    {
        $amountToCapture = $this->priceFormatter->formatPrice((float) $request->request->get(self::REQUEST_PARAMETER_CAPTURE_AMOUNT));
        $currency = $request->request->getAlpha(self::REQUEST_PARAMETER_CURRENCY);
        $isFinalCapture = $request->request->getBoolean(self::REQUEST_PARAMETER_CAPTURE_IS_FINAL, true);

        $capture = new Capture();
        $capture->setIsFinalCapture($isFinalCapture);
        $amount = new CaptureAmount();
        $amount->setTotal($amountToCapture);
        $amount->setCurrency($currency);

        $capture->setAmount($amount);

        return $capture;
    }
}
