const {ApiService} = Shopware.Classes;

export default class BfApiService extends ApiService {

    constructor(httpClient, loginService, apiEndpoint, apiUrl) {
        super(httpClient, loginService, apiEndpoint);

        this.apiUrl = apiUrl;
        this.localStorageKey = 'SwagMarketsBearerToken';
        this.config = null;
        this.headers = {};
        this.salesChannelId = null;
        this.salesChannelType = null;
    }

    async getToken() {
        let token = localStorage.getItem(this.localStorageKey);

        if (token == null) {
            const result = await this.authorize();
            return this.setToken(result);
        }

        token = JSON.parse(token);

        if (token.expiry < Date.now()) {
            const result = await this.authorize();
            return this.setToken(result);
        }

        return token;
    }

    setToken(data) {
        const token = {
            access: data.token,
            expiry: Date.now() + (60 * data.expires_in)
        };

        localStorage.setItem(this.localStorageKey, JSON.stringify(token));

        return token;
    }

    async authorize() {
        const config = await this.getConfig();

        return await this.httpClient.post(
            this.apiUrl + 'oauth/token',
            {
                key: config.integration_user.access_key,
                secret_key: config.integration_user.secret_access_key
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        }).catch((error) => {
            return ApiService.handleResponse(error.response);
        });
    }

    async getConfig(forceReload = false) {
        if (this.config === null || forceReload === true) {
            this.config = await this.httpClient.get(
                this.apiEndpoint + '/config/load',
                {
                    headers: this.getBasicHeaders()
                })
                .then((response) => {
                    return ApiService.handleResponse(response.data.data);
                })
                .catch((error) => {
                    return ApiService.handleResponse(error.response);
                });
        }

        return this.config;
    }

    async getShopId() {
        return await this.getConfig()
            .then((config) => {
                return config.swagMarkets_business_platform.shop_id
            });
    }

    setSalesChannelId(salesChannelId) {
        this.salesChannelType = null;
        this.salesChannelId = salesChannelId;
    }

    setSalesChannelType(salesChannelType) {
        this.salesChannelType = salesChannelType;
    }

    async loadSalesChannelType() {
        return await this.httpClient.get(
            this.apiEndpoint + '/sales-channel-type/load/' + this.salesChannelId,
            {
                headers: this.getBasicHeaders()
            }
        ).then((response) => {
            return ApiService.handleResponse(response.data.data);
        }).catch((error) => {
            return ApiService.handleResponse(error.response);
        });
    }

    async getSalesChannelType() {
        if (this.salesChannelType === null) {
            this.salesChannelType = await this.loadSalesChannelType();
            this.salesChannelType = this.salesChannelType.toLowerCase();
        }

        return this.salesChannelType;
    }

    async getChannelId() {
        const config = await this.getConfig(),
            salesChannelType = await this.getSalesChannelType();

        if (salesChannelType === 'amazon') {
            const request = this.post(
                'channels/search',
                {
                    filter: [
                        {
                            field: 'channel_specific_id',
                            type: '=',
                            value: config.amazon_configuration.marketplace_id
                        }
                    ]
                }
            )

            return await request.then((result) => { return result.data[0].id });
        }

        if (salesChannelType === 'ebay') {
            const request = this.post(
                'channels/search',
                {
                    filter: [
                        {
                            field: 'channel_specific_id',
                            type: '=',
                            value: config.ebay_configuration.marketplace_id
                        }
                    ]
                }
            )
            return await request.then((result) => { return result.data[0].id });
        }
    }

    async getHeaders() {
        let token = await this.getToken();

        return {
            'Authorization': `Bearer ${token.access}`,
            'Content-Type': 'application/json'
        }
    }

    /**
     * @param resource
     * @param data
     * @returns {Promise<*>}
     */
    async get(resource, data) {
        return this.httpClient.get(
            this.apiUrl + resource,
            {
                headers: await this.getHeaders(),
                params: data
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    };

    /**
     * @param resource
     * @param data
     * @returns {Promise<*>}
     */
    async post(resource, data) {
        return this.httpClient.post(
            this.apiUrl + resource,
            data,
            {
                headers: await this.getHeaders()
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    /**
     * @param resource
     * @param params
     * @returns {Promise<*>}
     */
    async delete(resource, params) {
        return this.httpClient.delete(
            this.apiUrl + resource,
            {
                headers: await this.getHeaders(),
                data: {
                    ...params
                }
            },
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }
}
