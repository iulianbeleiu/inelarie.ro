const {Component} = Shopware;

Component.extend('bf-collapse', 'sw-collapse', {
    props: {
        expandOnLoading: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    data() {
        return {
            expanded: this.expandOnLoading,
        };
    },

    methods: {
        collapseItem() {
            this.expanded = !this.expanded;
            this.$emit('item-expand', this.expanded);
        }
    }
});
