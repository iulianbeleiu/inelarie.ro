const {Application} = Shopware;

import BfApiService from "./bf-api.service";

class BfUnitService extends BfApiService {
    async loadUnitData(name) {
        return this.post(
            'units/search',
            {
                shopId: await this.getShopId(),
                name: name
            }
        );
    }

    async loadUnitMappingData() {
        return this.get(
            await this.getSalesChannelType() + '/units-mapping/load',
            {
                shopId: await this.getShopId()
            }
        );
    }

    async saveUnitMappingData(data) {
        return this.post(
            await this.getSalesChannelType() + '/units-mapping/store',
            {
                shopId: await this.getShopId(),
                mappingData: data
            }
        );
    }
}

export default BfUnitService;

Application.addServiceProvider('bfUnitService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfUnitService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
