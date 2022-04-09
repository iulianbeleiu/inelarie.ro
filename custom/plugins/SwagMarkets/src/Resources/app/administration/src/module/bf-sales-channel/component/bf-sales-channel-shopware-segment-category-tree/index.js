import template from './bf-sales-channel-shopware-segment-category-tree.html.twig';

import '../structure/bf-segment-category-tree';
import '../structure/bf-segment-category-tree-item';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-sales-channel-shopware-segment-category-tree', {
    template,
    inject: [
        'repositoryFactory'
    ],
    data() {
        return {
            loadedCategories: [],
            loadedParentIds: [],
            isLoadingInitialData: true
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
        onChangeCategory(item) {
            this.$emit('onSelectCategory', item);
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
});
