import template from './bf-sales-channel-category-mapping.html.twig';
import './bf-sales-channel-category-mapping.scss';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;
const {mapGetters, mapMutations} = Shopware.Component.getComponentHelper();

Component.register('bf-sales-channel-category-mapping', {
    template,

    inject: [
        'repositoryFactory',
        'bfProductApiService',
        'BfSalesChannelService',
        'BfCategoryService'
    ],

    props: {
        salesChannelType: {
            type: String,
            required: true
        },
        categoriesReloadTriggerEvent: {
            required: false
        }
    },

    data() {
        return {
            swCategories: [],
            categories: [],
            swCategoriesIds: [],
            marketplaceCategoriesId: {},
            marketplaceId: null,
            channelsId: null,
            gridItems: [],
            isLoading: true,
            isLoadingMarketplaceCategories: true,
            limit: 5,
            page: 1,
            total: 0,
            categoriesMappingStorage: {},
            shopsCategoriesGroups: {},
            showModal: false,
            toDeleteSwCategoryId: '',
            showEmptyState: false
        }
    },

    computed: {
        categoriesRepository() {
            return this.repositoryFactory.create('category');
        },
        columns() {
            return this.getColumns();
        },
    },

    watch: {
        salesChannelType: function (newVal) {
            if (newVal.length > 0) {
                this.loadMarketplaceId();
                this.loadSelectedSwCategories();
            }
        },
        categoriesReloadTriggerEvent: function (newVal, oldVal) {
            this.reset();
            this.loadSelectedSwCategories();
        }
    },
    created() {
        this.BfSalesChannelService.setSalesChannelId(this.$route.params.id);
    },
    methods: {
        ...mapMutations([
            'setCategoriesMappingStorage'
        ]),
        ...mapGetters('bfCategoryMapping', [
            'getCategoriesMappingStorage'
        ]),
        async loadMarketplaceId() {
            this.marketplaceId = await this.BfSalesChannelService.getMarketplaceId(this.salesChannelType);
        },
        /**
         * @returns {Promise<void>}
         */
        async loadSelectedSwCategories() {
            let me = this;
            this.isLoading = true;

            await this.BfSalesChannelService.getChannelId().then((channelsId) => {
                this.channelsId = channelsId;
            });

            await this.BfCategoryService.getMappedCategories(this.salesChannelType, this.page, this.limit).then((response) => {
                if (response) {
                    me.total = response.totalCount;
                    response.data.some(function (data) {
                        if (data.shopsCategoriesGroupsExternShopsCategoriesIds.length > 0) {
                            let externGroupsId = data.externGroupsId;

                            data.shopsCategoriesGroupsExternShopsCategoriesIds.forEach(function (externShopsCategoriesId) {
                                if (me.swCategoriesIds.find(el => el === externGroupsId) === undefined) {
                                    me.swCategoriesIds.push(externGroupsId);
                                    me.marketplaceCategoriesId[externGroupsId.toString()] = [externShopsCategoriesId.toString()]
                                } else {
                                    me.marketplaceCategoriesId[externGroupsId.toString()].push(externShopsCategoriesId.toString())
                                }
                            });
                        }
                    });
                }
            });

            await this.loadShopwareCategories();

            this.isLoading = false;
        },
        async loadShopwareCategories() {
            let me = this, criteria = new Criteria(1, this.limit), mapping = [];

            if (this.swCategoriesIds.length > 0) {
                criteria.addFilter(Criteria.equalsAny('id', this.swCategoriesIds));
            } else {
                criteria.addFilter(Criteria.equals('id', '7f52488ee997439ea8e842738cebe5c7'));
            }

            await this.categoriesRepository.search(criteria, Context.api).then((categoryEntities) => {
                this.swCategories = categoryEntities;
                if (categoryEntities.length > 0 && this.swCategoriesIds.length > 0) {
                    categoryEntities.forEach(async function (categoryEntity) {
                        await me.swSelectionAdd(categoryEntity, me.marketplaceCategoriesId[categoryEntity.id.toString()]);
                    });
                }
                this.sortGridItems();
            });

            if (this.gridItems.length === 0) {
                this.showEmptyState = true;
            }
        },

        /**
         * @param item
         * @param marketplaceCategoriesIds
         */
        swSelectionAdd(item, marketplaceCategoriesIds = []) {
            if (this.categoryAlreadyExists(item.id) === undefined) {
                let breadCrumb = '', counter = 1, breadCrumbLength = item.breadcrumb.length, itemName = item.name;

                item.breadcrumb.forEach(function (crumb) {
                    if (counter < breadCrumbLength) {
                        breadCrumb += crumb + ' / ';
                    } else {
                        breadCrumb += crumb;
                    }
                    ++counter;
                });

                this.addToStorage(item.id, marketplaceCategoriesIds);

                if (itemName === null) {
                    itemName = item.translated.name;
                }

                this.gridItems.push({
                    swCategoriesId: item.id,
                    shopwareCategory: breadCrumbLength > 1 ? '.../' + itemName : itemName,
                    breadCrumb: breadCrumb,
                    marketplaceCategoriesIds: marketplaceCategoriesIds
                });

                this.showEmptyState = false;
            }
        },
        /**
         * @param swCategoryId
         */
        categoryAlreadyExists(swCategoryId) {
            return this.gridItems.find(item => (item.swCategoriesId.toString() === swCategoryId.toString()));
        },
        /**
         * @param swCategoryId
         * @param marketplaceCategoriesIds
         */
        addToStorage(swCategoryId, marketplaceCategoriesIds = []) {
            let categoriesMappingStorage = this.getCategoriesMappingStorage();

            categoriesMappingStorage[swCategoryId.toString()] = marketplaceCategoriesIds;
            this.$store.commit('bfCategoryMapping/setCategoriesMappingStorage', categoriesMappingStorage);
        },
        showDeleteModal(id) {
            this.toDeleteSwCategoryId = id;
            this.showModal = true;
        },
        closeShowModal() {
            this.toDeleteSwCategoryId = '';
            this.showModal = false;
        },
        removeCategoryAssignment() {
            let categoriesMappingStorage = this.getCategoriesMappingStorage(), counter = 0;
            const me = this;

            if (this.toDeleteSwCategoryId.length > 0) {

                this.gridItems = this.gridItems.filter(function (item) {
                    return item.swCategoriesId !== me.toDeleteSwCategoryId
                });

                categoriesMappingStorage[this.toDeleteSwCategoryId] = [];
                this.$store.commit('bfCategoryMapping/setCategoriesMappingStorage', categoriesMappingStorage);
                const objects = Object.entries(this.getCategoriesMappingStorage())

                objects.forEach(async function (categoryMapping) {
                    ++counter;

                    await me.BfCategoryService.saveCategoryMapping(categoryMapping[0], categoryMapping[1], me.salesChannelType);

                    if(counter === objects.length) {
                        me.reset();
                        me.loadSelectedSwCategories();
                    }
                });

                this.showModal = false;
            }
        },
        pageChange(params) {
            this.page = params.page;
            this.limit = params.limit;
            this.reset();
            this.loadSelectedSwCategories();
        },
        reset() {
            this.gridItems = [];
            this.swCategories = [];
            this.categories = [];
            this.swCategoriesIds = [];
            this.marketplaceCategoriesId = {};
            this.$store.commit('bfCategoryMapping/setCategoriesMappingStorage', []);
        },
        sortGridItems() {
            if (this.gridItems.length > 1) {
                this.gridItems.sort(function (a, b) {
                    return a.shopwareCategory > b.shopwareCategory ? 1 : -1;
                });
            }
        },
        /**
         * @returns {({property: string, label: *, rawData: boolean, height: number}|{property: string, label: *, rawData: boolean, height: string})[]}
         */
        getColumns() {
            return [
                {
                    property: 'shopwareCategory',
                    label: this.$tc('categories.shopware-tree-title'),
                    rawData: true,
                    height: 300
                },
                {
                    property: 'salesChannelCategories',
                    label: this.createColumnHeaderLabelForMarketplaceColumn(),
                    rawData: true,
                    height: '300px'
                }
            ]
        },
        createColumnHeaderLabelForMarketplaceColumn() {
            return this.salesChannelType === 'amazon' ?
                this.$tc('categories.amazon-marketplace-title') : this.$tc('categories.ebay-marketplace-title')
        }
    },
});
