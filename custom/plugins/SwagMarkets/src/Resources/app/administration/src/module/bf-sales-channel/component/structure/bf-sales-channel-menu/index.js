const {Component} = Shopware;

Component.override('sw-sales-channel-menu', {
    name: 'bf-sales-channel-menu',
    computed: {
        buildMenuTree(){
            const menuItems = this.$super('buildMenuTree');

            const salesChannelIdsToManufacturers = {};
            this.salesChannels.forEach((salesChannel) => {
                if (
                    salesChannel.type.id === '26a9ece25bd14b288b30c3d71e667d2c' ||
                    salesChannel.type.id === '7ff39608fed04e4bbcc62710b7223966'
                ) {
                    salesChannelIdsToManufacturers[salesChannel.id] = salesChannel.type.manufacturer;
                }
            });

            menuItems.forEach((menuItem) => {
                if (Object.keys(salesChannelIdsToManufacturers).includes(menuItem.id)) {
                    menuItem.path = 'bf.sales.channel.detail';
                    menuItem.color = '#8a8f98';
                    menuItem.manufacturer = salesChannelIdsToManufacturers[menuItem.id];
                }
            });

            return menuItems;
        }
    }
});
