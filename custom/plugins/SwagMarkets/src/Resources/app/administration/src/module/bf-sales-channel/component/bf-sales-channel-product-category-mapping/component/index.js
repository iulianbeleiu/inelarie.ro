const { Component } = Shopware;
const { debounce, sort } = Shopware.Utils;

Component.extend('bf-product-category-mapping-tree', 'sw-tree', {
    methods: {
        getTreeItems(parentId) {
            const treeItems = [];

            this.items.forEach((item) => {
                if (item.isDeleted) {
                    return;
                }

                if (parentId === null && typeof this.items.find(i => i.id === item.parentId) !== 'undefined') {
                    return;
                }

                if (parentId !== null && item[this.parentProperty] !== parentId) {
                    return;
                }

                item.id = item.id.toString();

                treeItems.push({
                    data: item,
                    id: item.id.toString(),
                    parentId: parentId,
                    childCount: item[this.childCountProperty],
                    children: this.getTreeItems(item.id),
                    initialOpened: false,
                    active: false,
                    checked: !!this.checkItemsInitial,
                    [this.afterIdProperty]: item[this.afterIdProperty]
                });
            });

            return sort.afterSort(treeItems, this.afterIdProperty);
        }
    }
});
