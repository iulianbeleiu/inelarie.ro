import template from './bf-sales-channel-amazon-asin-management.html.twig';

const { Component } = Shopware;

Component.register('bf-sales-channel-amazon-asin-management', {
    template,

    inject: [
        'bfProductApiService',
        'BfAmazonService'
    ],

    props: {
        shopProductData: {
            type: Array,
            required: true
        },
        product: {
            type: Object,
            required: true
        },
    },

    data () {
        return {
            dataSource: [],
            total: 0,
            page: 1,
            limit: 5
        }
    },

    computed: {
        getColumns () {
            return this.columns ();
        }
    },

    created() {
        this.loadShopsProductsVariationsData ();
    },

    methods: {
        loadShopsProductsVariationsData () {
            const me = this;
            this.bfProductApiService.loadProductVariationData(this.shopProductData[this.product.id].bfProductId, this.limit, this.page).then((response) => {
                if (response.success) {
                    this.total  = response.data.totalCount
                    response.data.data.forEach(function (item) {
                        let hasAsin = false;
                        if (item.hasOwnProperty('shopsProductsVariationsOffers') && item.shopsProductsVariationsOffers.length > 0) {
                            hasAsin = item.shopsProductsVariationsOffers[0].hasOwnProperty('externShopsProductsVariationsId');
                        }

                        me.dataSource.push({
                            shopsProductsVariationsId: item.bfShopsProductsVariationsId,
                            productNumber: item.productsVariationsItemNumber,
                            externShopsProductsVariationsId: hasAsin ? item.shopsProductsVariationsOffers[0].externShopsProductsVariationsId : '',
                            shopsProductsVariationsOffersId: hasAsin ? item.shopsProductsVariationsOffers[0].shopsProductsVariationsOffersId : null
                        })
                    });
                }
            })
        },
        /**
         * @param item {object}
         */
        async inlineEditSave (item) {
            await this.BfAmazonService.saveAmazonAsin(item).then((response) => {
                if (response.success) {
                    this.dataSource.forEach(function (item) {
                        if (item.shopsProductsVariationsId === response.data.shopsProductsVariationsId) {
                            item.shopsProductsVariationsOffersId = response.data.shopsProductsVariationsOffersId
                        }
                    })
                }
            });
        },
        /**
         * @param paginationData {object}
         */
        paginate (paginationData) {
            this.page = paginationData.page;
            this.limit = paginationData.limit;
            this.dataSource = [];
            this.loadShopsProductsVariationsData();
        },
        columns () {
            return [
                {
                    property: "productNumber",
                    label: this.$tc('products.table-headers.product-number'),
                    allowResize: false,
                    align: 'left'
                },
                {
                    property: 'externShopsProductsVariationsId',
                    label: this.$tc('products.table-headers.asin'),
                    allowResize: false,
                    allowInlineEdit: true,
                    inlineEdit: 'string'
                }
            ]
        }
    }
})
