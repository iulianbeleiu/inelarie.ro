<?php declare(strict_types=1);
/*
 * (c) shopware AG <info@shopware.com>
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Swag\PayPal\Util\Lifecycle\Method;

use Shopware\Core\Framework\Context;
use Swag\PayPal\Checkout\Payment\Method\ACDCHandler;
use Swag\PayPal\RestApi\V1\Api\MerchantIntegrations;
use Swag\PayPal\RestApi\V1\Api\MerchantIntegrations\Capability;
use Swag\PayPal\Storefront\Data\CheckoutDataMethodInterface;
use Swag\PayPal\Storefront\Data\Service\AbstractCheckoutDataService;
use Swag\PayPal\Storefront\Data\Service\ACDCCheckoutDataService;

class ACDCMethodData extends AbstractMethodData implements CheckoutDataMethodInterface
{
    public const PAYPAL_ACDC_FIELD_DATA_EXTENSION_ID = 'payPalACDCFieldData';

    public function getTranslations(): array
    {
        return [
            'de-DE' => [
                'description' => '',
                'name' => 'Kredit- oder Debitkarte',
            ],
            'en-GB' => [
                'description' => '',
                'name' => 'Credit or debit card',
            ],
        ];
    }

    public function getPosition(): int
    {
        return -98;
    }

    public function getHandler(): string
    {
        return ACDCHandler::class;
    }

    public function getRuleData(Context $context): ?array
    {
        return null;
    }

    public function getInitialState(): bool
    {
        return false;
    }

    public function getMediaFileName(): ?string
    {
        return 'card';
    }

    public function validateCapability(MerchantIntegrations $merchantIntegrations): string
    {
        $capability = $merchantIntegrations->getSpecificCapability('CUSTOM_CARD_PROCESSING');
        if ($capability !== null && $capability->getStatus() === Capability::STATUS_ACTIVE) {
            return self::CAPABILITY_ACTIVE;
        }

        $capability = $merchantIntegrations->getSpecificCapability('STANDARD_CARD_PROCESSING');
        if ($capability !== null && $capability->getStatus() === Capability::STATUS_ACTIVE) {
            return self::CAPABILITY_LIMITED;
        }

        return self::CAPABILITY_INACTIVE;
    }

    public function getCheckoutDataService(): AbstractCheckoutDataService
    {
        return $this->container->get(ACDCCheckoutDataService::class);
    }

    public function getCheckoutTemplateExtensionId(): string
    {
        return self::PAYPAL_ACDC_FIELD_DATA_EXTENSION_ID;
    }
}
