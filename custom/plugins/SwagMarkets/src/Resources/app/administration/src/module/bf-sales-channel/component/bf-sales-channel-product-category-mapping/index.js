import template from './bf-sales-channel-product-category-mapping.html.twig';

import './component';

const {Component} = Shopware;
const {EntityCollection} = Shopware.Data;
const {debounce, sort} = Shopware.Utils;

Component.extend('bf-sales-channel-product-category-mapping', 'sw-category-tree-field', {
    template,
    inject: [
        'BfCategoryService'
    ],
    props: {
        product: {
            type: Object,
        },

        parentProperty: {
            type: String,
            required: false,
            default: 'parent_id'
        }
    },
    data() {
        return {
            isLoading: false,
            created: 0
        }
    },
    computed: {
        selectedCategoriesPathIds() {
            return this.categoriesCollection.reduce((acc, item) => {
                // add parent id to accumulator
                return [...acc, ...this.product.categoryTree];
            }, []);
        }
    },
    methods: {
        getTreeItems(parentId = null) {
            this.BfCategoryService.getCategories(parentId).then((categories) => {
                if (parentId === null) {
                    categories.forEach((category) => {
                        category.id = category.id.toString()
                        this.categories.push({
                            data: category,
                            // isDeleted: false,
                            id: category.id.toString(),
                            categoryId: category.external_channels_categories_id,
                            translated: {name: category.name},
                            childCount: category.children,
                            parentId: category.parent_id,
                            parentVersionId: category.parent_id,
                            children: [],
                            afterCategoryId: parentId,
                            afterCategoryVersionId: parentId,
                            name: category.name,
                        })
                    });
                    this.isFetching = false;
                    return Promise.resolve();
                }

                categories.forEach((category) => {
                    this.categories.push({
                        data: category,
                        isDeleted: false,
                        id: category.id.toString(),
                        categoryId: category.external_channels_categories_id,
                        translated: { name: category.name },
                        childCount: category.children,
                        parentId: category.parent_id === null ? category.parent_id : category.parent_id.toString(),
                        afterCategoryId: parentId === null ? parentId : parentId.toString(),
                        name: category.name
                    });

                    this.isFetching = false;
                    return Promise.resolve();
                });
            }).catch((error) => {
                console.log(error);
            });
        },
        searchCategories(term) {
            return this.BfCategoryService.findCategoryByName(term).then((categories) => {
                this.categories = [];

                categories.forEach((category) => {
                    category.id = category.id.toString();

                    this.categories.push({
                        data: category,
                        id: category.id.toString(),
                        categoryId: category.external_channels_categories_id,
                        name: category.name,
                        translated: {
                            name: category.breadCrumb,
                        },
                        childCount: category.children,
                        parentId: category.parent_id,
                        afterCategoryId: category.parent_id
                    });
                });

                return this.categories;
            });
        },
    },
    created() {
        this.BfCategoryService.setSalesChannelId(this.$route.params.id);
    }
})
