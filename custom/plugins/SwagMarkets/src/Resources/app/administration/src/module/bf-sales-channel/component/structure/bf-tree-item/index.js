import template from './bf-tree-item.html.twig';
import './bf-tree-item.scss';

const {Component} = Shopware;

Component.register('bf-tree-item', {
    template,
    props: {
        item: {
            type: Object,
            required: true,
            default() {
                return {}
            }
        },
        value: {
            type: String,
            required: false
        }
    },
    data() {
        return {
            isLoading: false,
            currentSelected: '',
            active: this.item.active,
            opened: this.item.initialOpened
        }
    },
    computed: {
        isOpened() {
            if(this.item.initialOpened) {
                this.openTreeItem(true);
                this.getTreeItemChildren(this.item);
                this.item.initialOpened = false;
            }
            return this.opened;
        },
        styling() {
            return {
                'is--active': this.active,
                'is--no-children': this.item.childCOunt <= 0,
                'is--opened': this.isOpened,
            }
        }
    },
    updated() {
        this.componentUpdated();
    },
    created() {
    },
    methods: {
        componentUpdated() {
            if(this.item.children.length > 0) {
                this.isLoading = false;
            }
        },
        openTreeItem(opened = !this.opened) {
            this.opened = opened;
        },
        getTreeItemChildren(treeItem) {
            if(treeItem.children.length <= 0) {
                this.isLoading = true;
                this.getItems(treeItem.data.id);
            }
        },
        getItems(args) {
            return this.$parent.getItems(args);
        },
        emitCheckedItem(item) {
            this.$emit('on-change', item);
        },
        onChangeItem(item) {
            this.$emit('on-change', item);
        }
    }
})