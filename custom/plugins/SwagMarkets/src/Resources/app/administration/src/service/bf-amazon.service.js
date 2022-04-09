import BfApiService from "./bf-api.service";

const {Application} = Shopware;


class BfAmazonService extends BfApiService {
    /**
     * Store amazon shipping and methods matching data into erp systems
     * @param bfSalesChannelService
     * @param salesChannel
     * @param onSave
     * @returns {Promise<boolean|*>}
     */
    async storeErpSystemMatchingData(bfSalesChannelService, salesChannel, onSave = false) {
        let config = await bfSalesChannelService.getBfConfigSwagMarketsSystem(),
            salesChannelType = await bfSalesChannelService.getSalesChannelType(),
            shippingMethodId = 55,
            salesChannelShippingData = salesChannel.shippingMethods.get(salesChannel.shippingMethodId),
            salesChannelPaymentData = salesChannel.paymentMethods.get(salesChannel.paymentMethodId),
            shopId = await this.getShopId();

        if ((config.payment_methods_is_set === true && config.shipping_methods_is_set === true
            && onSave === false) || await bfSalesChannelService.getSalesChannelType() !== 'amazon' || shopId.length === 0) {
            return false;
        }

        await this.httpClient.put(
            this.apiUrl + 'erpSystems/store-matching',
            {
                shopId: shopId,
                erpSystemsMatchingShippingMethodsData: [{
                    "shippingMethodsId": shippingMethodId,
                    "erpShippingMethodsCode": salesChannelShippingData.name + " ##" + salesChannelShippingData.id + "##"
                }],
                erpSystemsMatchingPaymentMethodsData: [
                    {
                        paymentMethodsId: 6,
                        erpPaymentMethodsCode: salesChannelPaymentData.name + " ##" + salesChannelPaymentData.id + "##"
                    }
                ]
            },
            {headers: await this.getHeaders()}
        ).then(() => {
            bfSalesChannelService.updateBfConfigSwagMarketsSystem({
                shops: {[salesChannelType]: {payment_methods_is_set: true, shipping_methods_is_set: true}}
            });
        });
    }

    /**
     * @param bfSalesChannelService
     * @param salesChannelType
     * @param erpSystemsMatchingShippingMethods
     * @returns {Promise<void>}
     */
    async storeErpSystemsMatchingShippingMethods(bfSalesChannelService, salesChannelType, erpSystemsMatchingShippingMethods) {
        await this.httpClient.put(
            this.apiUrl + 'erpSystems/store-matching',
            {
                shopId: await this.getShopId(),
                erpSystemsMatchingShippingMethodsData: [
                    {shippingMethodsId: 56, erpShippingMethodsCode: erpSystemsMatchingShippingMethods.fba.code},
                    {shippingMethodsId: 57, erpShippingMethodsCode: erpSystemsMatchingShippingMethods.prime.code},
                    {
                        shippingMethodsId: 58,
                        erpShippingMethodsCode: erpSystemsMatchingShippingMethods.primeNextDay.code
                    },
                    {
                        shippingMethodsId: 59,
                        erpShippingMethodsCode: erpSystemsMatchingShippingMethods.primeSecondDay.code
                    },
                ],
            },
            {headers: await this.getHeaders()}
        ).then(async function() {
            await bfSalesChannelService.updateBfConfigSwagMarketsSystem({
                shops: {
                    [salesChannelType]:
                        {
                            amazonFbaPrimeShippingMethods: {
                                fba: {
                                    shippingMethodId: erpSystemsMatchingShippingMethods.fba.shippingMethodId,
                                    code: erpSystemsMatchingShippingMethods.fba.code
                                },
                                prime: {
                                    shippingMethodId: erpSystemsMatchingShippingMethods.prime.shippingMethodId,
                                    code: erpSystemsMatchingShippingMethods.prime.code
                                },
                                primeNextDay: {
                                    shippingMethodId: erpSystemsMatchingShippingMethods.primeNextDay.shippingMethodId,
                                    code: erpSystemsMatchingShippingMethods.primeNextDay.code
                                },
                                primeSecondDay: {
                                    shippingMethodId: erpSystemsMatchingShippingMethods.primeSecondDay.shippingMethodId,
                                    code: erpSystemsMatchingShippingMethods.primeSecondDay.code
                                },
                            }
                        }
                }
            });
        });
    }

    /**
     * @param bfSalesChannelService
     * @param salesChannel
     * @returns {Promise<*>}
     */
    async storeShopsConfigurationData(bfSalesChannelService, salesChannel) {
        let salesChannelType = await bfSalesChannelService.getSalesChannelType();

        this.httpClient.post(
            this.apiUrl + salesChannelType + '/brickfox/shops/configurations',
            {
                shopId: await this.getShopId(),
                shopsConfigurations: {
                    FBA_SHIPPING_METHODS_CODE: 'standard_amazon_fba',
                    FBA_PAYMENT_METHODS_CODE: 'amazon',
                    AMAZON_ARE_BATTERIES_REQUIRED: salesChannel.hasOwnProperty('needsBatteryItem') ? salesChannel.needsBatteryItem : '',
                    AMAZON_DANGEROUS_GOODS_DEFAULT: salesChannel.hasOwnProperty('dangerousGoodsItem') ? salesChannel.dangerousGoodsItem : '',
                    DEFAULT_DELIVERY_TIMES: salesChannel.processingTime,
                    MERCHANT_SHIPPING_GROUP_NAME: salesChannel.merchantShippingGroupName,
                    ENABLE_FBA: salesChannel.enableFba ? 1 : 0,
                    USE_AMAZON_TAX_CALCULATION_SERVICE: salesChannel.useAmazonTaxCalculationService ? 1 : 0,
                    AMAZON_FC_SHELF_LIFE: salesChannel.amazonFcShelfLifeAttribute,
                    productSegment: salesChannel.productSegment,
                    productType: salesChannel.productType
                }
            },
            {headers: await this.getHeaders()}
        );
        if (salesChannel.hasOwnProperty('amazonFbaPrimeShippingMethods')) {
            await this.storeErpSystemsMatchingShippingMethods(bfSalesChannelService, salesChannelType, salesChannel.amazonFbaPrimeShippingMethods);
        }
    }

    /**
     * @param name
     * @returns {Promise<*>}
     */
    async getAmazonSegmentByName(name) {
        return await this.httpClient.post(
            this.apiUrl + 'amazonSegments/search',
            {
                shopId: await this.getShopId(),
                filter: [
                    {
                        field: "name",
                        type: "=",
                        value: name
                    }
                ]
            },
            {headers: await this.getHeaders()}
        ).then((response) => {
            return response.data;
        }).catch((error) => {
            console.log(error);
        });
    }

    /**
     *
     * @param name
     * @param amazonSegmentId
     * @param segmentName
     * @returns {Promise<*>}
     */
    async getProductTypesIdByProductTypesName(name, amazonSegmentId, segmentName) {
        return await this.httpClient.post(
            this.apiUrl + 'productTypes/search',
            {
                shopId: await this.getShopId(),
                filter: [
                    {
                        field: "name",
                        type: "=",
                        value: (segmentName === "Clothing") ? segmentName : name
                    },
                    {
                        field: "amazon_segments_id",
                        type: "=",
                        value: amazonSegmentId
                    }
                ]
            },
            {headers: await this.getHeaders()}
        ).then((response) => {
            return response.data;
        }).catch((error) => {
            console.log(error);
        })
    }

    /**
     * @param productTypesId
     * @param limit
     * @param page
     * @returns {Promise<*>}
     */
    async getProductTypesAttributesByProductType(productTypesId, limit, page, searchString) {
        return await this.httpClient.post(
            this.apiUrl + 'productTypesAttributes/search',
            {
                shopId: await this.getShopId(),
                filter: [
                    {
                        field: "amazon_product_types_id",
                        type: "=",
                        value: productTypesId
                    },
                    {
                        field: "name",
                        type : "like",
                        value: searchString + '%'
                    }
                ],
                order: {
                    field: "name",
                    direction: "asc"
                },
                limit: limit,
                page: page
            },
            {headers: await this.getHeaders()}
        ).then((response) => {
            return response.data;
        }).catch((error) => {
            console.log(error);
        })
    }

    /**
     * @param bfSalesChannelService
     * @param salesChannel
     * @returns {Promise<void>}
     */
    async activateDeactivateFbaOrdersCron(bfSalesChannelService, salesChannel) {
        this.httpClient.post(
            this.apiUrl + 'system/single-cron',
            {
                shopId: await this.getShopId(),
                channelType: await bfSalesChannelService.getSalesChannelType(),
                action: 'importfba',
                active: salesChannel.enableFba && salesChannel.active
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     *
     * @param item {object}
     * @returns {Promise<void>}
     */
    async saveAmazonAsin (item) {
        return await this.httpClient.post(
            this.apiUrl + 'amazon/shops-products-variations-offers/save',
            {
                shopId: await this.getShopId(),
                shopsProductsVariationsData: item
            },
            {
                headers: await this.getHeaders()
            }
        ).then((response) => {
            return response.data.data;
        });
    }
}

Application.addServiceProvider('BfAmazonService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfAmazonService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
