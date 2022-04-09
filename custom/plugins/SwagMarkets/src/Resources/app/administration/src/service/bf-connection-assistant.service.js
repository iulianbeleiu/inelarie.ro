import BfApiService from "./bf-api.service";

const {Application} = Shopware;

const ApiService = Shopware.Classes.ApiService;

class BfConnectionAssistantService extends BfApiService {
    /**
     * @param retailerId
     * @param mwsToken
     * @returns {Promise<*>}
     */
    async authorizeAmazon(retailerId, mwsToken, marketplaceId) {
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);
        return await this.httpClient.get(
            this.apiUrl  +'amazon/validate-account-connection', {
                params: {
                    shopId: shopId,
                    mwsAuthToken: mwsToken,
                    sellerId: retailerId,
                    marketplaceId: marketplaceId
                },
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @returns {Promise<*>}
     */
    async ebayConnectLink() {
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.get(
            this.apiUrl + 'ebay/connect-link/'+shopId,
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @returns {Promise<*>}
     */
    async ebayOAuthTokenLink(){
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.get(
            this.apiUrl + 'ebay/oauth-connect-link/'+shopId,
            {
                headers: await this.getHeaders()
            }
        )
    }

    /**
     * @returns {Promise<*>}
     */
    async ebayAuthorizationTokenState(){
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.get(
            this.apiUrl + 'ebay/connect-token-state/'+shopId,
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @returns {Promise<*>}
     */
    async ebayAuthorizationOAuthTokenState(){
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.get(
            this.apiUrl + 'ebay/connect-oauth-token-state/'+shopId,
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @param siteId
     * @returns {Promise<*>}
     */
    async ebaySiteIdCheck(siteId){
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.get(
            this.apiUrl + 'ebay/site/' + siteId,
            {
                headers: await this.getHeaders()
            }
        )
    }

    /**
     * @param channelName
     * @param toStoreParams
     * @returns {Promise<*>}
     */
    async storeShopsConfigurations(channelName, toStoreParams){
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.post(
            this.apiUrl + channelName + '/brickfox/shops/configurations',{
                shopId: shopId,
                shopsConfigurations: toStoreParams.shopsConfigurations
            },
            {
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * Triggers the import at the swagMarkets side to import the shops categories for the given channel.
     * @param channelName
     * @returns {Promise<void>}
     */
    async triggerCategoriesImport(channelName) {
        let config = await this.getConfig(),
            shopId = this.getShopId(config.swagMarkets_business_platform);

        this.httpClient.post(
            this.apiUrl + 'channels-categories/triggerBrickfoxImport',
            {
                shopId: shopId,
                channelType: channelName
            },
            {
                headers: await this.getHeaders()
            }
        )
    }

    /**
     * @param channelName
     * @param params
     * @returns {Promise<*>}
     */
    async validateMarketplace(channelName, params){
        let config = await this.getConfig();
            params.shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.get(
            this.apiUrl + channelName + '/validate-marketplace', {
                params: params,
                headers: await this.getHeaders()
            }
        )
    }

    validateMarketplaceDummy(){
        return true;
    }

    validateProductCheckDummy(tried = 0){
        if (tried === 0){
            return false;
        }
        return true;
    }

    /**
     * @param channelName
     * @param params
     * @returns {Promise<*>}
     */
    async marketplaceArticleExists(channelName, params) {
        let config = await this.getConfig();
        params.shopId = this.getShopId(config.swagMarkets_business_platform);

        return await this.httpClient.get(
            this.apiUrl + channelName + '/article-listing-exists',
            {
                params: params,
                headers: await this.getHeaders()
            }
        );
    }

    /**
     * @param baseId
     * @returns {string|*}
     */
    closeModal(baseId) {
        let redirectUrl = document.location.origin;

        if (baseId) {
            redirectUrl += '#/bf/sales/channel/detail/' + baseId + '/base';
            return redirectUrl;
        }

        return '';
    }

    /**
     *
     * @param obj
     * @returns {string|*}
     */
    getShopId(obj) {
        if (obj.hasOwnProperty('shop_id') && obj.shop_id !== undefined && obj.shop_id.length > 0) {
            return obj.shop_id;
        }

        return '';
    }
}

export default BfConnectionAssistantService;

Application.addServiceProvider('BfConnectionAssistantService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfConnectionAssistantService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
