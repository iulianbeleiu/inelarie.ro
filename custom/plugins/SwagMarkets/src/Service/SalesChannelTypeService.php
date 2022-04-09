<?php

declare(strict_types=1);

namespace Swag\Markets\Service;

use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;

class SalesChannelTypeService
{
    const AMAZON_SALES_CHANNEL_TYPE_ID = '26a9ece25bd14b288b30c3d71e667d2c';
    const EBAY_SALES_CHANNEL_TYPE_ID = '7ff39608fed04e4bbcc62710b7223966';

    /**
     * @var string
     */
    private $manufacturer = 'shopware AG';

    /**
     * @var EntityRepositoryInterface
     */
    private $salesChannelTypeRepository;

    /**
     * @param  EntityRepositoryInterface  $salesChannelTypeRepository
     */
    public function __construct(EntityRepositoryInterface $salesChannelTypeRepository)
    {
        $this->salesChannelTypeRepository = $salesChannelTypeRepository;
    }

    public function createEbaySalesChannelType()
    {
        $this->salesChannelTypeRepository->upsert(
            [
                [
                    'id' => self::EBAY_SALES_CHANNEL_TYPE_ID,
                        'iconName' => 'default-building-shop',
                'translations' => [
                    'de-DE' => [
                        'name' => 'eBay',
                        'description' => 'Verkaufe deine Produkte bei eBay',
                        'manufacturer' => $this->manufacturer
                    ],
                    'en-GB' => [
                        'name' => 'eBay',
                        'description' => 'Sell products on the eBay Marketplace',
                        'manufacturer' => $this->manufacturer
                    ],
                    Defaults::LANGUAGE_SYSTEM => [
                        'name' => 'eBay',
                        'description' => 'Sell products on the eBay Marketplace',
                        'manufacturer' => $this->manufacturer
                    ]
                ]
            ]
            ],
            Context::createDefaultContext()
        );
    }

    public function createAmazonSalesChannelType()
    {
        $this->salesChannelTypeRepository->upsert(
            [
                [
                    'id' => self::AMAZON_SALES_CHANNEL_TYPE_ID,
                    'iconName' => 'default-building-shop',
                    'translations' => [
                        'de-DE' => [
                            'name' => 'Amazon',
                            'description' => 'Verkaufe deine Produkte bei Amazon',
                            'manufacturer' => $this->manufacturer
                        ],
                        'en-GB' => [
                            'name' => 'Amazon',
                            'description' => 'Sell products on the Amazon Marketplace',
                            'manufacturer' => $this->manufacturer
                        ],
                        Defaults::LANGUAGE_SYSTEM => [
                            'name' => 'Amazon',
                            'description' => 'Sell products on the Amazon Marketplace',
                            'manufacturer' => $this->manufacturer
                        ]
                    ]
                ]
            ],
            Context::createDefaultContext()
        );
    }
}
