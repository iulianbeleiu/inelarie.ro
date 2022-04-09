import BfApiService from "./bf-api.service";

const {Application} = Shopware;

class BfPluginConfigurationService extends BfApiService {

    async repairIntegrationUser() {
        return this.httpClient.post(
            'swagMarkets/config/repair-integration-user',
            {},
            {
                headers: this.getBasicHeaders()
            }
        );
    }
}

export default BfPluginConfigurationService;


Application.addServiceProvider('bfPluginConfigurationService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfPluginConfigurationService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
       'https://brickfox.io/api/',
    );
});
