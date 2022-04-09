const {Application} = Shopware;
const ApiService = Shopware.Classes.ApiService;

import BfApiService from "./bf-api.service";

class BfPropertyService extends BfApiService {

    /**
     * @returns {Promise<*>}
     */
    async createProductsAttributes(id, translations) {
        return this.post(
            'attributes/create',
            {
                shopId: await this.getShopId(),
                json: {
                    productsAttributesCode: id,
                    externProductsAttributesId: id,
                    type: "STRING",
                    visibility: "FRONTEND",
                    assignment: "ALL",
                    usage: "SPECIAL",
                    keepOnImport: 1,
                    productsAttributesDescriptionData: {
                        translations
                    }
                }
            }
        )
    }

    /**
     * @param id
     * @param translations
     * @returns {Promise<*>}
     */
    async updateProductsAttributes(id, translations) {
        return this.post(
            'attributes/update',
            {
                shopId: await this.getShopId(),
                productsAttributesId: id,
                json: {
                    productsAttributesDescriptionData: {
                        translations
                    }
                }
            }
        )
    }

    async loadAttributeMappingData() {
        return this.get(
            await this.getSalesChannelType() + '/attributes-mapping/load',
            {
                shopId: await this.getShopId()
            }
        );
    }

    async saveAttributeMappingData(data) {
        return this.post(
            await this.getSalesChannelType() + '/attributes-mapping/store',
            {
                shopId: await this.getShopId(),
                mappingData: data
            }
        );
    }

    /**
     * @param mappingId
     * @returns {Promise<void>}
     */
    async removeAttributeMappingData(mappingId) {
        return this.delete(
            await this.getSalesChannelType() + '/attributes-mapping/' + mappingId,
            {
                shopId: await this.getShopId()
            }
        )
    }

    async loadAttributeValueMappingData(attributeId) {
        return this.get(
            await this.getSalesChannelType() + '/attributes-values-mapping/load',
            {
                shopId: await this.getShopId(),
                channelId: await this.getChannelId(),
                attributeId: attributeId
            }
        );
    }

    async saveAttributeValueMappingData(data) {
        return this.post(
            await this.getSalesChannelType() + '/attributes-values-mapping/store',
            {
                shopId: await this.getShopId(),
                channelId: await this.getChannelId(),
                mappingData: data
            }
        );
    }

    /**
     *
     * @param name
     * @returns {Promise<*>}
     * @deprecated use loadBfAttributeDataV2 instead
     */
    async loadBfAttributeData(name) {
        return this.post(
            'attributes/search',
            {
                shopId: await this.getShopId(),
                name: name
            }
        );
    }

    /**
     * @param search
     * @returns {Promise<*>}
     */
    async loadBfAttributeDataV2(search) {
        return this.post(
            'attributes/search/v2',
            {
                shopId: await this.getShopId(),
                search
            }
        );
    }

    /**
     * @param name
     * @param limit
     * @param page
     * @returns {Promise<*>}
     */
    async loadAttributeData(name, limit, page) {
        return this.post(
            'channels-attributes/search',
            {
                limit: limit,
                page: page,
                filter: [
                    {
                        field: "channelsId",
                        type: "=",
                        value: await this.getChannelId()
                    },
                    {
                        field: "name",
                        type: "like",
                        value: name + '%'
                    }
                ],
                groupBy: 'name',
                order: {
                    field: 'name',
                    direction: 'ASC'
                }
            }
        );
    }

    async loadAttributeValueData(channelsAttributesName, name) {
        return this.post(
            'channels-attributes-values/search',
            {
                limit: 500,
                filter: [
                    {
                        field: ["channelsAttributes", "name"],
                        type: "=",
                        value: channelsAttributesName
                    },
                    {
                        field: "name",
                        type: "like",
                        value: name + '%'
                    }
                ]
            }
        );
    }

    async loadPropertyData() {
        let config = await this.getConfig();
        if (config.swagMarkets_business_platform) {
            return this.get('erpSystems/configurations/' + config.swagMarkets_business_platform.shop_id, {});
        }
    }

    async storePropertyData(configurationType, configurationValue) {
        let erpSystemsConfigurations = {},
            config = await this.getConfig();

        if (config.swagMarkets_business_platform) {
            if (configurationType === 'property') {
                erpSystemsConfigurations.PROPERTIES_TO_IMPORT_AS_ATTRIBUTES = configurationValue;
            } else if (configurationType === 'custom_field') {
                erpSystemsConfigurations.CUSTOM_FIELDS_TO_IMPORT_AS_ATTRIBUTES = configurationValue;
            }

            return this.post(
                'erpSystems/configurations',
                {
                    shopId: config.swagMarkets_business_platform.shop_id,
                    erpSystemsConfigurations: erpSystemsConfigurations
                }
            );
        }
    }

    /**
     * Get the properties who only exists in brickfox
     * @returns {Promise<*>}
     */
    async getVariationProperties(page = 1, limit = 5) {
        return this.httpClient.post(
            this.apiUrl + 'variation-diff-options/search',
            {
                shopId: await this.getShopId(),
                "name": "*",
                limit: limit,
                page: page
            }, {headers: await this.getHeaders()}
        ).then((response) => {
            return ApiService.handleResponse(response);
        })
    }

    /**
     * Get the mapped properties
     * @param channelType
     * @returns {Promise<*>}
     */
    async getVariationsDiffsOptionsMapping(channelType) {
        return this.httpClient.get(
            this.apiUrl + channelType + '/variation-diff-options-mapping/load',
            {
                params: {shopId: await this.getShopId()},
                headers: await this.getHeaders()
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        })
    }

    /**
     * Stores the mapping information into the brickfox database
     * @param channelType
     * @param item
     * @returns {Promise<*>}
     */
    async storeVariationsDiffsOptionsMapping(channelType, item) {
        return this.httpClient.post(
            this.apiUrl + channelType + '/variation-diff-options-mapping/store',
            {
                shopId: await this.getShopId(),
                mappingData: item
            }, {headers: await this.getHeaders()}
        )
    }
}

export default BfPropertyService;

Application.addServiceProvider('bfPropertyService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfPropertyService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
