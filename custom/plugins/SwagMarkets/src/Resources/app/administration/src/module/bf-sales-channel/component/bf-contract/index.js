import template from './bf-contract.html.twig';

import './bf-contract.scss';

const { Component, Mixin } = Shopware;
const {Criteria} = Shopware.Data;

Component.register('bf-contract', {
    template,
    inject: [
        'repositoryFactory',
        'bfContractService'
    ],
    mixins: [
        Mixin.getByName('notification')
    ],
    props: {
        salesChannel: {
            type: Boolean,
            default: false
        },
        isLoading: {
            type: Boolean,
            default: false
        },
        clientExists: {
            type: Boolean,
            default: false
        },
        currentContract: {
            type: Object,
            required: true
        },
        bookableContracts: {
            type: Array,
            default: []
        },
        userAuthorised: {
            type: Boolean,
            required: true,
            default: false
        },
        subProcessorData: {
            type: String,
            required: true,
            default: ''
        }
    },
    data() {
        return {
            showContractModal: false,
            showContractAgbModal: false,
            showContractCancelModal: false,
            selectedContract: {},
            confirmedAgb: false,
            confirmedPayment: false,
            currentLocale: 'en',
            totalProductsByChannel: [],
            showLoginModal: false,
            showPermissions: false,
            showSubProcessor: false
        }
    },
    computed: {
        productRepository() {
            return this.repositoryFactory.create('product');
        },
        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        }
    },
    methods: {
        formatDate(date) {
            let originDate = new Date(date);

            return originDate.getDate() + '.' + originDate.getMonth() + '.' + originDate.getFullYear();
        },
        openContractModal() {
            if (this.userAuthorised) {
                this.showContractModal = true;
                this.getCountProductsFromBfChannels();
            } else {
                this.showLoginModal = true;
            }
        },
        closeLoginModal() {
            this.showLoginModal = false;
            this.$emit('refreshContractData');
        },
        openContractAgbModal() {
            this.showContractAgbModal = true;
            this.checkCurrentLocale();
        },
        openContractCancelModal() {
            this.showContractCancelModal = true;
        },
        openPermissionModal() {
            this.onCloseContractModal();
            this.showPermissions = true;
        },
        closePermissionsModal(goTo) {
            if (goTo === 'subProcessor') {
                this.openSubProcessorModal();
            } else {
                this.openContractModal();
            }

            this.showPermissions = false;
        },
        openSubProcessorModal() {
            this.onCloseContractModal();
            this.showSubProcessor = true;
        },
        closeSubProcessorModal() {
            this.openContractModal();
            this.showSubProcessor = false;
        },
        onCloseContractModal() {
            this.showContractModal = false;
        },
        onCloseContractAgbModal() {
            this.showContractAgbModal = false;
            this.clearCheckboxes();
        },
        onCloseContractCancelModal() {
            this.showContractCancelModal = false;
            this.clearCheckboxes();
        },
        clearCheckboxes() {
            this.confirmedAgb = false;
            this.confirmedPayment = false;
            this.showPermissions = false;
            this.showSubProcessor = false;
        },
        onRemoveContract() {
            this.bfContractService.cancelContract(this.currentContract.identifier)
                .then(() => {
                    this.createNotificationSuccess({
                        title: this.$tc('bf-sales-channel.contractModal.notification.title'),
                        message: this.$tc('bf-sales-channel.contractModal.notification.canceledMessage')
                    });

                    this.$emit('onCancelContract');

                    this.clearCheckboxes();
                    this.onCloseContractCancelModal();
                })
                .catch((error) => {
                    this.handleSbpError(error);
                });
        },
        showAgbDialog(selectedContract, type) {
            this.selectedContract = selectedContract;

            this.onCloseContractModal();

            if (type === 'change') {
                this.setNewContract();
            } else {
                let canCancelContract = true;

                this.totalProductsByChannel.forEach((salesChannel, index) => {
                    if (salesChannel.productsCount > 0) {
                        canCancelContract = false;
                    }
                });

                if (canCancelContract) {
                    this.openContractCancelModal();
                } else {
                    this.createNotificationError({
                        title: this.$tc('bf-sales-channel.contractModal.notification.errorTitle'),
                        message: this.$tc(
                            'bf-sales-channel.contractModal.notification.errorTooMuchProductsAssigned',
                            selectedContract,
                            {
                                contractName: selectedContract.name
                            }
                        )
                    });
                }
            }
        },
        setNewContract() {
            let selectedContractLimit = this.selectedContract.items[0].limit;

            if (selectedContractLimit > 0) {
                this.totalProductsByChannel.forEach((salesChannel, index) => {
                    if (salesChannel.productsCount > selectedContractLimit) {
                        this.createNotificationError({
                            title: this.$tc('bf-sales-channel.contractModal.notification.errorTitle'),
                            message: this.$tc(
                                'bf-sales-channel.contractModal.notification.errorSkuLimitAchieved',
                                selectedContractLimit,
                                {
                                    limit: selectedContractLimit,
                                    name: salesChannel.name
                                }
                            )
                        });

                        this.clearCheckboxes();
                        return;
                    }
                });
            }

            this.bfContractService.setContract(this.selectedContract.name)
                .then((response) => {
                    this.createNotificationSuccess({
                        title: this.$tc('bf-sales-channel.contractModal.notification.title'),
                        message: this.$tc('bf-sales-channel.contractModal.notification.changedMessage')
                    });

                    let currentContract = response.data;
                    this.bfContractService.setUserShopId(currentContract.customerIdentifier)
                        .then(() => {
                            this.$emit('onSetNewContract', currentContract);
                        });

                    this.clearCheckboxes();
                })
                .catch((error) => {
                    this.handleSbpError(error);
                });
        },
        checkCurrentLocale() {
            let currentIsoLocale = localStorage.getItem('sw-admin-locale');

            if (currentIsoLocale !== null) {
                this.currentLocale = currentIsoLocale.split('-')[0]
            }
        },
        getCountProductsFromBfChannels() {
            const criteria = new Criteria();

            criteria.addAssociation('type');

            this.salesChannelRepository.search(criteria, Shopware.Context.api).then((salesChannels) => {
                salesChannels.forEach((item, index) => {
                    if (item.type.manufacturer === 'brickfox GmbH') {
                        this.getProductsBySalesChannel(item);
                    }
                });
            }).catch((error) => {
                console.log(error);
            });
        },
        getProductsBySalesChannel(salesChannel) {
            const productCriteria = new Criteria();

            productCriteria.addFilter(Criteria.equals('product.parentId', null));
            productCriteria.addFilter(Criteria.equals('product.visibilities.salesChannelId', salesChannel.id));

            this.productRepository.search(productCriteria, Shopware.Context.api)
                .then((products) => {
                    this.totalProductsByChannel.push({
                        name: salesChannel.name,
                        productsCount: products.total
                    });
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
});
