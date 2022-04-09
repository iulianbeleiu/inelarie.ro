const {Application} = Shopware;
const { ApiService } = Shopware.Classes;

class BfContractService extends ApiService {
    constructor(httpClient, loginService, apiEndpoint) {
        super(httpClient, loginService, apiEndpoint);

        this.localStorageKey = 'SwagMarketsBearerToken';
        this.config = {};
        this.headers = {};
    }

    getSbpHeaders(credentials) {
        return {
            'X-Shopware-Platform-Token': credentials.longLifeToken,
            'X-Shopware-Shop-Secret': credentials.shopSecret
        }
    }

    getSwQueryParams() {
        return this.getUserInformation('user-information')
            .then((response) => {
                return this.serialiseObjectInQueryParameters(response);
            });
    }

    serialiseObjectInQueryParameters(object) {
        let result = [];

        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                result.push(encodeURIComponent(key) + "=" + encodeURIComponent(object[key]));
            }
        }

        return '?' + result.join("&");
    }

    getUserInformation(url) {
        return this.httpClient.get(
            'swagMarkets/config/' + url,
            {
                headers: this.getBasicHeaders()
            })
            .then((response) => {
                return response.data.data;
            })
            .catch((error) => {
                return error.response;
            });
    }

    setUserShopId(shopId) {
        return this.httpClient.post(
            'swagMarkets/config/set-shop-id',
            {
                shopId: shopId
            },
            {
                headers: this.getBasicHeaders()
            })
            .then((response) => {
                return response.data.data;
            })
            .catch((error) => {
                return error.response;
            });
    }

    getContracts() {
        return this.getUserInformation('user-token').then((credentials) => {
            return this.getSwQueryParams().then((params) => {
                return this.httpClient.get(
                    credentials.url + this.apiEndpoint + params,
                    {
                        headers: this.getSbpHeaders(credentials)
                    }
                ).then((response) => {
                    return response.data;
                });
            });
        });
    }

    setContract(contractName) {
        return this.getUserInformation('user-token').then((credentials) => {
            return this.getSwQueryParams().then((params) => {
                return this.httpClient.post(
                    credentials.url + this.apiEndpoint + params,
                    {
                        contractName: contractName
                    },
                    {
                        headers: this.getSbpHeaders(credentials)
                    }
                ).then((response) => {
                    return response;
                });
            });
        });
    }

    cancelContract(identifier) {
        return this.getUserInformation('user-token').then((credentials) => {
            return this.getSwQueryParams().then((params) => {
                return this.httpClient.post(
                    credentials.url + this.apiEndpoint + '/' + identifier + '/cancellation'  + params,
                    {},
                    {
                        headers: this.getSbpHeaders(credentials)
                    }
                ).then((response) => {
                    return response;
                });
            });
        });
    }
}

Application.addServiceProvider('bfContractService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfContractService(
        initContainer.httpClient,
        container.loginService,
        '/swplatform/plugin/SwagMarkets/servicecontracts'
    );
});
