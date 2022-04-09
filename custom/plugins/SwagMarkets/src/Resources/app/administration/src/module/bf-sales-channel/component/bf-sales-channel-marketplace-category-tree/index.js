import template from './bf-sales-channel-marketplace-category-tree.html.twig';
import './bf-sales-channel-marketplace-category-tree.scss';

const {Component, Context, Mixin} = Shopware;
const {Criteria} = Shopware.Data;
const {mapMutations, mapGetters, mapState} = Shopware.Component.getComponentHelper();

Component.register('bf-sales-channel-marketplace-category-tree', {
    template,
    inject: [
        'BfCategoryService',
        'repositoryFactory'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    data() {
        return {
            isLoading: true,
            categories: [],
            activeCategories: [],
            checkedCategories: [],
            title: this.$tc('categories.marketplace-default-title')
        }
    },
    created() {
        this.componentCreated();
    },
    computed: {
        ...mapState('bfCategoryMapping', ['selectedCategories']),
        categoryMappingRepository() {
            return this.repositoryFactory.create('bf_category_mapping');
        },
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        },
        async salesChannelType() {
            const criteria = new Criteria();
            criteria.addFilter(Criteria.equals('id', this.$route.params.id));

            return await this.salesChannelRepository.search(criteria, Context.api)
                .then((response) => {
                    return this.$route.meta.$module.getSalesChannelByTypeId(response.first().typeId)
                });
        },
    },
    watch: {
        selectedCategories(newValue, oldValue) {
            if(newValue !== null) {
                this.activeCategories = newValue.filter((item) => { return item.mapping.salesChannelId === this.$route.params.id });
            }

        },
        salesChannelType() {

            Promise.resolve(this.salesChannelType).then((result) => {
                this.title = result === 'amazon' ?
                    this.$tc('categories.amazon-marketplace-title') :
                    this.$tc('categories.ebay-marketplace-title');
            });
        }
    },
    methods: {
        ...mapMutations([
            'setSelectedCategories',
            'setShopwareCategories',
            'setMarketplaceCategories',
            'setMarketplace'
        ]),
        ...mapGetters('bfCategoryMapping', [
            'getSelectedCategories'
        ]),
        removeItem(item) {
            this.categoryMappingRepository.delete(item.mapping.id, Context.api)
                .then((result) => {
                    this.activeCategories = this.activeCategories.filter((i) => {
                        return i.item.id !== item.item.id
                    });

                    this.createNotificationSuccess({
                        title: 'Success !',
                        message: 'Category mapping was successful deleted'
                    });
                })
                .catch((error) => {
                    this.createNotificationError({
                        title: 'Error !',
                        message: 'Deleting mapping was not successful. Please try again!'
                    });
                });
        },
        componentCreated() {
            this.loadRootCategories()
                .then(() => {
                    this.isLoading = false;
                });
        },
        onChangeRoute(args) {
        },
        getTreeItems(item) {
            return this.loadChildCategories(item);
        },
        searchTreeItems(item) {
            this.isLoading = true;
            this.categories = [];

            this.loadRootCategories(item)
                .then(() => {
                    this.isLoading = false;
                });
        },
        checkItem(item) {
            if (item.checked) {
                this.checkedCategories.push(item);
            }
            if (this.activeCategories !== null && this.activeCategories.length >= 1) {
                this.isDisabled = true;
            }
            if (!item.checked) {
                this.checkedCategories = this.checkedCategories.filter((value, index, arr) => {
                    return value.id != item.id;
                })
            }

            this.$store.commit('bfCategoryMapping/setMarketplaceCategories', this.checkedCategories);
        },
        async loadRootCategories(searchText) {
            let categories = [];

            if (searchText !== undefined && searchText.length > 0) {
                categories = this.BfCategoryService.findCategoryByName(searchText);
            } else {
                categories = this.BfCategoryService.getRootCategories();
            }

            return categories.then((categories) => {
                this.addCategories(categories);
            });
        },
        async loadChildCategories(parentId) {
            return this.BfCategoryService
                .getChildCategories(parentId)
                .then((categories) => {
                    this.addCategories(categories);
                });
        },
        addCategories(categories) {
            categories.forEach((category) => {
                this.categories.push({
                    data: category,
                    id: category.id,
                    categoryId: category.external_channels_categories_id,
                    name: category.name,
                    childCount: category.children,
                    parentId: category.parent_id,
                    afterId: category.id - 1
                });
            });
        },
    }
});
