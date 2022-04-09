const {Application} = Shopware;
const { ApiService } = Shopware.Classes;

class BfSupportService extends ApiService {
    constructor(httpClient, loginService, apiEndpoint, apiUrl) {
        super(httpClient, loginService, apiEndpoint);

        this.apiUrl = apiUrl;
        this.localStorageKey = 'SwagMarketsBearerToken';
        this.config = {};
        this.headers = {};
    }

    sendRequest(data) {
        return this.httpClient.post(
            this.apiEndpoint + 'send-support-request',
            data,
            {
                headers: this.getBasicHeaders()
            })
            .then((response) => {
                return response;
            })
            .catch((error) => {
                return error.response;
            });
    }
}

export default BfSupportService;

Application.addServiceProvider('bfSupportService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfSupportService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets/',
        ''
    );
});
