Shopware.State.registerModule('bfCategoryMapping', {
    namespaced: true,
    state: {
        selectedCategories: null,
        shopwareCategories: null,
        marketplaceCategories: null,
        marketplace: null,
        categoriesMappingStorage: {}
    },
    mutations: {
        setSelectedCategories(state, selectedCategories) {
            state.selectedCategories = selectedCategories;
        },
        setShopwareCategories(state, shopwareCategories) {
            state.shopwareCategories = shopwareCategories;
        },
        setMarketplaceCategories(state, marketplaceCategories) {
            state.marketplaceCategories = marketplaceCategories;
        },
        setMarketplace(state, marketplace) {
            state.marketplace = marketplace;
        },
        setCategoriesMappingStorage(state, categoriesMappingStorage) {
            state.categoriesMappingStorage = categoriesMappingStorage;
        }
    },
    actions: {
    },

    getters: {
        getSelectedCategories: (state) => {
            return state.selectedCategories;
        },
        getShopwareCategories: (state) => {
            return state.shopwareCategories;
        },
        getMarketplaceCategories: (state) => {
            return state.marketplaceCategories;
        },
        getMarketplace: (state) => {
            return state.marketplace;
        },
        getCategoriesMappingStorage: (state) => {
            return state.categoriesMappingStorage;
        }
    }
});
