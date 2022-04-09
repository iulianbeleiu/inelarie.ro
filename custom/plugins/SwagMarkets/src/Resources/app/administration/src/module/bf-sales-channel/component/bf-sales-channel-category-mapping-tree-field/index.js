import template from './bf-sales-channel-category-mapping-tree-field.html.twig';

import './bf-sales-channel-category-mapping-tree-field.scss';
import '../bf-sales-channel-product-category-mapping/component';

const {Component} = Shopware;
const {sort} = Shopware.Utils;

Component.extend('bf-sales-channel-category-mapping-tree-field', 'sw-category-tree-field', {
    template,
    inject: [
        'BfCategoryService'
    ],
    props: {
        marketplaceCategories: {
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
            created: 0,
            tagLimit: true,
        }
    },

    watch: {
        term: {
            handler(newTerm){
                if (newTerm.length === 0) {
                    this.categories = [];
                    this.getTreeItems();
                }
            }
        }
    },

    computed: {
        selectedCategoriesPathIds() {
            return this.categoriesCollection.reduce((acc, item) => {
                // add parent id to accumulator
                return [...acc, ...this.marketplaceCategories.categoryTree];
            }, []);
        },
        visibleTags() {
            return this.tagLimit ? this.categoriesCollection.slice(0, 2) : this.categoriesCollection;
        },
    },
    created() {
        this.BfCategoryService.setSalesChannelId(this.$route.params.id);
    },
    methods: {
        getTreeItems(parentId = null) {
            this.BfCategoryService.getCategories(parentId).then((categories) => {
                if (parentId === null) {
                    categories.forEach((category) => {
                        category.id = category.id.toString()
                        this.categories.push({
                            data: category,
                            isDeleted: false,
                            id: category.id,
                            categoryId: category.external_channels_categories_id,
                            translated: {name: category.name},
                            childCount: category.children,
                            parentId: category.parent_id,
                            parentVersionId: category.parent_id,
                            children: [],
                            afterCategoryId: parentId,
                            afterCategoryVersionId: parentId,
                            name: category.name,
                            breadCrumb: this.splitBreadCrumb(category.breadCrumb)
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
                        parentId: category.parent_id.toString(),
                        afterCategoryId: parentId.toString(),
                        name: category.name,
                        breadcrumb: this.splitBreadCrumb(category.breadCrumb)
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
                            name: category.name,
                        },
                        childCount: category.children,
                        parentId: category.parent_id,
                        afterCategoryId: category.parent_id,
                        breadcrumb: this.splitBreadCrumb(category.breadCrumb)
                    });
                });

                return this.categories;
            });
        },
        splitBreadCrumb(breadCrumb) {
            return breadCrumb.split(" > ")
        }
    }
})
