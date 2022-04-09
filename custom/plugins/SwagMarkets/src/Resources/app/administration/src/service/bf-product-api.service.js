import BfSalesChannelService from "./bf-sales-channel.service";

const {Application} = Shopware;

import BfApiService from "./bf-api.service";
import SalesChannelService from "./bf-sales-channel.service";

class BfProductApiService extends BfApiService {
    async getProductErrors(shopsProductsIds) {
        const products = shopsProductsIds.length > 0 ? shopsProductsIds : [[]];
        return this.get(
            await this.getSalesChannelType() + '/shops/products-errors',
            {
                shopId: await this.getShopId(),
                shopsProductsIds: products
            }
        );
    }

    async getProductData(productIds) {
        const salesChannelType = await this.getSalesChannelType();
        let config = await this.getConfig();

        if (salesChannelType === 'amazon' ) {
            config = config.amazon_configuration;
        } else {
            config = config.ebay_configuration;
        }

        return this.get(
            await this.getSalesChannelType() + '/product-data/load',
            {
                shopId: await this.getShopId(),
                productId: productIds,
                marketplaceId: config.marketplace_id
            }
        );
    }

    async saveProductData(productId, data) {
        const salesChannelType = await this.getSalesChannelType();
        let config = await this.getConfig();

        if (salesChannelType === 'amazon' ) {
            config = config.amazon_configuration;
        } else {
            config = config.ebay_configuration;
        }

        return this.post(
            await this.getSalesChannelType() + '/product-data/store',
            {
                shopId: await this.getShopId(),
                bfProductId: productId,
                marketplaceId: config.marketplace_id,
                productData: data
            }
        );
    }

    /**
     *
     * @param productId {int}
     * @param limit {int}
     * @param page {int}
     * @returns {Promise<*>}
     */
    async loadProductVariationData(productId, limit, page) {
        return this.get(
            await this.getSalesChannelType() + '/product-variation-data/load',
            {
                shopId: await this.getShopId(),
                shopsProductsId: productId,
                limit: limit,
                page: page
            }
        );
    }
}

export default BfProductApiService;

Application.addServiceProvider('bfProductApiService', (container) => {
    const initContainer = Application.getContainer('init');

    return new BfProductApiService(
        initContainer.httpClient,
        container.loginService,
        'swagMarkets',
        'https://brickfox.io/api/',
    );
});
