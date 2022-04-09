const {Application} = Shopware;

class AttributesMappingUtils {

    /**
     * @param propertyService
     * @returns {Promise<[]>}
     */
    async loadSwagMarketsAttributesMapping(propertyService) {
        let swagMarketsAttributesMappingData = [];
        await propertyService.loadAttributeMappingData().then((response) => {
            if (!response.success) {
                return;
            }
            swagMarketsAttributesMappingData = response.data;
        });

        return swagMarketsAttributesMappingData;
    }

    /**
     * @param item
     * @param type
     * @returns {Promise<null>}
     */
    async getMappedErpSystemsList(item, type = 'PROPERTIES_TO_IMPORT_AS_ATTRIBUTES') {
        let erpSystemsMappingData = null;

        if (item !== null && item !== undefined && item.success) {
            item.data.forEach(function (itemData) {
                if (itemData.configurationKey === type) {
                    erpSystemsMappingData = itemData.configurationValue;
                }
            });

            erpSystemsMappingData = this.extractMappedErpSystemsEntries(erpSystemsMappingData);
        }

        return erpSystemsMappingData;
    }

    /**
     * @param data
     * @returns {[]}
     */
    extractMappedErpSystemsEntries(data) {
        let result = [];

        if (data !== null && typeof data === 'string') {
            let found = data.split(',');

            if (found !== null) {
                result = found;
            }
        }

        return result;
    }

    /**
     * @param item
     * @param swagMarketsErpSystemsAttributesMappingData
     * @param swFieldName
     */
    saveInlineEdit(item, swagMarketsErpSystemsAttributesMappingData, swFieldName = 'swProperty') {
        if (swagMarketsErpSystemsAttributesMappingData.length === 0 ||
            this.erpSystemMappingExists(swagMarketsErpSystemsAttributesMappingData, item.id) === undefined) {
            swagMarketsErpSystemsAttributesMappingData.push(item[swFieldName] + ' ##' + item.id + '##');
        }
        return swagMarketsErpSystemsAttributesMappingData;
    }

    /**
     * @param propertyService
     * @param swagMarketsErpSystemsAttributesMappingData
     * @param type
     */
    transferErpSystemsConfigurations(propertyService, swagMarketsErpSystemsAttributesMappingData, type) {
        let configurationValue = '';

        swagMarketsErpSystemsAttributesMappingData.forEach(function (data, idx, array) {
            if (idx === array.length - 1) {
                configurationValue += data;
            } else {
                configurationValue += data + ',';
            }
        });

        propertyService.storePropertyData(type, configurationValue).then(() => {
        }).catch((error) => {
            console.log(error);
        })
    }

    /**
     * @param id
     * @param translations
     * @param propertyService
     * @returns {Promise<null>}
     */
    async upsertProductsAttributesResource(id, translations, propertyService) {
        let productsAttributesId = null;

        await propertyService.loadBfAttributeDataV2({query: {externProductsAttributesId: id}}).then(async (response) => {
            if (!response.success) {
                return;
            }

            if (response.data.length === 0) {
                await propertyService.createProductsAttributes(id, translations).then((productsAttributesResponse) => {
                    if (!productsAttributesResponse.success) {
                        return;
                    }
                    productsAttributesId = productsAttributesResponse.data.productsAttributesId;
                });
            }

            if (response.data.length === 1) {
                await propertyService.updateProductsAttributes(response.data[0].productsAttributesId, translations).then((productsAttributesResponse) => {
                    if (!productsAttributesResponse.success) {
                        return;
                    }
                    productsAttributesId = productsAttributesResponse.data.productsAttributesId;
                });
            }
        });
        return productsAttributesId;
    }

    /**
     * @param propertyService
     * @param attributesMappingName
     * @param attributeCode
     * @param swagMarketsMappingId
     * @returns {Promise<void>}
     */
    async upsertProductsAttributesMappingResource(propertyService, attributesMappingName, attributeCode, swagMarketsMappingId = null) {
        await propertyService.saveAttributeMappingData({
            bfMappingId: swagMarketsMappingId,
            attributeId: attributeCode,
            externalValue: attributesMappingName
        });
    }

    /**
     * @param propertyService
     * @param item
     * @returns {Promise<void>}
     */
    async removeAttributesMappingAssignment(propertyService, item) {
        await propertyService.removeAttributeMappingData(item.swagMarketsMappingId)
    }

    /**
     * @param mappedData
     * @param swagMarketsId
     */
    erpSystemMappingExists(mappedData, swagMarketsId) {
        let extractedData = [];
        if (mappedData.length === 0) {
            return false;
        }

        mappedData.forEach(function (item, index) {
            item = item.match(/##([A-Z0-9])+##/gi);
            if (item !== null) {
                extractedData[index] = item[0].replace(/##/g, '');
            }
        });
        return extractedData.find(el => el === swagMarketsId);
    }
}

export default AttributesMappingUtils;

Application.addServiceProvider('AttributesMappingUtils', (container) => {
    return new AttributesMappingUtils();
});
