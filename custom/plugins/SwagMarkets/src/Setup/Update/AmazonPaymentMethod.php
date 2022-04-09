<?php declare(strict_types=1);

namespace Swag\Markets\Setup\Update;

use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\DefaultPayment;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\Update\Exception\UpdateFailedException;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;
use Swag\Markets\Service\ActivationService;
use Swag\Markets\Service\ConfigService;
use Swag\Markets\Service\SalesChannelTypeService;
use Symfony\Component\DependencyInjection\ContainerInterface;

class AmazonPaymentMethod
{
    /** @var ContainerInterface */
    private $container;

    /** @var UpdateContext */
    private $updateContext;

    /**
     * @param  ContainerInterface  $container
     * @param  UpdateContext  $updateContext
     */
    public function __construct(ContainerInterface $container, UpdateContext $updateContext)
    {
        $this->container = $container;
        $this->updateContext = $updateContext;
    }

    public function update(): void
    {
        try {
            $paymentMethodRepository = $this->container->get('payment_method.repository');
            $paymentMethodRepository->upsert(
                [
                    [
                        'id' => ActivationService::AMAZON_PAYMENT_METHOD_ID,
                        'handlerIdentifier' => DefaultPayment::class,
                        'name' => 'Shopware Markets - Amazon',
                        'description' => 'Shopware Markets - Amazon',
                        'active' => true,
                        'afterOrderEnabled' => false
                    ]
                ],
                $this->updateContext->getContext()
            );

            $this->updatePaymentMethodForAmazonIfSalesChannelExists();
        } catch (\Exception $e) {
            throw new UpdateFailedException($e->getMessage());
        }
    }

    private function updatePaymentMethodForAmazonIfSalesChannelExists(): void
    {
        /** @var EntityRepositoryInterface $salesChannelRepository */
        $salesChannelRepository = $this->container->get('sales_channel.repository');

        /** @var SalesChannelEntity $salesChannelEntity */
        $salesChannelEntity = $salesChannelRepository->search(
            (new Criteria())->addFilter(new EqualsFilter('typeId',
                SalesChannelTypeService::AMAZON_SALES_CHANNEL_TYPE_ID)),
            $this->updateContext->getContext()
        )->first();

        if ($salesChannelEntity === null) {
            return;
        }

        $salesChannelRepository->update([
            [
                'id' => $salesChannelEntity->getId(),
                'paymentMethodId' => ActivationService::AMAZON_PAYMENT_METHOD_ID
            ]
        ], $this->updateContext->getContext());

        $this->addSalesChannelPaymentMethod($salesChannelEntity);
        $this->resetPaymentMethodIsSetForAmazon();
    }

    /**
     * @param  SalesChannelEntity  $salesChannelEntity
     */
    private function addSalesChannelPaymentMethod(SalesChannelEntity $salesChannelEntity): void
    {
        /** @var EntityRepositoryInterface $salesChannelPaymentMethodRepository */
        $salesChannelPaymentMethodRepository = $this->container->get('sales_channel_payment_method.repository');

        $salesChannelPaymentMethodRepository->upsert(
            [
                [
                    'salesChannelId' => $salesChannelEntity->getId(),
                    'paymentMethodId' => ActivationService::AMAZON_PAYMENT_METHOD_ID
                ]
            ]
            , $this->updateContext->getContext()
        );
    }

    private function resetPaymentMethodIsSetForAmazon(): void
    {
        /** @var EntityRepositoryInterface $swagMarketsConfigRepository */
        $swagMarketsConfigRepository = $this->container->get('bf_config.repository');

        $configService = new ConfigService($swagMarketsConfigRepository);
        $configService->singleStoreConfig(
            [
                'configurationKey' => 'swagMarkets_business_platform',
                'data' => [
                    'swagMarkets_systems' => [
                        'shops' => ['amazon' => ['payment_methods_is_set' => false]]
                    ]
                ]
            ]
        );
    }

    public function updatePaymentMethodName(): void
    {
        try {
            $paymentMethodRepository = $this->container->get('payment_method.repository');
            $paymentMethodRepository->upsert(
                [
                    [
                        'id' => ActivationService::AMAZON_PAYMENT_METHOD_ID,
                        'name' => 'Shopware Markets - Amazon',
                        'description' => 'Shopware Markets - Amazon',
                    ]
                ],
                $this->updateContext->getContext()
            );
        } catch (\Exception $e) {
            throw new UpdateFailedException($e->getMessage());
        }
    }
}
