<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Test\Checkout\Payment;

use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionDefinition;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStateHandler;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Payment\Exception\AsyncPaymentProcessException;
use Shopware\Core\Checkout\Payment\PaymentMethodCollection;
use Shopware\Core\Checkout\Test\Cart\Common\Generator;
use Shopware\Core\Checkout\Test\Customer\Rule\OrderFixture;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\Test\TestCaseBase\DatabaseTransactionBehaviour;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\System\StateMachine\StateMachineRegistry;
use Swag\PayPal\Checkout\Payment\Handler\PlusPuiHandler;
use Swag\PayPal\Checkout\Payment\PayPalPaymentHandler;
use Swag\PayPal\Checkout\Payment\PayPalPuiPaymentHandler;
use Swag\PayPal\PaymentsApi\Patch\CustomTransactionPatchBuilder;
use Swag\PayPal\PaymentsApi\Patch\OrderNumberPatchBuilder;
use Swag\PayPal\PaymentsApi\Patch\PayerInfoPatchBuilder;
use Swag\PayPal\PaymentsApi\Patch\ShippingAddressPatchBuilder;
use Swag\PayPal\Setting\Service\SettingsValidationService;
use Swag\PayPal\Test\Helper\ConstantsForTesting;
use Swag\PayPal\Test\Helper\OrderTransactionTrait;
use Swag\PayPal\Test\Helper\PaymentTransactionTrait;
use Swag\PayPal\Test\Helper\SalesChannelContextTrait;
use Swag\PayPal\Test\Helper\ServicesTrait;
use Swag\PayPal\Test\Helper\StateMachineStateTrait;
use Swag\PayPal\Test\Mock\Repositories\DefinitionInstanceRegistryMock;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;

class PayPalPuiPaymentHandlerTest extends TestCase
{
    use ServicesTrait;
    use PaymentTransactionTrait;
    use OrderFixture;
    use SalesChannelContextTrait;
    use StateMachineStateTrait;
    use OrderTransactionTrait;
    use DatabaseTransactionBehaviour;

    private EntityRepositoryInterface $orderTransactionRepo;

    private StateMachineRegistry $stateMachineRegistry;

    protected function setUp(): void
    {
        $definitionRegistry = new DefinitionInstanceRegistryMock([], $this->createMock(ContainerInterface::class));
        $this->orderTransactionRepo = $definitionRegistry->getRepository(
            (new OrderTransactionDefinition())->getEntityName()
        );

        $this->stateMachineRegistry = $this->getContainer()->get(StateMachineRegistry::class);
    }

    public function testPay(): void
    {
        $handler = $this->createPayPalPuiPaymentHandler();

        $transactionId = $this->getTransactionId(Context::createDefaultContext(), $this->getContainer());
        $salesChannelContext = $this->createSalesChannelContext(
            $this->getContainer(),
            new PaymentMethodCollection()
        );
        $paymentTransaction = $this->createPaymentTransactionStruct('some-order-id', $transactionId);

        $handler->pay($paymentTransaction, new RequestDataBag(), $salesChannelContext);

        if (\method_exists(OrderTransactionStateHandler::class, 'processUnconfirmed')) {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_UNCONFIRMED, $transactionId, $salesChannelContext->getContext());
        } else {
            $this->assertOrderTransactionState(OrderTransactionStates::STATE_IN_PROGRESS, $transactionId, $salesChannelContext->getContext());
        }
    }

    public function testPayWithoutCustomer(): void
    {
        $handler = $this->createPayPalPuiPaymentHandler();

        $transactionId = $this->getTransactionId(Context::createDefaultContext(), $this->getContainer());
        $salesChannelContext = $this->createSalesChannelContext(
            $this->getContainer(),
            new PaymentMethodCollection(),
            null,
            false
        );
        $paymentTransaction = $this->createPaymentTransactionStruct('some-order-id', $transactionId);

        $this->expectException(AsyncPaymentProcessException::class);
        $this->expectExceptionMessage('The asynchronous payment process was interrupted due to the following error:
Customer is not logged in.');
        $handler->pay($paymentTransaction, new RequestDataBag(), $salesChannelContext);
        $this->assertOrderTransactionState(OrderTransactionStates::STATE_OPEN, $transactionId, $salesChannelContext->getContext());
    }

    public function testFinalize(): void
    {
        $handler = $this->createPayPalPuiPaymentHandler();

        $request = $this->createRequest();
        $salesChannelContext = Generator::createSalesChannelContext();
        $container = $this->getContainer();
        $transactionId = $this->getTransactionId($salesChannelContext->getContext(), $container);
        $handler->finalize(
            $this->createPaymentTransactionStruct(ConstantsForTesting::VALID_ORDER_ID, $transactionId),
            $request,
            $salesChannelContext
        );

        $this->assertOrderTransactionState(OrderTransactionStates::STATE_PAID, $transactionId, $salesChannelContext->getContext());
    }

    private function createRequest(): Request
    {
        return new Request([
            PayPalPaymentHandler::PAYPAL_REQUEST_PARAMETER_PAYER_ID => ConstantsForTesting::PAYER_ID_PAYMENT_PUI,
            PayPalPaymentHandler::PAYPAL_REQUEST_PARAMETER_PAYMENT_ID => 'PAYID-LUWEJRI80B04311G7544303K',
        ]);
    }

    private function createPayPalPuiPaymentHandler(): PayPalPuiPaymentHandler
    {
        $systemConfig = $this->createDefaultSystemConfig();
        $paymentResource = $this->createPaymentResource($systemConfig);
        $payerInfoPatchBuilder = new PayerInfoPatchBuilder();
        $shippingAddressPatchBuilder = new ShippingAddressPatchBuilder();
        $orderTransactionStateHandler = new OrderTransactionStateHandler($this->stateMachineRegistry);

        return new PayPalPuiPaymentHandler(
            new PlusPuiHandler(
                $paymentResource,
                $this->orderTransactionRepo,
                $this->createPaymentBuilder($systemConfig),
                $payerInfoPatchBuilder,
                new OrderNumberPatchBuilder(),
                new CustomTransactionPatchBuilder(),
                $shippingAddressPatchBuilder,
                $systemConfig,
                $orderTransactionStateHandler,
                new NullLogger()
            ),
            $paymentResource,
            new OrderTransactionStateHandler($this->stateMachineRegistry),
            $this->orderTransactionRepo,
            new NullLogger(),
            new SettingsValidationService($systemConfig, new NullLogger()),
        );
    }
}
