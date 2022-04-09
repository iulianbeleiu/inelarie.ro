import template from './bf-grid-column-tree-field.html.twig';

const {Component, Context} = Shopware;
const {EntityCollection} = Shopware.Data;
const {mapGetters, mapMutations} = Shopware.Component.getComponentHelper();

Component.register('bf-grid-column-tree-field', {
    template,

    inject: [
        'BfCategoryService'
    ],

    props: {
        marketplaceCategories: {
            type: Object,
            default() {
                return {
                    categories: [],
                    categoryTree: []
                }
            }
        },
        marketplaceCategoriesIds: {
            type: Array,
            default() {
                return []
            }
        },
        swCategoryId: {
            required: false
        },
        channelsId: {
            required: true
        }
    },

    data() {
        return {
            isLoadingMarketplaceCategories: true,
            categories: [],
            channelsId: null
        }
    },

    methods: {
        ...mapMutations([
            'setCategoriesMappingStorage'
        ]),
        ...mapGetters('bfCategoryMapping', [
            'getCategoriesMappingStorage'
        ]),
        loadComponent() {
            this.loadMarketplaceCategoriesData();
        },
        loadMarketplaceCategoriesData() {
            let categories = new EntityCollection('/bf-sales-channel', 'category', Context.api, null, this.categoryCollection),
                marketplaceCategoriesIds = [];
            if (this.marketplaceCategoriesIds.length <= 0) {
                this.marketplaceCategories.categories = categories;
                this.isLoadingMarketplaceCategories = false;
                return;
            }

            this.marketplaceCategoriesIds.forEach(function (item){
                marketplaceCategoriesIds.push({external_channels_categories_id: item});
            });

            this.BfCategoryService.findCategoriesById(
                marketplaceCategoriesIds,
                {key: 'channels_id', value: this.channelsId}
            ).then(async (result) => {
                await result.forEach((item) => {
                    this.categories.push(item);
                    this.getCategoryTree(item.parent_id).then(() => {
                        if (this.categories.length > 0) {
                            this.categories.forEach((category) => {
                                this.marketplaceCategories.categoryTree.push(this.toString(category.id));
                            });
                        }
                    });
                });
                result.forEach((item) => {
                    item.id = this.toString(item.id);
                    categories.add({
                        data: item,
                        id: this.toString(item.id),
                        categoryId: item.external_channels_categories_id,
                        name: item.name,
                        translated: {
                            name: item.name,
                        },
                        childCount: item.children,
                        parentId: item.parent_id,
                        afterCategoryId: item.parent_id,
                        breadcrumb: item.breadCrumb.split(" > ")
                    });
                });

                this.marketplaceCategories.categories = categories;
            });

            this.isLoadingMarketplaceCategories = false;
        },
        /**
         * @param categoryId
         * @returns {Promise<void>}
         */
        async getCategoryTree(categoryId = null) {
            if (categoryId != null) {
                return await this.BfCategoryService.getCategoryById(categoryId).then(async (result) => {
                    result.id = this.toString(result.id);
                    this.categories.push({
                        data: result,
                        id: this.toString(result.id),
                        categoryId: result.external_channels_categories_id,
                        name: result.name,
                        translated: {
                            name: result.name,
                        },
                        childCount: result.children,
                        parentId: this.toString(result.parent_id),
                        afterCategoryId: this.toString(result.parent_id)
                    });
                    await this.getCategoryTree(result.parent_id);

                    return Promise.resolve();
                });
            }
        },
        /**
         * @param item
         */
        marketplaceCategorySelectionAdd(item) {
            let categoriesMappingStorage = this.getCategoriesMappingStorage();

            if (categoriesMappingStorage === null) {
                return;
            }

            if (categoriesMappingStorage[this.swCategoryId].find(
                marketplaceCategoryId => marketplaceCategoryId === item.categoryId) === undefined) {
                categoriesMappingStorage[this.swCategoryId].push(item.categoryId);
                this.$store.commit('bfCategoryMapping/setCategoriesMappingStorage', categoriesMappingStorage);
            }
        },
        /**
         * @param item
         */
        marketplaceCategoriesSelectionRemove(item) {
            let categoriesMappingStorage = this.getCategoriesMappingStorage(), keyToRemove = null;
            if (categoriesMappingStorage === null) {
                return;
            }

            keyToRemove = categoriesMappingStorage[this.swCategoryId].indexOf(item.external_channels_categories_id);
            if (keyToRemove !== -1) {
                categoriesMappingStorage[this.swCategoryId].splice(keyToRemove, 1);
                this.$store.commit('bfCategoryMapping/setCategoriesMappingStorage', categoriesMappingStorage);
            }
        },
        toString(data) {
            return data !== null ? data.toString() : null;
        }
    },

    created() {
        this.loadComponent();
    }
});
