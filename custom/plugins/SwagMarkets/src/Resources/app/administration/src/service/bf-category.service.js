import BfApiService from "./bf-api.service";

const {Application, Service} = Shopware;
const ApiService = Shopware.Classes.ApiService;

class BfCategoryService extends BfApiService {

    /**
     * @param marketplace
     * @param page
     * @param limit
     * @returns {Promise<*>}
     */
    async getMappedCategories(marketplace, page = 1, limit = 10) {
        return this.get(
            marketplace + '/categories-mapping/v2',
            {
                shopId: await this.getShopId(),
                page: page,
                limit: limit,
                loadRecursive: false
            }
        ).then((response) => {
            return response;
        });
    }

    /**
     * @param channelId
     * @returns {*}
     */
    isSalesChannelSwagMarkets(channelId) {
        return this.httpClient.get(
            '/swagMarkets/check-own-sales-channel' + channelId,
            {
                headers: this.headers
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    };

    /**
     * @param parentId
     * @returns {Promise<*>}
     */
    async getCategories(parentId = null) {
        return this.post(
            'channels-categories/search',
            {
                limit: 500,
                filter: [
                    {
                        field: "channelsId",
                        type: "=",
                        value: await this.getChannelId()
                    },
                    {
                        field: "parentId",
                        type: "=",
                        value: parentId
                    }
                ]
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    async getRootCategories() {
        return this.post(
            'channels-categories/search',
            {
                limit: 500,
                filter: [
                    {
                        field: "channelsId",
                        type: "=",
                        value: await this.getChannelId()
                    },
                    {
                        field: "parentId",
                        value: null
                    }
                ]
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    };

    /**
     * @param categoryId
     * @returns {Promise<*>}
     */
    async getChildCategories(categoryId) {
        return this.post(
            'channels-categories/search',
            {
                limit: 500,
                filter: [
                    {
                        field: "channelsId",
                        type: "=",
                        value: await this.getChannelId()
                    },
                    {
                        field: "parentId",
                        type: "=",
                        value: categoryId
                    }
                ]
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    };

    /**
     * @param id
     * @returns {Promise<*>}
     */
    async getCategoryById(id) {
        return this.get(
            'channels-categories/' + id,
        ).then((result) => {
            return ApiService.handleResponse(result);
        });
    }

    /**
     * @param name
     * @returns {Promise<*>}
     */
    async getCategoryByName(name) {
        return this.post(
            'channels-categories/search',
            {
                filter: [
                    {
                        field: "channelsId",
                        type: "=",
                        value: await this.getChannelId()
                    },
                    {
                        field: "name",
                        type: "=",
                        value: name
                    }
                ]
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    /**
     * @param field
     * @param values
     * @returns {Promise<*>}
     */
    async findCategoriesBy(field, values) {
        let filterCollection = []
        filterCollection.push({
            field: "channelsId",
            type: "=",
            value: await this.getChannelId()
        });
        values.forEach((id) => {
            filterCollection.push({
                "field": field,
                "type": "=",
                "value": id,
                "operator": "OR"
            })
        });

        return this.post(
            'channels-categories/search',
            {
                filter: filterCollection
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });

    }

    /**
     * @param name
     * @returns {Promise<*>}
     */
    async findCategoryByName(name) {
        return this.post(
            'channels-categories/search',
            {
                filter: [
                    {
                        field: "channelsId",
                        type: "=",
                        value: await this.getChannelId()
                    },
                    {
                        field: "name",
                        type: "like",
                        value: "%" + name + "%"
                    }
                ]
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    };

    /**
     * @param categories
     * @param specificKey
     * @returns {Promise<*>}
     */
    findCategoriesById(categories, specificKey = {}) {
        let filterCollection = []
        categories.forEach((category) => {
            filterCollection.push({
                "field": "external_channels_categories_id",
                "type": "=",
                "value": category.external_channels_categories_id,
                "operator": "OR"
            })
        });

        return this.post(
            'channels-categories/search',
            {
                filter: filterCollection,
                specificKey: specificKey
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    findCategoriesByIds(ids) {
        let filterCollection = []
        ids.forEach((id) => {
            filterCollection.push({
                "field": "id",
                "type": "=",
                "value": id,
                "operator": "OR"
            })
        });

        return this.post(
            'channels-categories/search',
            {
                filter: filterCollection
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    /**
     * @param channelId
     * @returns {*}
     */
    getSalesChannelTypeName(channelId) {
        return this.httpClient
            .get(
                '/swagMarkets/get-sales-channel-type-name/' + channelId,
                {
                    headers: this.headers
                }
            ).then((response) => {
                return ApiService.handleResponse(response);
            });
    };

    /**
     * @param channelId
     * @returns {*}
     */
    getMerchantId(channelId) {
        return this.httpClient
            .get(
                '/swagMarkets/get-merchant-id/' + channelId,
                {
                    headers: this.headers
                }
            ).then((response) => {
                return ApiService.handleResponse(response);
            });
    };

    /**
     * @param shopwareCategory
     * @param categories
     * @param marketplace
     * @returns {Promise<*>}
     */
    async saveCategoryMapping(shopwareCategory, categories, marketplace) {
        return this.post(
            marketplace + '/categories-mapping',
            {
                shopId: await this.getShopId(),
                data: [
                    {
                        swCategoryId: shopwareCategory,
                        channelsCategoriesId:
                            [...categories]

                    }
                ]
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    /**
     * @param preparedSegment
     * @returns {Promise<*>}
     */
    async storeCategorySegmentMapping(preparedSegment) {
        return this.post(
            'amazon/shops/store/product-segment',
            {
                shopId: await this.getShopId(),
                productSegments: [
                    preparedSegment
                ]
            }
        ).then((response) => {
            return ApiService.handleResponse(response);
        });
    }

    async getSegments() {
        let shopId = await this.getShopId();

        if (shopId.length === 0) {
            return false;
        }

        return this.get('amazon/product-segments/' + shopId)
            .then((response) => {
                return ApiService.handleResponse(response);
            });
    };

    async getCategorySegment(categoryId) {
        return this.get('amazon/shops/load/product-segment/' + await this.getShopId() + '/' + categoryId)
            .then((response) => {
                return ApiService.handleResponse(response);
            });
    }

    async getSegmentsTypes(segmentName) {
        return this.get('amazon/product-types/' + await this.getShopId() + '/' + segmentName)
            .then((response) => {
                return ApiService.handleResponse(response);
            });
    }
}

export default BfCategoryService;

Application.addServiceProvider('BfCategoryService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfCategoryService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
