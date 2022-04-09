import BfApiService from "./bf-api.service";

const {Application} = Shopware;
const {ApiService} = Shopware.Classes;

class BfSalesChannelService extends BfApiService {

    /**
     * @param currencyId
     * @returns {Promise<null>}
     */
    async getSelectedCurrencyEntity(currencyId) {
        let httpClient = Application.getContainer('init').httpClient,
            currencyEntity = null;
        await httpClient.get(
            '/currency/' + currencyId,
            {
                headers: this.getBasicHeaders()
            }
        ).then((response) => {
            if (response.status === 200) {
                currencyEntity = response.data.data.attributes;
                currencyEntity.id = response.data.data.id;
            }
        }).catch(() => {
            currencyEntity = 'ERROR-FETCH-CURRENCY';
        });
        return currencyEntity;
    }

    /**
     * @param languageId
     * @returns {Promise<null>}
     */
    async getSelectedLanguagesEntity(languageId) {
        let httpClient = Application.getContainer('init').httpClient,
            languageEntity = null;
        await httpClient.get(
            '/language/' + languageId,
            {
                headers: this.getBasicHeaders()
            }
        ).then((response) => {
            if (response.status === 200) {
                languageEntity = response.data.data.attributes;
                languageEntity.id = response.data.data.id
            }
        }).catch(() => {
            languageEntity = 'ERROR-FETCH-LANGUAGE';
        });

        return languageEntity;
    }

    /**
     * @param localeId
     * @returns {Promise<null>}
     */
    async getLocaleEntity(localeId) {
        let httpClient = Application.getContainer('init').httpClient,
            localeEntity = null;
        await httpClient.get(
            '/locale/' + localeId,
            {
                headers: this.getBasicHeaders()
            }
        ).then((response) => {
            localeEntity = response.data.data.attributes;
        }).catch(() => {
            localeEntity = 'ERROR-FETCH-LOCALE'
        });

        return localeEntity;
    }

    /**
     * @param paymentMethodId
     * @returns {Promise<null>}
     */
    async getSelectedPaymentMethodEntity(paymentMethodId) {
        let httpClient = Application.getContainer('init').httpClient,
            paymentMethodEntity = null;
        await httpClient.get(
            '/payment-method/' + paymentMethodId,
            {
                headers: this.getBasicHeaders()
            }
        ).then((response) => {
            if (response.status === 200) {
                paymentMethodEntity = response.data.data.attributes;
                paymentMethodEntity.id = response.data.data.id
            }
        }).catch(() => {
            paymentMethodEntity = 'ERROR-FETCH-PAYMENT-METHOD';
        });

        return paymentMethodEntity;
    }

    /**
     * @param marketplace
     * @returns {Promise<*>}
     */
    getMarketplaces(marketplace) {
        return this.post(
            'channels/search',
            {
                filter: [
                    {
                        field: "type",
                        type: "=",
                        value: marketplace
                    }
                ]
            }
        )
            .then((response) => {
                return ApiService.handleResponse(response);
            })
    }

    /**
     * @param active
     * @returns {Promise<void>}
     */
    async activateDeactivateSalesChannelCronJobs(active) {
        await this.httpClient.post(
            this.apiUrl + 'system/crons',
            {
                shopId: await this.getShopId(),
                channelType: await this.getSalesChannelType(),
                active: active
            },
            {
                headers: await this.getHeaders()
            }
        )
    }

    /**
     * @returns {Promise<{clientExists: boolean, clientInProgress: boolean}>}
     */
    async checkClientState() {
        let clientState = {clientExists: false, clientInProgress: false},
            shopId = await this.getShopId();
        if (shopId.length > 0) {
            await this.httpClient.get(
                this.apiUrl + 'system/client/' + shopId,
                {
                    headers: await this.getHeaders()
                }
            ).then((response) => {
                if (response.status === 200 && response.data.data.id > 0) {
                    clientState.clientExists = true;

                    if (response.data.data.data.active === false) {
                        clientState.clientInProgress = true;
                    }
                }
            });
        }
        return clientState;
    }

    /**
     * @returns {Promise<*>}
     */
    async getShopsConfigurations() {
        let shopId = await this.getShopId();
        if (shopId.length > 0) {
            return this.httpClient.get(
                this.apiUrl + await this.getSalesChannelType() + '/brickfox/shops/configurations/' + shopId,
                {
                    headers: await this.getHeaders()
                }
            );
        }

        return {status: 500, data: {success: false}};
    }

    async getErpSystemsConfiguration() {
        let shopId = await this.getShopId();
        if (shopId.length > 0) {
            return this.httpClient.get(
                this.apiUrl + 'erpSystems/configurations/' + shopId,
                {
                    headers: await this.getHeaders()
                }
            );
        }
    }

    /**
     * @returns {Promise<*>}
     */
    async storeIntegrationUserCredentialsToBf() {
        let config = await this.getConfig(),
            integrationUserCredentials = config.integration_user,
            shopId = await this.getShopId();

        if (shopId.length === 0){
            return;
        }

        if (config.swagMarkets_business_platform.swagMarkets_systems.erp_systems.base_configuration_is_set === true) {
            return false;
        }

        return this.httpClient.post(
            this.apiUrl + 'erpSystems/configurations',
            {
                shopId: shopId,
                erpSystemsConfigurations: {
                    API_URL: window.location.origin + '/api/',
                    API_VERSION: 'v1',
                    ACCESS_KEY: 'sw-access-key',
                    API_KEY: integrationUserCredentials.access_key,
                    API_SECRET_KEY: integrationUserCredentials.secret_access_key
                }
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @param salesChannelType
     * @returns {Promise<null>}
     */
    async getMarketplaceId(salesChannelType) {
        let config = await this.getConfig(),
            marketplaceId = null;

        if (config.hasOwnProperty(salesChannelType + '_configuration')) {
            if (config[salesChannelType + '_configuration'].hasOwnProperty('marketplace_id')) {
                marketplaceId = config[salesChannelType + '_configuration'].marketplace_id;
            }
        }

        return marketplaceId;
    }

    /**
     * @param currencyEntity
     * @param onSave
     * @returns {Promise<void>}
     */
    async storeErpSystemsConfigurationCurrenciesMatching(currencyEntity, onSave = false) {
        let config = await this.getBfConfigSwagMarketsSystem(),
            shopId = await this.getShopId();
        if(shopId.length === 0) {
            return;
        }

        if ((config.shops_currencies_is_set === true && onSave === false) || currencyEntity === 'ERROR-FETCH-CURRENCY') {
            return;
        }

        await this.httpClient.put(
            this.apiUrl + 'erpSystems/store-matching-currencies',
            {
                shopId: await this.getShopId(),
                currenciesData: {
                    isoCode: currencyEntity.isoCode,
                    externalId: currencyEntity.id,
                    externalValue: currencyEntity.isoCode,
                    exchangeRate: currencyEntity.factor,
                    currenciesName: currencyEntity.name,
                    currenciesCode: currencyEntity.isoCode,
                    currenciesSymbol: currencyEntity.symbol,
                    decimalPlaces: currencyEntity.decimalPrecision
                }
            },
            {
                headers: await this.getHeaders()
            }
        )

        await this.storeShopsCurrencies(currencyEntity.isoCode);
    }

    /**
     *
     * @param languageEntity {entity}
     * @param onSave {boolean}
     * @returns {Promise<void>}
     */
    async storeErpSystemsConfigurationLanguagesMatching(languageEntity, onSave = false) {
        let config = await this.getBfConfigSwagMarketsSystem(),
            localeEntity = await this.getLocaleEntity(languageEntity.localeId),
            shopId = await this.getShopId();
        if ((config.shops_languages_is_set === true && onSave === false) || languageEntity === 'ERROR-FETCH-LANGUAGE' || localeEntity === 'ERROR-FETCH-LOCALE' || shopId.length === 0) {
            return;
        }

        await this.httpClient.put(
            this.apiUrl + 'erpSystems/store-matching-languages',
            {
                shopId: shopId,
                languagesData: {
                    isoCode: localeEntity.code,
                    name: languageEntity.name,
                    externalId: languageEntity.localeId,
                    externalValue: localeEntity.code
                }
            },
            {
                headers: await this.getHeaders()
            }
        );

        await this.storeShopsLanguages(localeEntity.code);
    }

    /**
     * @param isoCode
     * @returns {Promise<void>}
     */
    async storeShopsLanguages(isoCode) {
        let salesChannelType = await this.getSalesChannelType();
        await this.httpClient.put(
            this.apiUrl + salesChannelType + '/shops/store',
            {
                shopId: await this.getShopId(),
                shopsLanguages: [{
                    isoCode: isoCode,
                    mainLanguage: 1,
                    sortOrder: 1
                }]
            },
            {
                headers: await this.getHeaders()
            }
        ).then(() => {
            this.updateBfConfigSwagMarketsSystem({
                shops: {[salesChannelType]: {shops_languages_is_set: true}}
            })
        });
    }

    /**
     * @param isoCode
     * @returns {Promise<void>}
     */
    async storeShopsCurrencies(isoCode) {
        let salesChannelType = await this.getSalesChannelType();
        await this.httpClient.put(
            this.apiUrl + salesChannelType + '/shops/store',
            {
                shopId: await this.getShopId(),
                shopsCurrencies: [{
                    currencyCode: isoCode,
                    mainCurrency: 1
                }]
            },
            {
                headers: await this.getHeaders()
            }
        ).then(() => {
            this.updateBfConfigSwagMarketsSystem({
                shops: {[salesChannelType]: {shops_currencies_is_set: true}}
            })
        });
    }

    /**
     * @param salesChannel
     * @param paymentMethodMatchingData
     * @param onSave
     * @returns {Promise<boolean|*>}
     */
    async storeErpSystemMatchingData( salesChannel, paymentMethodMatchingData = [], onSave = false) {
        let config = await this.getBfConfigSwagMarketsSystem(),
            shippingMethodId = null,
            salesChannelShippingData = salesChannel.shippingMethods.get(salesChannel.shippingMethodId),
            salesChannelPaymentData = salesChannel.paymentMethods.get(salesChannel.paymentMethodId),
            shopId = await this.getShopId();

        if (shopId.length === 0 || (config.payment_methods_is_set === true && config.shipping_methods_is_set === true && onSave === false)) {
            return false;
        }

        if (await this.getSalesChannelType() === 'amazon') {
            shippingMethodId = 55;
            paymentMethodMatchingData.push({
                paymentMethodsId: 6,
                erpPaymentMethodsCode: salesChannelPaymentData.name + " ##" + salesChannelPaymentData.id + "##"
            });
        } else if (await this.getSalesChannelType() === 'ebay') {
            shippingMethodId = 44;
        }

        if (shippingMethodId !== null && paymentMethodMatchingData.length > 0) {
            return this.httpClient.put(
                this.apiUrl + 'erpSystems/store-matching',
                {
                    shopId: shopId,
                    erpSystemsMatchingShippingMethodsData: [{
                        "shippingMethodsId": shippingMethodId,
                        "erpShippingMethodsCode": salesChannelShippingData.name + " ##" + salesChannelShippingData.id + "##"
                    }],
                    erpSystemsMatchingPaymentMethodsData: paymentMethodMatchingData
                },
                {
                    headers: await this.getHeaders()
                }
            );
        }
    }

    /**
     *
     * @returns {Promise<*>}
     * @param salesChannelConfig
     */
    async storeSalesChannelDataToBf(salesChannelConfig) {
        let config = await this.getConfig(),
            shopId = await this.getShopId();

        if (shopId.length === 0) {
            return false;
        }

        return this.httpClient.post(
            this.apiUrl + await this.getSalesChannelType() + '/brickfox/shops/configurations',
            {
                shopId: shopId,
                shopsConfigurations: salesChannelConfig
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * Store the correct api version into the third party system
     * @returns {Promise<void>}
     */
    async storeApiVersion(){
        let shopId = await this.getShopId(),
            apiVersion = 'v1';

        if (shopId.length === 0) {return;}

        await this.httpClient.get(
            'swagMarkets/config/api-version',
            {headers: this.getBasicHeaders()}
        ).then((response) => {
            if (response.status === 200) {
                if (response.data.data.apiVersion.length === 0) {
                    apiVersion = '';
                } else {
                    apiVersion = 'v' + response.data.data.apiVersion;
                }
            }
        })

        this.httpClient.post(
            this.apiUrl + 'erpSystems/configurations',
            {
                shopId: shopId,
                erpSystemsConfigurations: {
                    API_VERSION: apiVersion,
                }
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * Every customer has to use the admin api to transfer order from the marketplaces to shopware
     * @returns {Promise<void>}
     */
    async storeUseAdminApi() {
        let shopId = await this.getShopId();

        this.httpClient.post(
            this.apiUrl + 'erpSystems/configurations',
            {
                shopId: shopId,
                erpSystemsConfigurations: {
                    IS_SHOPWARE6_ADMIN_API: '1'
                }
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @param data {object}
     * @returns {Promise<void>}
     */
    async storeErpSystemsConfiguration(data){
        let shopId = await this.getShopId();
        if (shopId.length === 0) {return;}

        this.httpClient.post(
            this.apiUrl + 'erpSystems/configurations',
            {
                shopId: shopId,
                erpSystemsConfigurations: data
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @param shopsConfigurations
     * @returns {Promise<*>}
     */
    async storeShopsConfigurations(shopsConfigurations) {
        return this.httpClient.post(
            this.apiUrl + await this.getSalesChannelType() + '/brickfox/shops/configurations',
            {
                shopId: await this.getShopId(),
                shopsConfigurations: shopsConfigurations
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @param salesChannel
     * @returns {Promise<void>}
     */
    async storeSalesChannelLanguage(salesChannel) {
        this.httpClient.post(
           'swagMarkets/sales-channel-language/save',
            {
                salesChannelId: salesChannel.id,
                languageId: salesChannel.languageId
            },
            {
                headers: this.getBasicHeaders()
            }
        );
    }

    /**
     * @param salesChannel
     * @returns {Promise<void>}
     */
    async storeSalesChannelCountry(salesChannel) {
        this.httpClient.post(
            'swagMarkets/sales-channel-country/save',
            {
                salesChannelId: salesChannel.id,
                countryId: salesChannel.countryId
            },
            {
                headers: this.getBasicHeaders()
            }
        );
    }

    /**
     * @param salesChannel
     * @returns {Promise<void>}
     */
    async storeSalesChannelCurrency(salesChannel) {
        this.httpClient.post(
            'swagMarkets/sales-channel-currency/save',
            {
                salesChannelId: salesChannel.id,
                currencyId: salesChannel.currencyId
            },
            {
                headers: this.getBasicHeaders()
            }
        );
    }

    /**
     * @param data
     * @returns {Promise<void>}
     */
    async updateBfConfigSwagMarketsSystem(data) {
        this.httpClient.post(
            'swagMarkets/config/store/erpSystemConfig',
            {
                swagMarkets_systems: data
            },
            {
                headers: this.getBasicHeaders()
            }
        )
    }

    async updateMarketplaceConfiguration(data) {
        const salesChannelType = await this.getSalesChannelType();

        data.marketplace = salesChannelType + '_configuration';

        return this.httpClient.post(
            'swagMarkets/config/marketplace/set-id',
            {
                data
            },
            {
                headers: this.getBasicHeaders()
            }
        )
            .then((response) => {
                return ApiService.handleResponse(response);
            })
    }

    /**
     * @returns {Promise<*>}
     */
    async getBfConfigSwagMarketsSystem(forceReload = false) {
        const config = await this.getConfig(forceReload);

        return config.swagMarkets_business_platform.swagMarkets_systems.shops[await this.getSalesChannelType()];
    }

    /**
     * @returns {Promise<boolean>}
     */
    async getIsMarketplaceConnected() {
        let isConnected = false,
            configurationKey = await this.getSalesChannelType() + '_configuration';

        await this.getConfig().then((config) => {
            if (config.hasOwnProperty(configurationKey) && config[configurationKey].hasOwnProperty('is_connected') && config[configurationKey].is_connected !== undefined) {
                isConnected = config[configurationKey].is_connected;
            }
        });

        return isConnected;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async getSalesChannelConfiguration() {
        let configurationKey = await this.getSalesChannelType() + '_configuration',
            salesChannelConfiguration = {};

        await this.getConfig().then((config) => {
            salesChannelConfiguration = config[configurationKey];
        });

        return salesChannelConfiguration;
    }

    /**
     * @param type
     * @returns {Promise<*>}
     */
    async getEbayPolicy(type) {
        return await this.httpClient.get(
            this.apiUrl + 'ebay/' + type + '/policy/' + await this.getShopId(),
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @returns {Promise<*>}
     */
    async getEbayTokenExpires() {
        return await this.httpClient.get(
            this.apiUrl + 'ebay/token/expires/' + await this.getShopId(),
            {
                headers: await this.getHeaders()
            }
        );
    }

    async getMarketplace() {
        return await this.httpClient.get(
            this.apiUrl + 'channels/' + await this.getChannelId(),
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @param salesChannel
     * @param shopsConfigurations
     * @returns {*}
     */
    buildShopsConfigurations(salesChannel, shopsConfigurations) {
        salesChannel.processingTime = shopsConfigurations.hasOwnProperty('DEFAULT_DELIVERY_TIMES') ? parseInt(shopsConfigurations.DEFAULT_DELIVERY_TIMES) : null;
        salesChannel.merchantShippingGroupName = shopsConfigurations.hasOwnProperty('MERCHANT_SHIPPING_GROUP_NAME') ? shopsConfigurations.MERCHANT_SHIPPING_GROUP_NAME : null;
        salesChannel.enableFba = shopsConfigurations.hasOwnProperty('ENABLE_FBA') ? shopsConfigurations.ENABLE_FBA === '1' : false;
        salesChannel.useAmazonTaxCalculationService = shopsConfigurations.hasOwnProperty('USE_AMAZON_TAX_CALCULATION_SERVICE') ? shopsConfigurations.USE_AMAZON_TAX_CALCULATION_SERVICE === '1' : false;
        salesChannel.amazonFcShelfLifeAttribute = shopsConfigurations.hasOwnProperty('AMAZON_FC_SHELF_LIFE') ? shopsConfigurations.AMAZON_FC_SHELF_LIFE : null;
        salesChannel.payPalEmail = shopsConfigurations.hasOwnProperty('PAYPAL_EMAIL') ? shopsConfigurations.PAYPAL_EMAIL : null;
        salesChannel.ebayBestOfferAbsolute = shopsConfigurations.hasOwnProperty('EBAY_BEST_OFFER_ABSOLUTE') ? parseInt(shopsConfigurations.EBAY_BEST_OFFER_ABSOLUTE) : 0;
        salesChannel.ebayBestOfferAbsoluteAutoAccept = shopsConfigurations.hasOwnProperty('EBAY_BEST_OFFER_ABSOLUTE_AUTO_ACCEPT') ? parseInt(shopsConfigurations.EBAY_BEST_OFFER_ABSOLUTE_AUTO_ACCEPT) : 0;
        salesChannel.ebayBestOfferActive = shopsConfigurations.hasOwnProperty('EBAY_BEST_OFFER_ACTIVE') ? shopsConfigurations.EBAY_BEST_OFFER_ACTIVE === '1' : false;
        salesChannel.ebayBestOfferAutoAccept = shopsConfigurations.hasOwnProperty('EBAY_BEST_OFFER_AUTO_ACCEPT') ? shopsConfigurations.EBAY_BEST_OFFER_AUTO_ACCEPT === '1' : false;
        salesChannel.ebayBestOfferRelative = shopsConfigurations.hasOwnProperty('EBAY_BEST_OFFER_RELATIVE') ? parseInt(shopsConfigurations.EBAY_BEST_OFFER_RELATIVE) : 0;
        salesChannel.ebayBestOfferRelativeAutoAccept = shopsConfigurations.hasOwnProperty('EBAY_BEST_OFFER_RELATIVE_AUTO_ACCEPT') ? parseInt(shopsConfigurations.EBAY_BEST_OFFER_RELATIVE_AUTO_ACCEPT) : 0;
        salesChannel.useBrandAsManufacturer = shopsConfigurations.hasOwnProperty('EBAY_EXPORT_BRANDS_AS_MANUFACTURER') ? shopsConfigurations.EBAY_EXPORT_BRANDS_AS_MANUFACTURER === '1' : false;
        salesChannel.ebayBestOfferFix = shopsConfigurations.hasOwnProperty('EBAY_FIX_BEST_OFFER') ? shopsConfigurations.EBAY_FIX_BEST_OFFER === '1' : false;
        salesChannel.ebayLogo = shopsConfigurations.hasOwnProperty('EBAY_LOGO') ? shopsConfigurations.EBAY_LOGO : null;
        salesChannel.ebayPlus = shopsConfigurations.hasOwnProperty('EBAY_PLUS_SELLER') ? shopsConfigurations.EBAY_PLUS_SELLER === '1' : false;
        salesChannel.sellerZip = shopsConfigurations.hasOwnProperty('sellerZip') ? shopsConfigurations.sellerZip : null;
        salesChannel.sellerCity = shopsConfigurations.hasOwnProperty('sellerCity') ? shopsConfigurations.sellerCity : null;
        salesChannel.feedbackComment = shopsConfigurations.hasOwnProperty('FEEDBACK_COMMENT') ? shopsConfigurations.FEEDBACK_COMMENT : null;
        salesChannel.productSegment = shopsConfigurations.hasOwnProperty('productSegment') ? shopsConfigurations.productSegment : '-';
        salesChannel.productType = shopsConfigurations.hasOwnProperty('productType') ? shopsConfigurations.productType : '-';
        salesChannel.shippingPolicy = false;
        salesChannel.paymentPolicy = false;
        salesChannel.returnPolicy = false;

        return salesChannel;
    }


}

export default BfSalesChannelService;

Application.addServiceProvider('BfSalesChannelService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfSalesChannelService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
