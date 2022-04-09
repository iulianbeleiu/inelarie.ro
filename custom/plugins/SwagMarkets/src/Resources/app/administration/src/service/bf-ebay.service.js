import BfApiService from "./bf-api.service";

const {Application, Mixin, Component} = Shopware;

class BfEbayService extends BfApiService {
    /**
     * Store ebay shipping and methods matching data into erp systems
     * @param bfSalesChannelService
     * @param salesChannel
     * @param onSave
     * @returns {Promise<boolean|*>}
     */
    async storeErpSystemMatchingData(bfSalesChannelService, salesChannel, onSave = false) {
        let config = await bfSalesChannelService.getBfConfigSwagMarketsSystem(),
            salesChannelType = await bfSalesChannelService.getSalesChannelType(),
            shippingMethodId = 44,
            salesChannelShippingData = salesChannel.shippingMethods.get(salesChannel.shippingMethodId),
            shopId = await this.getShopId();

        if ((config.payment_methods_is_set === true && config.shipping_methods_is_set === true
            && onSave === false) || salesChannelType !== 'ebay' || shopId.length === 0) {
            return false;
        }

        return this.httpClient.put(
            this.apiUrl + 'erpSystems/store-matching',
            {
                shopId: shopId,
                erpSystemsMatchingShippingMethodsData: [{
                    "shippingMethodsId": shippingMethodId,
                    "erpShippingMethodsCode": salesChannelShippingData.name + " ##" + salesChannelShippingData.id + "##"
                }],
                erpSystemsMatchingPaymentMethodsData: salesChannel.ebayPaymentMethods
            }, {headers: await this.getHeaders()}
        ).then(() => {
            bfSalesChannelService.updateBfConfigSwagMarketsSystem({
                shops: {[salesChannelType]: {payment_methods_is_set: true, shipping_methods_is_set: true, payment_methods_matching: salesChannel.ebayPaymentMethods}}
            });
        });
    }

    /**
     * @param bfSalesChannelService
     * @param shippingPolicy
     * @param paymentPolicy
     * @param returnPolicy
     */
    storeEbayPolicies(bfSalesChannelService, shippingPolicy = {}, paymentPolicy = {}, returnPolicy = {}) {
        if (shippingPolicy.isDirty === true || paymentPolicy.isDirty === true || returnPolicy.isDirty === true) {
            bfSalesChannelService.storeShopsConfigurations({
                SHIPPING_POLICY: shippingPolicy.profileId,
                PAYMENT_POLICY: paymentPolicy.profileId,
                RETURN_POLICY: returnPolicy.profileId
            });
        }
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
                shopsConfigurations: await this.prepareShopsConfigurationData(salesChannel)
            },
            {headers: await this.getHeaders()}
        );

        return {
            mailIsValid: this.validateEmailAddress(salesChannel.payPalEmail),
            logoUrlIsValid: this.validateLogoUrl(salesChannel.ebayLogo),
        };
    }

    /**
     *
     * @param salesChannel
     * @returns {Promise<{EBAY_BEST_OFFER_ACTIVE: (boolean|*), EBAY_BEST_OFFER_ABSOLUTE_AUTO_ACCEPT: (number|*), EBAY_BEST_OFFER_RELATIVE: (number|*), EBAY_BEST_OFFER_AUTO_ACCEPT: (boolean|*), EBAY_BEST_OFFER_ABSOLUTE: (number|*), EBAY_PLUS_SELLER: (boolean|*), EBAY_BEST_OFFER_RELATIVE_AUTO_ACCEPT: (number|*), EBAY_FIX_BEST_OFFER: *, EBAY_LOGO: (null|*), sellerZip: *, sellerCity: *, FEEDBACK_COMMENT: (null|*)}>}
     */
    async prepareShopsConfigurationData(salesChannel) {
        let shopsConfigurations = {
            EBAY_BEST_OFFER_ABSOLUTE: salesChannel.ebayBestOfferAbsolute,
            EBAY_BEST_OFFER_ABSOLUTE_AUTO_ACCEPT: salesChannel.ebayBestOfferAbsoluteAutoAccept,
            EBAY_BEST_OFFER_ACTIVE: salesChannel.ebayBestOfferActive,
            EBAY_BEST_OFFER_AUTO_ACCEPT: salesChannel.ebayBestOfferAutoAccept,
            EBAY_BEST_OFFER_RELATIVE: salesChannel.ebayBestOfferRelative,
            EBAY_BEST_OFFER_RELATIVE_AUTO_ACCEPT: salesChannel.ebayBestOfferRelativeAutoAccept,
            EBAY_FIX_BEST_OFFER: salesChannel.ebayBestOfferFix,
            EBAY_PLUS_SELLER: salesChannel.ebayPlus,
            EBAY_EXPORT_BRANDS_AS_MANUFACTURER: salesChannel.useBrandAsManufacturer,
            sellerZip: salesChannel.sellerZip,
            sellerCity: salesChannel.sellerCity,
            FEEDBACK_COMMENT: salesChannel.feedbackComment
        };

        if (this.validateEmailAddress(salesChannel.payPalEmail)) {
            shopsConfigurations.PAYPAL_EMAIL = salesChannel.payPalEmail;
        }

        if (this.validateLogoUrl(salesChannel.ebayLogo)) {
            shopsConfigurations.EBAY_LOGO = salesChannel.ebayLogo;
        }

        return shopsConfigurations;
    }

    /**
     * @param mailAddress {string}
     * @returns {boolean}
     */
    validateEmailAddress(mailAddress = '') {
        const mailValidationRegEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-]+){1,}$/;

        if (mailAddress.match(mailValidationRegEx)) {
            return true;
        }

        return false;
    }

    /**
     * @param url {string}
     * @returns {boolean}
     */
    validateLogoUrl(url = '') {
        return url.indexOf("https://") === 0;
    }
}

Application.addServiceProvider('BfEbayService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfEbayService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
