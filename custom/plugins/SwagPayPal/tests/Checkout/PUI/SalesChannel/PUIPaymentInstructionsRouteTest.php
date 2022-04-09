<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Test\Checkout\PUI\SalesChannel;

use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\Price\Struct\CartPrice;
use Shopware\Core\Checkout\Cart\Tax\Struct\CalculatedTaxCollection;
use Shopware\Core\Checkout\Cart\Tax\Struct\TaxRuleCollection;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStateHandler;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Order\OrderStates;
use Shopware\Core\Checkout\Test\Customer\Rule\OrderFixture;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\System\SalesChannel\Context\SalesChannelContextService;
use Shopware\Core\System\SalesChannel\Context\SalesChannelContextServiceInterface;
use Shopware\Core\System\SalesChannel\Context\SalesChannelContextServiceParameters;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\StateMachine\StateMachineRegistry;
use Swag\PayPal\Checkout\PUI\Exception\MissingPaymentInstructionsException;
use Swag\PayPal\Checkout\PUI\Exception\PaymentInstructionsNotReadyException;
use Swag\PayPal\Checkout\PUI\SalesChannel\AbstractPUIPaymentInstructionsRoute;
use Swag\PayPal\Checkout\PUI\SalesChannel\PUIPaymentInstructionsRoute;
use Swag\PayPal\RestApi\V2\Resource\OrderResource;
use Swag\PayPal\SwagPayPal;
use Swag\PayPal\Test\Helper\OrderTransactionTrait;
use Swag\PayPal\Test\Helper\ServicesTrait;
use Swag\PayPal\Test\Helper\StateMachineStateTrait;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetOrderPUIApproved;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetOrderPUICompleted;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetOrderPUIPending;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetOrderPUIVoided;
use Swag\PayPal\Test\Mock\PayPal\Client\_fixtures\V2\GetRefundedOrderCapture;
use Swag\PayPal\Util\Lifecycle\Method\PaymentMethodDataRegistry;
use Swag\PayPal\Util\Lifecycle\Method\PUIMethodData;

class PUIPaymentInstructionsRouteTest extends TestCase
{
    use ServicesTrait;
    use OrderFixture;
    use StateMachineStateTrait;
    use OrderTransactionTrait;

    public function testGetPaymentInstructionsPending(): void
    {
        $route = $this->getRoute();
        $transactionId = $this->createOrderTransaction(GetOrderPUIPending::ID);

        try {
            $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        } catch (PaymentInstructionsNotReadyException $e) {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_IN_PROGRESS, $transactionId, Context::createDefaultContext());
        }
    }

    public function testGetPaymentInstructionsApproved(): void
    {
        $route = $this->getRoute();
        $transactionId = $this->createOrderTransaction(GetOrderPUIApproved::ID);

        try {
            $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        } catch (PaymentInstructionsNotReadyException $e) {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_AUTHORIZED, $transactionId, Context::createDefaultContext());
        }
    }

    public function testGetPaymentInstructionsDuplicateApproved(): void
    {
        $route = $this->getRoute();
        $transactionId = $this->createOrderTransaction(GetOrderPUIApproved::ID);

        try {
            $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        } catch (PaymentInstructionsNotReadyException $e) {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_AUTHORIZED, $transactionId, Context::createDefaultContext());
        }

        try {
            $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        } catch (PaymentInstructionsNotReadyException $e) {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_AUTHORIZED, $transactionId, Context::createDefaultContext());
        }
    }

    public function testGetPaymentInstructionsCompleted(): void
    {
        $route = $this->getRoute();
        $transactionId = $this->createOrderTransaction(GetOrderPUICompleted::ID);

        $response = $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        $this->assertOrderTransactionState(OrderTransactionStates::STATE_PAID, $transactionId, Context::createDefaultContext());
        static::assertSame(GetOrderPUICompleted::BANK_IBAN, $response->getPaymentInstructions()->getDepositBankDetails()->getIban());

        /** @var EntityRepositoryInterface $orderTransactionRepository */
        $orderTransactionRepository = $this->getContainer()->get('order_transaction.repository');
        /** @var OrderTransactionEntity|null $transaction */
        $transaction = $orderTransactionRepository->search(new Criteria([$transactionId]), Context::createDefaultContext())->first();
        static::assertNotNull($transaction);
        static::assertSame(GetOrderPUICompleted::BANK_IBAN, ($transaction->getCustomFields() ?? [])[SwagPayPal::ORDER_TRANSACTION_CUSTOM_FIELDS_PAYPAL_PUI_INSTRUCTION]['deposit_bank_details']['iban']);
    }

    public function testGetPaymentInstructionsExisting(): void
    {
        $route = $this->getRoute();
        $transactionId = $this->createOrderTransaction(GetOrderPUIPending::ID, ['deposit_bank_details' => ['iban' => GetOrderPUICompleted::BANK_IBAN]]);

        $response = $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        static::assertSame(GetOrderPUICompleted::BANK_IBAN, $response->getPaymentInstructions()->getDepositBankDetails()->getIban());
    }

    public function testGetPaymentInstructionsInvalidOrder(): void
    {
        $route = $this->getRoute();
        $transactionId = $this->createOrderTransaction(GetRefundedOrderCapture::ID);

        try {
            $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        } catch (MissingPaymentInstructionsException $e) {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_IN_PROGRESS, $transactionId, Context::createDefaultContext());
        }
    }

    public function testGetPaymentInstructionsVoided(): void
    {
        $route = $this->getRoute();
        $transactionId = $this->createOrderTransaction(GetOrderPUIVoided::ID);

        try {
            $route->getPaymentInstructions($transactionId, $this->getSalesChannelContext());
        } catch (PaymentInstructionsNotReadyException $e) {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_FAILED, $transactionId, Context::createDefaultContext());
        }
    }

    private function getRoute(): AbstractPUIPaymentInstructionsRoute
    {
        /** @var EntityRepositoryInterface $orderTransactionRepository */
        $orderTransactionRepository = $this->getContainer()->get('order_transaction.repository');
        $orderResource = new OrderResource($this->createPayPalClientFactory());

        return new PUIPaymentInstructionsRoute(
            $orderTransactionRepository,
            $orderResource,
            $this->getContainer()->get(OrderTransactionStateHandler::class)
        );
    }

    private function createOrderTransaction(string $paypalOrderId, ?array $instructions = null): string
    {
        $transactionId = Uuid::randomHex();
        $addressId = Uuid::randomHex();

        $stateMachineRegistry = $this->getContainer()->get(StateMachineRegistry::class);
        $orderStateId = $stateMachineRegistry->getInitialState(OrderStates::STATE_MACHINE, Context::createDefaultContext())->getId();
        $transactionStateId = $stateMachineRegistry->getInitialState(OrderTransactionStates::STATE_MACHINE, Context::createDefaultContext())->getId();

        $paymentMethodDataRegistry = $this->getContainer()->get(PaymentMethodDataRegistry::class);
        $paymentMethodId = $paymentMethodDataRegistry->getEntityIdFromData($paymentMethodDataRegistry->getPaymentMethod(PUIMethodData::class), Context::createDefaultContext());

        $order = [
            'orderNumber' => Uuid::randomHex(),
            'orderDateTime' => (new \DateTimeImmutable())->format(Defaults::STORAGE_DATE_TIME_FORMAT),
            'price' => new CartPrice(10, 10, 10, new CalculatedTaxCollection(), new TaxRuleCollection(), CartPrice::TAX_STATE_NET),
            'shippingCosts' => new CalculatedPrice(10, 10, new CalculatedTaxCollection(), new TaxRuleCollection()),
            'orderCustomer' => [
                'email' => 'test@example.com',
                'salutationId' => $this->getValidSalutationId(),
                'firstName' => 'Max',
                'lastName' => 'Mustermann',
            ],
            'stateId' => $orderStateId,
            'paymentMethodId' => $paymentMethodId,
            'currencyId' => Defaults::CURRENCY,
            'currencyFactor' => 1.0,
            'salesChannelId' => Defaults::SALES_CHANNEL,
            'billingAddressId' => $addressId,
            'addresses' => [
                [
                    'id' => $addressId,
                    'salutationId' => $this->getValidSalutationId(),
                    'firstName' => 'Max',
                    'lastName' => 'Mustermann',
                    'street' => 'Ebbinghoff 10',
                    'zipcode' => '48624',
                    'city' => 'Schöppingen',
                    'countryId' => $this->getValidCountryId(),
                ],
            ],
            'lineItems' => [],
            'deliveries' => [],
            'transactions' => [
                [
                    'id' => $transactionId,
                    'paymentMethodId' => $paymentMethodId,
                    'stateId' => $transactionStateId,
                    'amount' => new CalculatedPrice(100, 100, new CalculatedTaxCollection(), new TaxRuleCollection(), 1),
                    'payload' => '{}',
                    'customFields' => [
                        SwagPayPal::ORDER_TRANSACTION_CUSTOM_FIELDS_PAYPAL_ORDER_ID => $paypalOrderId,
                        SwagPayPal::ORDER_TRANSACTION_CUSTOM_FIELDS_PAYPAL_PUI_INSTRUCTION => $instructions,
                    ],
                ],
            ],
            'context' => '{}',
            'payload' => '{}',
        ];

        /** @var EntityRepositoryInterface $orderRepository */
        $orderRepository = $this->getContainer()->get('order.repository');
        $orderRepository->upsert([$order], Context::createDefaultContext());

        $this->getContainer()->get(OrderTransactionStateHandler::class)->process($transactionId, Context::createDefaultContext());

        return $transactionId;
    }

    private function getSalesChannelContext(): SalesChannelContext
    {
        /** @var SalesChannelContextServiceInterface $contextService */
        $contextService = $this->getContainer()->get(SalesChannelContextService::class);

        return $contextService->get(new SalesChannelContextServiceParameters(Defaults::SALES_CHANNEL, Uuid::randomHex()));
    }
}
