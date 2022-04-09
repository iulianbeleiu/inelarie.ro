const { Component } = Shopware;
const { Criteria } = Shopware.Data;

Component.override('sw-sales-channel-modal', {
    name: 'bf-sales-channel-modal',
    methods: {
        onAddChannel(id) {
            if (id === '26a9ece25bd14b288b30c3d71e667d2c' || id === '7ff39608fed04e4bbcc62710b7223966') {
                this.$router.push({ name: 'bf.sales.channel.create', params: { typeId: id } });
            } else if(id) {
                this.$super('onAddChannel', id);
            }

            this.onCloseModal();
        }
    }
});
