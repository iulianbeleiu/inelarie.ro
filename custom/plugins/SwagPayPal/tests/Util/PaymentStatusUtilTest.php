<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Test\Util;

use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Cart\Exception\OrderNotFoundException;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStateHandler;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Checkout\Payment\Exception\InvalidOrderException;
use Shopware\Core\Checkout\Test\Customer\Rule\OrderFixture;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Test\TestCaseBase\DatabaseTransactionBehaviour;
use Shopware\Core\Framework\Test\TestCaseBase\KernelTestBehaviour;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\System\StateMachine\Aggregation\StateMachineState\StateMachineStateEntity;
use Shopware\Core\System\StateMachine\StateMachineRegistry;
use Swag\PayPal\RestApi\V1\Api\Capture;
use Swag\PayPal\RestApi\V1\Api\Payment;
use Swag\PayPal\RestApi\V1\Api\Payment\Transaction;
use Swag\PayPal\RestApi\V1\Api\Refund;
use Swag\PayPal\RestApi\V1\Api\Refund\TotalRefundedAmount;
use Swag\PayPal\Util\PaymentStatusUtil;
use Swag\PayPal\Util\PriceFormatter;

class PaymentStatusUtilTest extends TestCase
{
    use KernelTestBehaviour;
    use DatabaseTransactionBehaviour;
    use OrderFixture;

    private const FIRST_TRANSACTION_ID = '9535b385fc7544f08e21b8b74b52ff4a';
    private const SECOND_TRANSACTION_ID = '8535b385fc7544f08e21b8b74b52ff4a';

    private PaymentStatusUtil $paymentStatusUtil;

    private StateMachineRegistry $stateMachineRegistry;

    private EntityRepositoryInterface $orderRepository;

    private EntityRepositoryInterface $orderTransactionRepository;

    protected function setUp(): void
    {
        $container = $this->getContainer();
        $this->stateMachineRegistry = $container->get(StateMachineRegistry::class);

        /** @var EntityRepositoryInterface $orderRepository */
        $orderRepository = $container->get('order.repository');
        $this->orderRepository = $orderRepository;

        /** @var EntityRepositoryInterface $orderTransactionRepository */
        $orderTransactionRepository = $container->get('order_transaction.repository');
        $this->orderTransactionRepository = $orderTransactionRepository;

        $this->paymentStatusUtil = new PaymentStatusUtil(
            $this->orderRepository,
            $container->get(OrderTransactionStateHandler::class),
            new PriceFormatter()
        );
    }

    public function testApplyVoidStateToOrder(): void
    {
        $orderId = $this->createBasicOrder();
        $this->paymentStatusUtil->applyVoidStateToOrder($orderId, Context::createDefaultContext());

        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_CANCELLED);
    }

    public function dataProviderTestApplyCaptureState(): array
    {
        $finalCaptureResponse = new Capture();
        $finalCaptureResponse->setIsFinalCapture(true);
        $notFinalCaptureResponse = new Capture();
        $notFinalCaptureResponse->setIsFinalCapture(false);

        return [
            [
                $finalCaptureResponse,
                OrderTransactionStates::STATE_PAID,
            ],
            [
                $notFinalCaptureResponse,
                OrderTransactionStates::STATE_PARTIALLY_PAID,
            ],
        ];
    }

    /**
     * @dataProvider dataProviderTestApplyCaptureState
     */
    public function testApplyCaptureState(Capture $captureResponse, string $expectedOrderTransactionState): void
    {
        $orderId = $this->createBasicOrder();
        $this->paymentStatusUtil->applyCaptureState(
            $orderId,
            $captureResponse,
            Context::createDefaultContext()
        );

        $this->assertTransactionState($orderId, $expectedOrderTransactionState);
    }

    public function testMultipleApplyCaptureState(): void
    {
        $orderId = $this->createBasicOrder();
        $context = Context::createDefaultContext();

        $firstCapture = new Capture();
        $firstCapture->setIsFinalCapture(false);

        $this->paymentStatusUtil->applyCaptureState($orderId, $firstCapture, $context);
        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_PARTIALLY_PAID);

        $secondCapture = new Capture();
        $secondCapture->setIsFinalCapture(true);

        $this->paymentStatusUtil->applyCaptureState($orderId, $secondCapture, $context);

        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_PAID);
    }

    public function testSeveralCapturesAndRefundsWorkflow(): void
    {
        $orderId = $this->createBasicOrder();
        $context = Context::createDefaultContext();

        $firstCapture = new Capture();
        $firstCapture->setIsFinalCapture(false);

        $this->paymentStatusUtil->applyCaptureState($orderId, $firstCapture, $context);
        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_PARTIALLY_PAID);

        $partialRefundResponse = new Refund();
        $partialRefundResponse->assign(
            ['totalRefundedAmount' => (new TotalRefundedAmount())->assign(['value' => '2.00'])]
        );

        $transaction = new Transaction();
        $transaction->assign([
            'related_resources' => [
                ['capture' => ['amount' => ['total' => '10.00']]],
                ['refund' => ['amount' => ['total' => '2.00']]],
            ],
        ]);

        $paymentResponse = new Payment();
        $paymentResponse->setTransactions([$transaction]);
        $this->paymentStatusUtil->applyRefundStateToCapture($orderId, $partialRefundResponse, $paymentResponse, $context);
        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_PARTIALLY_REFUNDED);

        $secondCapture = new Capture();
        $secondCapture->setIsFinalCapture(false);

        $this->paymentStatusUtil->applyCaptureState($orderId, $secondCapture, $context);
        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_PARTIALLY_PAID);

        $thirdCapture = new Capture();
        $thirdCapture->setIsFinalCapture(true);

        $this->paymentStatusUtil->applyCaptureState($orderId, $thirdCapture, $context);
        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_PAID);

        $secondPartialRefundResponse = new Refund();
        $secondPartialRefundResponse->assign(
            ['totalRefundedAmount' => (new TotalRefundedAmount())->assign(['value' => '4.00'])]
        );

        $secondTransaction = new Transaction();
        $secondTransaction->assign([
            'related_resources' => [
                ['capture' => ['amount' => ['total' => '10.00']]],
                ['refund' => ['amount' => ['total' => '2.00']]],
                ['capture' => ['amount' => ['total' => '2.00']]],
                ['refund' => ['amount' => ['total' => '2.00']]],
                ['capture' => ['amount' => ['total' => '2.00']]],
            ],
        ]);

        $secondPaymentResponse = new Payment();
        $secondPaymentResponse->setTransactions([$secondTransaction]);
        $this->paymentStatusUtil->applyRefundStateToCapture($orderId, $secondPartialRefundResponse, $secondPaymentResponse, $context);
        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_PARTIALLY_REFUNDED);

        $thirdPartialRefundResponse = new Refund();
        $thirdPartialRefundResponse->assign(
            ['totalRefundedAmount' => (new TotalRefundedAmount())->assign(['value' => '14.00'])]
        );

        $thirdTransaction = new Transaction();
        $thirdTransaction->assign([
            'related_resources' => [
                ['capture' => ['amount' => ['total' => '10.00']]],
                ['refund' => ['amount' => ['total' => '2.00']]],
                ['capture' => ['amount' => ['total' => '2.00']]],
                ['refund' => ['amount' => ['total' => '2.00']]],
                ['capture' => ['amount' => ['total' => '2.00']]],
                ['refund' => ['amount' => ['total' => '10.00']]],
            ],
        ]);

        $thirdPaymentResponse = new Payment();
        $thirdPaymentResponse->setTransactions([$thirdTransaction]);
        $this->paymentStatusUtil->applyRefundStateToCapture($orderId, $thirdPartialRefundResponse, $thirdPaymentResponse, $context);
        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_REFUNDED);
    }

    public function dataProviderTestApplyRefundStateToPayment(): array
    {
        $completeRefundResponse = new Refund();
        $completeRefundResponse->assign(['totalRefundedAmount' => (new Refund\TotalRefundedAmount())->assign(['value' => '15'])]);

        $partialRefundResponse = new Refund();
        $partialRefundResponse->assign(['totalRefundedAmount' => (new Refund\TotalRefundedAmount())->assign(['value' => '14.99'])]);

        return [
            [
                $completeRefundResponse,
                OrderTransactionStates::STATE_REFUNDED,
            ],
            [
                $partialRefundResponse,
                OrderTransactionStates::STATE_PARTIALLY_REFUNDED,
            ],
        ];
    }

    /**
     * @dataProvider dataProviderTestApplyRefundStateToPayment
     */
    public function testApplyRefundStateToPayment(Refund $refundResponse, string $expectedOrderTransactionState): void
    {
        $orderId = $this->createBasicOrder();
        $captureResponse = new Capture();
        $captureResponse->setIsFinalCapture(true);
        $context = Context::createDefaultContext();

        $this->paymentStatusUtil->applyCaptureState($orderId, $captureResponse, $context);

        $this->paymentStatusUtil->applyRefundStateToPayment($orderId, $refundResponse, $context);

        $this->assertTransactionState($orderId, $expectedOrderTransactionState);
    }

    public function testApplyRefundStateToCapture(): void
    {
        $orderId = $this->createBasicOrder();
        $captureResponse = new Capture();
        $captureResponse->setIsFinalCapture(true);
        $context = Context::createDefaultContext();

        $this->paymentStatusUtil->applyCaptureState($orderId, $captureResponse, $context);

        $completeRefundResponse = new Refund();
        $completeRefundResponse->assign(
            ['totalRefundedAmount' => (new TotalRefundedAmount())->assign(['value' => '15'])]
        );

        $this->paymentStatusUtil->applyRefundStateToCapture($orderId, $completeRefundResponse, new Payment(), $context);

        $this->assertTransactionState($orderId, OrderTransactionStates::STATE_REFUNDED);
    }

    public function testApplyVoidStateToOrderWithNoOrder(): void
    {
        $this->expectException(OrderNotFoundException::class);
        $this->paymentStatusUtil->applyVoidStateToOrder(Uuid::randomHex(), Context::createDefaultContext());
    }

    public function testApplyVoidStateToOrderWithNoOrderTransaction(): void
    {
        $orderId = $this->createBasicOrder(false);
        $this->expectException(InvalidOrderException::class);
        $this->paymentStatusUtil->applyVoidStateToOrder($orderId, Context::createDefaultContext());
    }

    private function createBasicOrder(bool $withTransaction = true): string
    {
        $orderId = Uuid::randomHex();
        $context = Context::createDefaultContext();

        $orderData = $this->getOrderData($orderId, $context);
        $this->orderRepository->create($orderData, $context);

        if ($withTransaction) {
            $firstTransactionData = [
                [
                    'id' => self::FIRST_TRANSACTION_ID,
                    'orderId' => $orderId,
                    'paymentMethodId' => $this->getValidPaymentMethodId(),
                    'amount' => [
                        'unitPrice' => 5.0,
                        'totalPrice' => 15.0,
                        'quantity' => 3,
                        'calculatedTaxes' => [],
                        'taxRules' => [],
                    ],
                    'stateId' => $this->stateMachineRegistry->getInitialState(
                        OrderTransactionStates::STATE_MACHINE,
                        $context
                    )->getId(),
                ],
            ];
            $secondTransactionData = [
                [
                    'id' => self::SECOND_TRANSACTION_ID,
                    'orderId' => $orderId,
                    'paymentMethodId' => $this->getValidPaymentMethodId(),
                    'amount' => [
                        'unitPrice' => 5.0,
                        'totalPrice' => 15.0,
                        'quantity' => 3,
                        'calculatedTaxes' => [],
                        'taxRules' => [],
                    ],
                    'stateId' => $this->stateMachineRegistry->getInitialState(
                        OrderTransactionStates::STATE_MACHINE,
                        $context
                    )->getId(),
                ],
            ];
            // Do not create simultaneously, so they have slightly different created dates
            $this->orderTransactionRepository->create($firstTransactionData, $context);
            $this->orderTransactionRepository->create($secondTransactionData, $context);

            $updateData = [
                [
                    'id' => $orderId,
                    'transactions' => [
                        ['id' => self::FIRST_TRANSACTION_ID],
                        ['id' => self::SECOND_TRANSACTION_ID],
                    ],
                ],
            ];

            $this->orderRepository->update($updateData, $context);
        }

        return $orderId;
    }

    private function assertTransactionState(string $orderId, string $expectedOrderTransactionState): void
    {
        $changedOrder = $this->getOrder($orderId);
        static::assertNotNull($changedOrder);

        $orderTransactionCollection = $changedOrder->getTransactions();
        static::assertNotNull($orderTransactionCollection);

        $orderTransactionEntity = $orderTransactionCollection->get(self::SECOND_TRANSACTION_ID);
        static::assertInstanceOf(OrderTransactionEntity::class, $orderTransactionEntity);

        $stateMachineState = $orderTransactionEntity->getStateMachineState();
        static::assertInstanceOf(StateMachineStateEntity::class, $stateMachineState);
        static::assertSame($expectedOrderTransactionState, $stateMachineState->getTechnicalName());
    }

    private function getOrder(string $orderId): ?OrderEntity
    {
        $criteria = new Criteria([$orderId]);
        $criteria->addAssociation('transactions');

        return $this->orderRepository->search($criteria, Context::createDefaultContext())->get($orderId);
    }
}
