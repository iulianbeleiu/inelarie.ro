<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Test\Checkout\Method;

use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionDefinition;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStateHandler;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Payment\Exception\SyncPaymentProcessException;
use Shopware\Core\Checkout\Payment\PaymentMethodCollection;
use Shopware\Core\Checkout\Test\Cart\Common\Generator;
use Shopware\Core\Checkout\Test\Customer\Rule\OrderFixture;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\System\StateMachine\StateMachineRegistry;
use Swag\PayPal\Checkout\Payment\Method\AbstractPaymentMethodHandler;
use Swag\PayPal\Checkout\Payment\Method\ACDCHandler;
use Swag\PayPal\Checkout\Payment\Service\OrderExecuteService;
use Swag\PayPal\Checkout\Payment\Service\OrderPatchService;
use Swag\PayPal\Checkout\Payment\Service\TransactionDataService;
use Swag\PayPal\OrdersApi\Patch\CustomIdPatchBuilder;
use Swag\PayPal\OrdersApi\Patch\OrderNumberPatchBuilder;
use Swag\PayPal\RestApi\PartnerAttributionId;
use Swag\PayPal\RestApi\V2\Api\Patch as PatchV2;
use Swag\PayPal\RestApi\V2\Resource\OrderResource;
use Swag\PayPal\Setting\Service\SettingsValidationService;
use Swag\PayPal\SwagPayPal;
use Swag\PayPal\Test\Checkout\Payment\PayPalPaymentHandlerTest;
use Swag\PayPal\Test\Helper\OrderTransactionTrait;
use Swag\PayPal\Test\Helper\PaymentTransactionTrait;
use Swag\PayPal\Test\Helper\SalesChannelContextTrait;
use Swag\PayPal\Test\Helper\ServicesTrait;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\CaptureOrderCapture;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetAuthorization;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetOrderAuthorization;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetOrderCapture;
use Swag\PayPal\Test\Mock\PayPal\Client\PayPalClientFactoryMock;
use Swag\PayPal\Test\Mock\Repositories\DefinitionInstanceRegistryMock;
use Swag\PayPal\Test\Mock\Repositories\OrderTransactionRepoMock;
use Swag\PayPal\Test\PaymentsApi\Builder\OrderPaymentBuilderTest;
use Symfony\Component\DependencyInjection\ContainerInterface;

class ACDCHandlerTest extends TestCase
{
    use PaymentTransactionTrait;
    use ServicesTrait;
    use OrderFixture;
    use OrderTransactionTrait;
    use SalesChannelContextTrait;

    private EntityRepositoryInterface $orderTransactionRepo;

    private StateMachineRegistry $stateMachineRegistry;

    private PayPalClientFactoryMock $clientFactory;

    protected function setUp(): void
    {
        $definitionRegistry = new DefinitionInstanceRegistryMock([], $this->createMock(ContainerInterface::class));
        $this->orderTransactionRepo = $definitionRegistry->getRepository(
            (new OrderTransactionDefinition())->getEntityName()
        );
        $this->stateMachineRegistry = $this->getContainer()->get(StateMachineRegistry::class);
    }

    public function testPayCapture(): void
    {
        $handler = $this->createPaymentHandler($this->getDefaultConfigData());

        $transactionId = $this->getTransactionId(Context::createDefaultContext(), $this->getContainer());
        $salesChannelContext = $this->createSalesChannelContext($this->getContainer(), new PaymentMethodCollection());
        $paymentTransaction = $this->createPaymentTransactionStruct('some-order-id', $transactionId);

        $handler->pay($paymentTransaction, $this->createRequest(GetOrderCapture::ID), $salesChannelContext);

        $this->assertOrderTransactionState(OrderTransactionStates::STATE_PAID, $transactionId, $salesChannelContext->getContext());
        $this->assertCustomFields(GetOrderCapture::ID, PartnerAttributionId::PAYPAL_PPCP, CaptureOrderCapture::CAPTURE_ID);
        $this->assertPatchData($transactionId);
    }

    public function testPayAuthorize(): void
    {
        $handler = $this->createPaymentHandler($this->getDefaultConfigData());

        $transactionId = $this->getTransactionId(Context::createDefaultContext(), $this->getContainer());
        $salesChannelContext = $this->createSalesChannelContext($this->getContainer(), new PaymentMethodCollection());
        $paymentTransaction = $this->createPaymentTransactionStruct('some-order-id', $transactionId);

        $handler->pay($paymentTransaction, $this->createRequest(GetOrderAuthorization::ID), $salesChannelContext);

        $this->assertOrderTransactionState(OrderTransactionStates::STATE_AUTHORIZED, $transactionId, $salesChannelContext->getContext());
        $this->assertCustomFields(GetOrderAuthorization::ID, PartnerAttributionId::PAYPAL_PPCP, GetAuthorization::ID);
        $this->assertPatchData($transactionId);
    }

    public function testPayWithExceptionDuringPayPalCommunication(): void
    {
        $handler = $this->createPaymentHandler($this->getDefaultConfigData());

        $salesChannelContext = $this->createSalesChannelContext($this->getContainer(), new PaymentMethodCollection());
        $transactionId = $this->getTransactionId(Context::createDefaultContext(), $this->getContainer());
        $paymentTransaction = $this->createPaymentTransactionStruct('some-order-id', $transactionId);

        $this->expectException(SyncPaymentProcessException::class);
        $this->expectExceptionMessage('The synchronous payment process was interrupted due to the following error:
The error "UNPROCESSABLE_ENTITY" occurred with the following message: The requested action could not be completed, was semantically incorrect, or failed business validation. The instrument presented  was either declined by the processor or bank, or it can\'t be used for this payment. INSTRUMENT_DECLINED ');
        $handler->pay($paymentTransaction, $this->createRequest(PayPalPaymentHandlerTest::PAYPAL_ORDER_ID_INSTRUMENT_DECLINED), $salesChannelContext);
    }

    public function testPayWithInvalidSettingsException(): void
    {
        $handler = $this->createPaymentHandler();
        $salesChannelContext = Generator::createSalesChannelContext();
        $transactionId = $this->getTransactionId($salesChannelContext->getContext(), $this->getContainer());
        $paymentTransaction = $this->createPaymentTransactionStruct('some-order-id', $transactionId);

        $this->expectException(SyncPaymentProcessException::class);
        $this->expectExceptionMessage('The synchronous payment process was interrupted due to the following error:
Required setting "SwagPayPal.settings.clientId" is missing or invalid');
        $handler->pay($paymentTransaction, $this->createRequest(GetOrderCapture::ID), $salesChannelContext);
    }

    public function testPayWithoutValidOrderId(): void
    {
        $handler = $this->createPaymentHandler($this->getDefaultConfigData());

        $salesChannelContext = $this->createSalesChannelContext($this->getContainer(), new PaymentMethodCollection());
        $paymentTransaction = $this->createPaymentTransactionStruct();
        $this->expectException(SyncPaymentProcessException::class);
        $this->expectExceptionMessage('The synchronous payment process was interrupted due to the following error:
Missing PayPal order id');
        $handler->pay($paymentTransaction, $this->createRequest(), $salesChannelContext);
    }

    public function testPayWithDuplicateTransaction(): void
    {
        $handler = $this->createPaymentHandler($this->getDefaultConfigData());

        $salesChannelContext = $this->createSalesChannelContext($this->getContainer(), new PaymentMethodCollection());
        $transactionId = $this->getTransactionId(Context::createDefaultContext(), $this->getContainer());
        $paymentTransaction = $this->createPaymentTransactionStruct('some-order-id', $transactionId);
        CaptureOrderCapture::setDuplicateOrderNumber(true);

        $handler->pay($paymentTransaction, $this->createRequest(PayPalPaymentHandlerTest::PAYPAL_ORDER_ID_DUPLICATE_ORDER_NUMBER), $salesChannelContext);

        $this->assertOrderTransactionState(OrderTransactionStates::STATE_PAID, $transactionId, $salesChannelContext->getContext());
        $this->assertCustomFields(PayPalPaymentHandlerTest::PAYPAL_ORDER_ID_DUPLICATE_ORDER_NUMBER, PartnerAttributionId::PAYPAL_PPCP, CaptureOrderCapture::CAPTURE_ID);
        $this->assertPatchData($transactionId, true);
    }

    public function assertPatchData(string $orderTransactionId, bool $isDuplicateTransaction = false): void
    {
        $patchData = $this->clientFactory->getClient()->getData();
        static::assertCount($isDuplicateTransaction ? 1 : 2, $patchData);
        foreach ($patchData as $patch) {
            static::assertInstanceOf(PatchV2::class, $patch);
            if ($patch->getPath() === "/purchase_units/@reference_id=='default'/invoice_id") {
                if ($isDuplicateTransaction) {
                    static::assertSame(PatchV2::OPERATION_REMOVE, $patch->getOp());
                } else {
                    static::assertSame(OrderPaymentBuilderTest::TEST_ORDER_NUMBER, $patch->getValue());
                    static::assertSame(PatchV2::OPERATION_ADD, $patch->getOp());
                }
            }

            if ($patch->getPath() === "/purchase_units/@reference_id=='default'/custom_id") {
                static::assertSame($orderTransactionId, $patch->getValue());
                static::assertSame(PatchV2::OPERATION_ADD, $patch->getOp());
            }
        }
    }

    private function createPaymentHandler(array $settings = []): ACDCHandler
    {
        $systemConfig = $this->createSystemConfigServiceMock($settings);
        $this->clientFactory = $this->createPayPalClientFactoryWithService($systemConfig);
        $orderResource = new OrderResource($this->clientFactory);
        $orderTransactionStateHandler = new OrderTransactionStateHandler($this->stateMachineRegistry);
        $logger = new NullLogger();

        return new ACDCHandler(
            new SettingsValidationService($systemConfig, new NullLogger()),
            $orderTransactionStateHandler,
            new OrderExecuteService(
                $orderResource,
                $orderTransactionStateHandler,
                new OrderNumberPatchBuilder(),
                $logger
            ),
            new OrderPatchService(
                new CustomIdPatchBuilder(),
                $systemConfig,
                new OrderNumberPatchBuilder(),
                $orderResource,
            ),
            new TransactionDataService(
                $this->orderTransactionRepo,
            ),
            $logger,
        );
    }

    private function createRequest(?string $orderId = null): RequestDataBag
    {
        return new RequestDataBag([
            AbstractPaymentMethodHandler::PAYPAL_PAYMENT_ORDER_ID_INPUT_NAME => $orderId,
        ]);
    }

    private function assertCustomFields(string $orderId, string $attributionId, ?string $resourceId): void
    {
        /** @var OrderTransactionRepoMock $orderTransactionRepo */
        $orderTransactionRepo = $this->orderTransactionRepo;
        $updatedData = $orderTransactionRepo->getData();

        static::assertSame($orderId, $updatedData['customFields'][SwagPayPal::ORDER_TRANSACTION_CUSTOM_FIELDS_PAYPAL_ORDER_ID]);
        static::assertSame($attributionId, $updatedData['customFields'][SwagPayPal::ORDER_TRANSACTION_CUSTOM_FIELDS_PAYPAL_PARTNER_ATTRIBUTION_ID]);
        static::assertSame($resourceId, $updatedData['customFields'][SwagPayPal::ORDER_TRANSACTION_CUSTOM_FIELDS_PAYPAL_RESOURCE_ID]);
    }
}
