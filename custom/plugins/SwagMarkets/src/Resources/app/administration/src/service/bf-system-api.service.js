import BfApiService from "./bf-api.service";

const {Application} = Shopware;
const { ApiService } = Shopware.Classes;

class BfSystemApiService extends BfApiService {
    async getSkuLimit() {
        return this.httpClient.get(
            this.apiUrl + 'system/configs/skuLimit',
            {
                headers: await this.getHeaders()
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    async getLicense() {
        const config = await this.getConfig();
        return this.httpClient.get(
            this.apiUrl + 'system/client/' + config.client.shop_id,
            {
                headers: await this.getHeaders()
            }
        )
            .then((response) => {
                return ApiService.handleResponse(response);
            });
    }
}

export default BfSystemApiService;

Application.addServiceProvider('bfSystemApiService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfSystemApiService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
