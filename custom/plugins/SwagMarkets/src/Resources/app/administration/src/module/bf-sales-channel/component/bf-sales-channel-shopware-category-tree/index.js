import template from './bf-sales-channel-shopware-category-tree.html.twig';

import '../structure/bf-tree';
import '../structure/bf-tree-item';

const {Component, Context, Collection, State} = Shopware;
const {Criteria} = Shopware.Data;
const {mapMutations, mapGetters} = Shopware.Component.getComponentHelper();

Component.register('bf-sales-channel-shopware-category-tree', {
    template,
    inject: [
        'repositoryFactory'
    ],
    data() {
        return {
            loadedCategories: [],
            loadedParentIds: [],
            translationContext: 'sw-category',
            isLoadingInitialData: true,
            showDeleteModal: false,
            selectedItem: ''
        }
    },
    computed: {
        categoryRepository() {
            return this.repositoryFactory.create('category');
        },
        categories() {
            return Object.values(this.loadedCategories);
        }
    },
    created() {
        this.componentCreated();
    },
    methods: {
        ...mapMutations([
            'setSelectedCategories',
            'setShopwareCategories',
            'setMarketplaceCategories',
            'setMarketplace'
        ]),
        ...mapGetters('bfCategoryMapping', [
            'getSelectedCategories',
            'getMarketplaceCategories'
        ]),
        componentCreated() {
            this.loadRootCategories()
                .then(() => {
                    this.isLoadingInitialData = false;
                });
        },
        onGetTreeItems(parentId) {
            if (this.loadedParentIds.includes(parentId)) {
                return Promise.resolve();
            }

            this.loadedParentIds.push(parentId);

            const criteria = new Criteria(1, 500);
            criteria.addFilter(Criteria.equals('parentId', parentId));

            return this.categoryRepository.search(criteria, Context.api)
                .then((children) => {
                    this.addCategories(children);
                })
                .catch(() => {
                    this.loadedParentIds = this.loadedParentIds.filter((id) => {
                        return id !== parentId;
                    });
                });
        },
        onChangeItem(item) {
            this.$store.commit('bfCategoryMapping/setShopwareCategories', item);
            this.selectedItem = this.getSelectedCategories();
        },
        loadRootCategories() {
            const criteria = new Criteria(1, 500);
            criteria.addFilter(Criteria.equals('parentId', null));

            return this.categoryRepository
                .search(criteria, Context.api)
                .then((categories) => {
                    this.addCategories(categories, true);
                });
        },
        searchTreeItems(searchText) {
            this.loadedCategories = [];
            this.loadedParentIds = [];

            if (searchText === '') {
                return this.componentCreated();
            } else {
                const criteria = new Criteria(1, 500);
                criteria.addFilter(Criteria.contains('name', searchText));

                return this.categoryRepository
                    .search(criteria, Context.api)
                    .then((categories) => {
                        this.addCategories(categories, true);
                    });
            }
        },
        addCategories(categories, parentId = null, root = false) {
            categories.forEach((category) => {
                this.loadedCategories[category.id] = category;
            });

            this.loadedCategories = {...this.loadedCategories};
        }
    }
})
;
