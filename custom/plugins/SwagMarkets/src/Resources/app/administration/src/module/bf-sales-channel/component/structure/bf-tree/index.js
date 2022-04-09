import template from './bf-tree.html.twig';
import './bf-tree.scss';

const {Component, Context} = Shopware;
const {Criteria} = Shopware.Data;
const {debounce, sort} = Shopware.Utils;
const {mapMutations} = Shopware.Component.getComponentHelper();

Component.register('bf-tree', {
    template,
    inject:[
        'repositoryFactory',
        'BfCategoryService'
    ],
    props: {
        items: {
            type: Array,
            required: true
        },
        parentProperty: {
            type: String,
            required: false,
            default: 'parentId'
        },
        afterIdProperty: {
            type: String,
            required: false,
            default: 'afterCategoryId'
        },
        rootParentId: {
            type: String,
            required: false,
            default: null
        },
        searchable: {
            type: Boolean,
            required: false,
            default: true
        },
        title: {
            type: String,
            required: false,
            default: ''
        }
    },

    data() {
        return {
            isLoading: false,
            treeItems:[],
            currentTreeSearch: null,
        }
    },
    computed: {
        isSearched() {
            return this.currentTreeSearch !== null && this.currentTreeSearch.length > 0;
        },
        hasNoItems() {
            if(this.items.length === 1 && this.items[0] && this.items[0].isDeleted) {
                return true;
            }
            return false;
        },
        categoryMappingRepository() {
            return this.repositoryFactory.create('bf_category_mapping');
        }
    },
    watch: {
        items: {
            immediate: true,
            handler() {
                this.treeItems = this.getTreeItems(this.isSearched ? null : this.rootParentId);
            }
        }
    },
    created() {
        this.isLoading = true;
    },
    methods: {
        ...mapMutations('bfCategoryMapping', [
            'setSelectedCategories'
        ]),
        getTreeItems(parentId) {
            const treeItems = [];
            this.items.forEach((item) => {
                if(parentId === null && typeof this.items.find(i => i.id === item.parentId) !== 'undefined') {
                    return;
                }

                if(parentId !== null && item.parentId !== parentId) {
                    return;
                }

                treeItems.push({
                    data: item,
                    id: item.id,
                    parentId: parentId,
                    childCount: item.childCount,
                    children: this.getTreeItems(item.id),
                    initialOpened: false,
                    active: false,
                    name: item.name,
                    [this.afterIdProperty]: item[this.afterIdProperty]
                });
            });

            this.isLoading = false;
            return sort.afterSort(treeItems, this.afterIdProperty);
        },
        getItems(parentId = this.rootParentId, searchTerm = null) {
            this.$emit('get-tree-items', parentId, searchTerm);
        },
        onChange(item) {
            const criteria = new Criteria(1, 500);

            criteria.addFilter(new Criteria.equals('categoryId', item));

            this.categoryMappingRepository.search(criteria, Context.api)
                .then((categories) => {
                    if(categories.length <= 0) {
                        this.$store.commit('bfCategoryMapping/setSelectedCategories', null);
                        return;
                    }
                    let ids = [];
                    categories.forEach((category) => {
                        ids.push(category.bfCategoryId);
                    });

                    this.BfCategoryService.findCategoriesByIds(ids).then((result) => {
                        let items = [];
                        result.forEach((item) => {
                            items.push({
                                item,
                                mapping: categories.find(i => i.bfCategoryId == item.id)
                            });
                        });

                        this.$store.commit('bfCategoryMapping/setSelectedCategories', items);
                    });
                });

            this.$emit('on-change', item);
        },
        searchItems: debounce(function debouncedTreeSearch() {
            this.$emit('search-tree-items', this.currentTreeSearch);
        }, 600)
    }
});
