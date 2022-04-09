import template from './bf-sales-channel-detail-product-list.html.twig';
import './bf-sales-channel-detail-product-list.scss';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-sales-channel-detail-product-list', {
    template,
    inject: [
        'BfSalesChannelService',
        'bfContractService',
        'repositoryFactory',
        'bfProductApiService',
        'filterFactory'
    ],
    metaInfo() {
        return {
            title: 'Products'
        }
    },
    props: {
        filterIsExpanded: {
            type: Boolean
        }
    },
    data() {
        return {
            products: null,
            bfProductsErrors: [],
            dangerZone: false,
            warningZone: false,
            greenZone: true,
            currentContract: {},
            searchWord: '',
            shopProductData: [],
            shopProductsErrors: [],
            showProductsErrorsModal: false,
            salesChannel: null,
            marketplaceName: '',
            marketplace: {},
            sortBy: 'productNumber',
            sortDirection: 'DESC',
            naturalSorting: true,
            isLoading: false,
            fullPage: false,
            channelLimit: 1000,
            limit: 10,
            license: null,
            total: 0,
            page: 1,
            userAuthorised: false,
            showLoginModal: false,
            bfFilterCriteria: [],
            defaultFilters: [
                'active-filter',
                'manufacturer-filter',
            ],
            storeKey: 'bf.product.list',
            isExpanded: false,
            activeFilterNumber: 0
        }
    },
    watch: {
        productCriteria: {
            handler() {
                this.getList();
            },
            deep: true
        }
    },
    computed: {
        columns() {
            return this.getProductColumns();
        },
        productRepository() {
            return this.repositoryFactory.create('product');
        },
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        },
        listFilter() {
            return this.filterFactory.create('product', {
                'active-filter': {
                    property: 'active',
                    label: this.$tc('sw-product.filters.activeFilter.label'),
                    placeholder: this.$tc('sw-product.filters.activeFilter.placeholder')
                },
                'manufacturer-filter': {
                    property: 'manufacturer',
                    label: this.$tc('sw-product.filters.manufacturerFilter.label'),
                    placeholder: this.$tc('sw-product.filters.manufacturerFilter.placeholder')
                },
            });
        },
        productCriteria() {
            const productCriteria = new Criteria(this.page, this.limit);

            this.naturalSorting = this.sortBy === 'productNumber';

            productCriteria.addFilter(Criteria.equals('product.parentId', null));
            productCriteria.addFilter(Criteria.equals('product.visibilities.salesChannelId', this.$route.params.id));
            productCriteria.addSorting(Criteria.sort(this.sortBy, this.sortDirection, this.naturalSorting));
            productCriteria.addAssociation('cover');
            productCriteria.addAssociation('visibilities');
            productCriteria.addAssociation('categories');
            productCriteria.addAssociation('manufacturer');

            if (this.searchWord !== '') {
                productCriteria.setTerm(this.searchWord);
                productCriteria.page = 1;
            }

            this.bfFilterCriteria.forEach(filter => {
                productCriteria.addFilter(filter);
            });

            return productCriteria;
        }
    },
    created() {
        this.bfProductApiService.setSalesChannelId(this.$route.params.id);

        this.getList();
        this.loadSalesChannel();
    },
    methods: {
        closeLoginModal() {
            this.showLoginModal = false;
            this.getContractDetails();
        },
        loadMarketplace() {
            this.isLoading = true;

            this.BfSalesChannelService.getMarketplace()
                .then((response) => {
                    this.marketplace = response.data.data;

                    this.isLoading = false;
                })
                .catch((error) => {
                    this.isLoading = false;
                });
        },
        loadSalesChannel() {
            this.isLoading = true;
            this.salesChannelRepository
                .get(this.$route.params.id, Context.api, this.getLoadSalesChannelCriteria())
                .then((entity) => {
                    this.salesChannel = entity;
                    this.marketplaceName = this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId);

                    this.loadMarketplace();
                    this.isLoading = false;
                });
        },
        getContractDetails() {
            return this.bfContractService.getContracts()
                .then((contracts) => {
                    if (contracts.current !== null) {
                        this.currentContract = contracts.current;
                        this.channelLimit = this.currentContract.items[0].limit;

                        if (this.channelLimit > 0) {
                            this.dangerZone = this.total > this.channelLimit * 0.9;
                            this.warningZone = this.total > this.channelLimit * 0.6;
                            this.greenZone = !this.dangerZone && !this.warningZone;
                        }
                    }

                    this.userAuthorised = contracts.bookable !== undefined;

                    return contracts;
                })
                .catch((error) => {
                    this.handleSbpError(error);
                });
        },
        handleSbpError(error) {
            if (error.response === undefined) {
                this.userAuthorised = false;
            } else {
                let errorResponse = error.response.data;

                this.createNotificationError({
                    title: errorResponse.title,
                    message: errorResponse.description
                });
            }
        },
        getLoadSalesChannelCriteria() {
            const criteria = new Criteria();

            criteria.addAssociation('marketplaces');

            return criteria;
        },
        async criteriaChanged(criteria) {
            this.page = 1;
            this.bfFilterCriteria = criteria;
        },
        async getList() {
            this.isLoading = true;
            this.productCriteria.page = this.page; // this part needed for pagination with search result

            const criteria = await Shopware.Service('filterService').mergeWithStoredFilters(this.storeKey, this.productCriteria);
            this.activeFilterNumber = criteria.filters.length - 1;

            this.productRepository.search(this.productCriteria, Shopware.Context.api)
                .then((products) => {
                    if (products.getIds().length > 0) {
                        this.bfProductApiService.getProductData(products.getIds()).then((response) => {
                            this.getProductErrors(response).then((productErrors) => {
                                if (response.success === true) {
                                    response.data.forEach((shopProductDataItem) => {
                                        shopProductDataItem.errors = [];

                                        if (productErrors.success === true && productErrors.data.length > 0) {
                                            productErrors.data.forEach((errors) => {
                                                if (shopProductDataItem.productId === errors.shopsProductsData.externProductsId) {
                                                    shopProductDataItem.errors.push(errors);
                                                }
                                            })
                                        }

                                        this.shopProductData[shopProductDataItem.productId] = shopProductDataItem;
                                    });
                                }

                                this.total = products.total;
                                this.products = products;

                                this.getContractDetails();

                                this.isLoading = false;
                            });
                        }).catch((error) => {
                            console.log(error);
                        })
                    }
                }).catch(() => {

                })
        },
        paginateBf(args) {
            this.page = args.page;
            this.limit = args.limit;

            this.getList();
        },
        openProductErrorsModal(productItem) {
            this.shopProductsErrors = [];

            if (this.shopProductData[productItem.id]) {
                this.shopProductData[productItem.id].errors.forEach((error, item) => {
                    let errorCode = error.shopsTypesErrorsData.shopsTypesErrorsCode,
                        errorDescription = error.shopsProductsErrorsMessage;

                    if (errorCode === null) {
                        errorCode = 'N/A';
                    }

                    let parsedError = {
                        code: errorCode,
                        description: errorDescription
                    };

                    this.shopProductsErrors.push(parsedError);
                });

                let failedShopsFilter = this.shopProductData[productItem.id].failedShopsFilter;

                if (failedShopsFilter !== undefined && failedShopsFilter.length > 0) {
                    this.shopProductsErrors.push({
                        code: 1,
                        description: this.$tc('products.failedShopsFilter') + failedShopsFilter
                    });
                }

                if (this.shopProductData[productItem.id].marketplaceInitialDate === '') {
                    this.shopProductsErrors.push(
                        this.getProductNotTransferredError(2, 'notTransferredProductToMarketplace')
                    );
                }
            }

            if (this.shopProductsErrors.length === 0) {
                this.shopProductsErrors.push(
                    this.getProductNotTransferredError(0, 'notTransferredProduct')
                );
            }

            this.showProductsErrorsModal = true;
        },
        /**
         * @param expanded {Boolean}
         */
        expand(expanded) {
            this.isExpanded = expanded;
        },
        getErrorColumns() {
            return [
                {
                    property: 'code',
                    label: 'Code',
                    primary: true,
                    width: "120px"
                }, {
                    property: 'description',
                    label: 'sw-property.list.columnDescription',
                    width: 'auto'
                }
            ];
        },
        getProductErrors(response) {
            let shopsProductsIds = [];
            if (response.data.length > 0) {
                response.data.forEach((data) => {
                    shopsProductsIds.push(data.bfProductId);
                })
            }

            return this.bfProductApiService.getProductErrors(shopsProductsIds);
        },
        getProductNotTransferredError(code, translationKey) {
            return {
                code: code,
                description: this.$tc('products.' + translationKey)
            };
        },
        getProductColumns() {
            return [
                {
                    property: 'name',
                    label: this.$tc('products.table-headers.product-name'),
                    allowResize: true,
                    primary: true,
                    width: '90px'
                },
                {
                    property: 'productNumber',
                    label: this.$tc('products.table-headers.product-number'),
                    allowResize: true,
                    align: 'left'
                },
                {
                    property: 'active',
                    label: this.$tc('products.table-headers.status'),
                    allowResize: true,
                    align: 'center'
                },
                {
                    property: 'category',
                    label: this.$tc('products.table-headers.category-name'),
                    allowResize: true,
                    sortable: false,
                },
                {
                    property: 'online',
                    label: this.$tc('products.table-headers.online-status'),
                    allowResize: true,
                    align: 'center',
                    width: '30px',
                    visible: true,
                    sortable: false,
                },
                {
                    property: 'error',
                    label: this.$tc('products.table-headers.error'),
                    allowResize: true,
                    align: 'center',
                    width: '45px',
                    visible: true,
                    sortable: false,
                }
            ];
        },
    }
});
