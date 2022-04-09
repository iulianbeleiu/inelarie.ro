import template from './bf-segment-category-tree.html.twig';

const {Component} = Shopware;
const {sort, debounce} = Shopware.Utils;

Component.register('bf-segment-category-tree', {
    template,
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
        hasNoItems() {
            return this.items.length === 1 && this.items[0] && this.items[0].isDeleted;
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
        getTreeItems(parentId) {
            const treeItems = [];
            this.items.forEach((item) => {
                if(parentId === null && typeof this.items.find(i => i.id === item.parentId) !== 'undefined') {
                    this.isLoading = false;
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
            this.$emit('on-change', item);
        },
        searchItems: debounce(function debouncedTreeSearch() {
            this.$emit('search-tree-items', this.currentTreeSearch);
        }, 600)
    }
});
