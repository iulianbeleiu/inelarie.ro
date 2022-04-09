import template from './bf-sales-channel-mapping.html.twig';
import BfSalesChannelService from "../../../../service/bf-sales-channel.service";

const {Component} = Shopware;
const {mapGetters, mapMutations} = Shopware.Component.getComponentHelper();

Component.override('bf-sales-channel-detail', {
    name: 'bf-sales-channel-mapping',
    template,
    inject: [
        'BfSalesChannelService'
    ],
    data() {
        return {
            categoriesReloadTriggerEvent: false
        }
    },
    computed: {
        salesChannelTypeId() {
            return this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId);
        }
    },
    watch: {
        '$route.params.id'() {
            this.onSalesChannelChange();
        }
    },
    methods: {
        ...mapMutations([
            'setCategoriesMappingStorage'
        ]),
        ...mapGetters('bfCategoryMapping', [
            'getCategoriesMappingStorage'
        ]),
        /**
         * @returns {Promise<void>}
         */
        async storeCategoriesMapping(){
            let me = this;
            const objects = Object.entries(this.getCategoriesMappingStorage());

            for (const categoryMapping of objects) {
                await me.BfCategoryService.saveCategoryMapping(categoryMapping[0], categoryMapping[1], me.salesChannelTypeId);
            }

            this.categoriesReloadTriggerEvent = !this.categoriesReloadTriggerEvent;
        },
        onSalesChannelChange() {
            this.BfSalesChannelService.setSalesChannelId(this.$route.params.id);
        },
    },
    created() {
        this.onSalesChannelChange();
    },
});
