import template from './bf-bookable-contracts.html.twig';
import tableRows from './bf-bookable-contracts-table-rows.json';

import './bf-bookable-contracts.scss';

const { Component } = Shopware;

Component.register('bf-bookable-contracts', {
    template,
    props: {
        bookableContracts: {
            type: Array,
            required: true
        },
        currentContract: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            tableData: [],
            acceptTermsAndConditions: false,
            acceptSubProcessor: false
        }
    },
    created() {
        this.prepareTableContractsData();
    },
    methods: {
        openTermsAndConditions() {
            window.open(this.$tc('bf-sales-channel.contractModal.table.contractTermsAndConditionsLink'), '_blank');
        },
        openPermissionModal() {
            this.$emit('openPermissionModal');
        },
        openSubProcessorModal() {
            this.$emit('openSubProcessorModal');
        },
        prepareTableContractsData() {
            this.tableData.push(
                this.feelContractFees(),
                this.feelContractTransactions(),
                this.feelContractLimits()
            );

            for (let key in tableRows) {
                if (tableRows.hasOwnProperty(key)) {
                    this.tableData.push(this.feelContractCheckMarksRow(tableRows[key]));
                }
            }
        },
        feelContractFees() {
            let row = [
                this.$tc('bf-sales-channel.contractModal.table.feeLabel'),
                this.$tc('bf-sales-channel.contractModal.table.feeHelpText')
            ];

            this.bookableContracts.forEach((contract) => {
                let price = new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'})
                    .format(contract.items[0].price);

                row.push(price);
            });

            return row;
        },
        feelContractTransactions() {
            let row = [
                this.$tc('bf-sales-channel.contractModal.table.transactionsLabel'),
                this.$tc('bf-sales-channel.contractModal.table.transactionsHelpText')
            ];

            this.bookableContracts.forEach((contract) => {
                row.push(contract.items[0].included + '');
            });

            return row;
        },
        feelContractLimits() {
            let row = [
                this.$tc('bf-sales-channel.contractModal.table.limitsLabel'),
                this.$tc('bf-sales-channel.contractModal.table.limitsHelpText')
            ];

            this.bookableContracts.forEach((contract) => {
                let limit = contract.items[0].limit;

                if (limit < 0) {
                    limit = this.$tc('bf-sales-channel.contractModal.table.withoutLimitText');
                }

                row.push(limit + '');
            });

            return row;
        },
        feelContractCheckMarksRow(tableRow) {
            let row = [
                this.$tc('bf-sales-channel.contractModal.table.' + tableRow[0]),
                this.$tc('bf-sales-channel.contractModal.table.' + tableRow[1])
            ];

            let columnNumber = 2;

            this.bookableContracts.forEach(() => {
                row.push(tableRow[columnNumber]);
                columnNumber++;
            });

            return row;
        }
    }
});
