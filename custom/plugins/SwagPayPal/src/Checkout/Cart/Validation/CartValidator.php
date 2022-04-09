<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Checkout\Cart\Validation;

use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\CartValidatorInterface;
use Shopware\Core\Checkout\Cart\Error\ErrorCollection;
use Shopware\Core\Checkout\Payment\Cart\Error\PaymentMethodBlockedError;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Swag\PayPal\Checkout\Cart\Service\CartPriceService;
use Swag\PayPal\Setting\Exception\PayPalSettingsInvalidException;
use Swag\PayPal\Setting\Service\SettingsValidationServiceInterface;
use Swag\PayPal\Util\Lifecycle\Method\PaymentMethodDataRegistry;

class CartValidator implements CartValidatorInterface
{
    private CartPriceService $cartPriceService;

    private PaymentMethodDataRegistry $methodDataRegistry;

    private SettingsValidationServiceInterface $settingsValidationService;

    public function __construct(
        CartPriceService $cartPriceService,
        PaymentMethodDataRegistry $methodDataRegistry,
        SettingsValidationServiceInterface $settingsValidationService
    ) {
        $this->cartPriceService = $cartPriceService;
        $this->methodDataRegistry = $methodDataRegistry;
        $this->settingsValidationService = $settingsValidationService;
    }

    public function validate(Cart $cart, ErrorCollection $errors, SalesChannelContext $context): void
    {
        if (!$this->methodDataRegistry->isPayPalPaymentMethod($context->getPaymentMethod())) {
            return;
        }

        try {
            $this->settingsValidationService->validate($context->getSalesChannelId());
        } catch (PayPalSettingsInvalidException $e) {
            $errors->add(new PaymentMethodBlockedError((string) $context->getPaymentMethod()->getTranslation('name')));

            return;
        }

        if ($this->cartPriceService->isZeroValueCart($cart)) {
            $errors->add(new PaymentMethodBlockedError((string) $context->getPaymentMethod()->getTranslation('name')));
        }
    }
}
