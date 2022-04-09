<?php declare(strict_types=1);


namespace Swag\Markets\Setup\Update;


use Shopware\Core\Checkout\Payment\Cart\PaymentHandler\DefaultPayment;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;
use Shopware\Core\Framework\Update\Exception\UpdateFailedException;
use Swag\Markets\Service\ActivationService;
use Symfony\Component\DependencyInjection\ContainerInterface;

class EbayPaymentMethod
{
    private ContainerInterface $container;

    private UpdateContext $updateContext;

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
                        'id' => ActivationService::EBAY_PAYMENT_METHOD_ID,
                        'handlerIdentifier' => DefaultPayment::class,
                        'name' => 'Shopware Markets - Ebay',
                        'description' => 'Shopware Markets - Ebay',
                        'active' => true,
                        'afterOrderEnabled' => false
                    ]
                ],
                $this->updateContext->getContext()
            );
        } catch (\Exception $e) {
            throw new UpdateFailedException($e->getMessage());
        }
    }
}
