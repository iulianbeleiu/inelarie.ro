import template from './bf-sales-channel-create.html.twig';

const {Component, StateDeprecated, Context} = Shopware;
const {Criteria} = Shopware.Data;

const utils = Shopware.Utils;

Component.extend('bf-sales-channel-create', 'bf-sales-channel-detail', {
    template,
    inject: [
        'repositoryFactory'
    ],
    data() {
        return {
            navigationCategoryId: null
        }
    },
    beforeRouteEnter(to, from, next) {
        if (to.name.includes('bf.sales.channel.create') && !to.params.id) {
            to.params.id = utils.createId();
        }
        next();
    },
    computed: {
        languageStore() {
            return StateDeprecated.getStore('language');
        },
        categoryRepository() {
            return this.repositoryFactory.create('category');
        }
    },
    methods: {
        createdComponent() {
            if (!this.$route.params.typeId) {
                return;
            }

            if (!Shopware.State.getters['context/isSystemDefaultLanguage']) {
                Shopware.State.commit('context/resetLanguageToDefault');
            }

            this.salesChannel = this.salesChannelRepository.create(Context.api);
            this.salesChannel.typeId = this.$route.params.typeId;
            this.salesChannel.type = this.$route.meta.$module.getSalesChannelByTypeId(this.salesChannel.typeId);
            this.salesChannel.active = false;

            this.getMainCategoryId()

            this.$super('createdComponent');
        },
        saveFinish() {
            this.isSaveSuccessful = false;
            this.$router.push({name: 'bf.sales.channel.detail', params: {id: this.salesChannel.id}});
        },
        onSave() {
            this.$super('onSave');
        },
        getMainCategoryId() {
            const criteria = new Criteria(1, 1);
            criteria.addFilter(Criteria.equals('level', 1));

            this.categoryRepository.search(criteria, Context.api).then((categories) => {
                this.salesChannel.navigationCategoryId = categories.first().id;
            });
        }
    }
});
