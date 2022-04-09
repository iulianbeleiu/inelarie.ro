import template from './bf-sales-channel-shopware-segment-dropdown.html.twig';
import './bf-sales-channel-shopware-segment-dropdown.scss';

const { Component } = Shopware;

Component.register('bf-sales-channel-amazon-segment-dropdown', {
    template,
    inject: [
        'BfCategoryService'
    ],
    props: {
        clientExists: {
            type: Boolean,
            required: true
        },
        clientInProgress: {
            type: Boolean,
            required: true
        },
        currentContractName: {
            type: String,
            required: ''
        }
    },
    data() {
        return {
            allProductsSegments: [],
            productsTypes: [],
            selectedSegment: '',
            selectedType: '',
            productSegmentAndType: null
        }
    },
    created() {
        this.getAllSegments();

        if (this.selectedSegment) {
            this.getSegmentTypes()
        }
    },
    computed: {
        currentCategorySegment() {
            return this.prepareCategorySegmentSaveObject();
        },
        isDisabled() {
            return !this.clientExists
                || this.clientInProgress
                || this.currentContractName === '';
        }
    },
    methods: {
        prepareCategorySegmentSaveObject() {
            if (!this.selectedSegment) {
                this.selectedSegment = '-';
            }

            if (!this.selectedType) {
                this.selectedType = '-';
            }

            return {
                productSegmentsName: this.selectedSegment,
                productTypesName: this.selectedType
            }
        },
        setSegment(segmentAndType, segmentKey, productTypeKey) {
            this.productSegmentAndType = segmentAndType;
            this.selectedSegment = segmentAndType[segmentKey];
            this.selectedType = segmentAndType[productTypeKey];
            this.feelSegmentTypesField();
        },
        feelSegmentTypesField() {
            if (this.selectedSegment && this.selectedSegment !== '-') {
                this.getSegmentTypes();
            } else {
                this.productsTypes = [];
            }
        },
        getSegmentTypes() {
            this.$emit('onStartLoading');

            this.BfCategoryService.getSegmentsTypes(this.selectedSegment)
                .then((types) => {
                    this.productsTypes = [];

                    types.forEach((item, key) => {
                        this.productsTypes.push({
                            value: item.productTypesName,
                            label: item.productTypesName
                        });
                    });

                    this.$emit('onStopLoading');
                })
                .catch((typeError) => {
                    console.log(typeError);

                    this.$emit('onStopLoading');
                });
        },
        onSelectSegment() {
            this.feelSegmentTypesField();
            this.$emit('onSetCurrentSegment');
        },
        onSelectType(item) {
            this.$emit('onSetCurrentSegment');
        },
        getAllSegments() {
            this.BfCategoryService.getSegments()
                .then((response) => {
                    response.forEach((item, key) => {
                        this.allProductsSegments.push({
                            value: item.productSegmentsName,
                            label: item.productSegmentsName
                        });
                    });

                    this.$emit('onStopLoading');
                })
                .catch((error) => {
                    console.log(error);
                    this.$emit('onStopLoading');
                });
        },
        clearMappedData() {
            this.productsTypes = [];
            this.selectedSegment = '';
            this.selectedType = '';
        }
    }
});
