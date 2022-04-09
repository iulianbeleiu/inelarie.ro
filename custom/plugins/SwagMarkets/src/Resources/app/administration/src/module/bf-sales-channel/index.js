import '../../state/category-mapping/category-mapping.state';
import '../../service/bf-category.service';
import '../../service/bf-property.service';
import '../../service/bf-unit.service';
import '../../service/bf-system-api.service';
import '../../service/bf-product-api.service';
import '../../service/bf-sales-channel.service';
import '../../service/bf-amazon.service';
import '../../service/bf-ebay.service';
import '../../service/bf-plugin-configuration.service';
//Import overrides
import '../../app/component/entity/sw-category-tree-field-override';
import '../../app/component/base/sw-card-override';
// Import overrides for sales channels
import './component/structure/bf-sales-channel-menu';
import './component/bf-sales-channel-modal';
import './component/bf-sales-channel-modal-grid';
import './component/bf-sales-channel-product-grid';
import './component/bf-contract';
import './component/bf-collapse';
import './component/bf-plugin-configuration';
import './component/bf-bookable-contracts';
import './component/bf-bookable-contracts/bf-bookable-contracts-permissions';
import './component/bf-bookable-contracts/bf-bookable-contracts-sub-processor';
import './component/bf-sales-channel-amazon-fba-prime-shipping-methods';
import './component/bf-sales-channel-amazon-extended-configuration';
import './component/bf-sales-channel-ebay-extended-configuration';
import './component/bf-sales-channel-ebay-best-offer';
import './component/bf-sales-channel-defaults-select-only';
// Import sales channel detail
import './page/bf-sales-channel-detail';
import './view/bf-sales-channel-detail-base'
// Import sales channel creation
import './page/bf-sales-channel-create';
import './view/bf-sales-channel-create-base';
// Import sales channel amazon fba / prime tab
import './page/bf-sales-channel-amazon-fba-prime';
import './view/bf-sales-channel-detail-amazon-prime-fba';
// Import sales channel category mapping
import './component/bf-sales-channel-category-mapping';
import './component/bf-sales-channel-category-mapping/bf-grid-column-tree-field';
import './component/bf-sales-channel-category-mapping-tree-field';
// Import sales channel product listing
import './page/bf-sales-channel-product';
import './view/bf-sales-channel-detail-product-list';
import './component/bf-sales-channel-product-modal';
import './component/bf-sales-channel-amazon-asin-management';
import './component/bf-sales-channel-product-visibility-select';
import './component/bf-sales-channel-product-category-mapping';
import './component/bf-filter-panel';
// Import sales channel property / custom field mapping
import './component/bf-sales-channel-property-mapping-grid';
import './component/bf-sales-channel-property-mapping-list';
import './component/bf-sales-channel-property-mapping-modal';
import './component/bf-sales-channel-variation-properties-grid';
import './component/bf-sales-channel-detail-custom-fields';
import './component/bf-sales-channel-detail-property-transfer';
import './component/bf-sales-channel-segment-mapping';
import './page/bf-sales-channel-mapping';
import './view/bf-sales-channel-detail-mapping';

//attributes mapping
import "./component/bf-sales-channel-attributes-mapping";

//segment mapping
import './component/bf-sales-channel-shopware-category-tree';
import './component/bf-sales-channel-shopware-segment-category-tree';
import './component/bf-sales-channel-shopware-segment-dropdown';
import './component/bf-sales-channel-marketplace-category-tree';

// Import sales channel unit mapping
import './component/bf-sales-channel-unit-mapping-grid';
import './component/bf-sales-channel-unit-mapping-modal';
import './component/bf-sales-channel-detail-unit-mapping';

//import snippets
import deDE from './snippet/de-DE.json';
import enEN from './snippet/en-EN.json';

const {Module} = Shopware;

Module.register('bf-sales-channel', {
    type: 'plugin',
    name: 'brickfox-sales-channel',
    description: 'Managing marketplace channels',
    version: '1.0.0',
    targetVersion: '1.0.0',
    color: '#0CD70A',
    icon: 'default-action-share',
    entity: 'sales_channel',
    snippets: {
        'de-DE': deDE,
        'en-GB': enEN
    },
    routes: {
        detail: {
            component: 'bf-sales-channel-detail',
            path: 'detail/:id',
            redirect: {
                name: 'bf.sales.channel.detail.base'
            },
            children: {
                base: {
                    component: 'bf-sales-channel-detail-base',
                    path: 'base',
                    children: {
                        amazonConnectionAssistant: {
                            component: 'bf-amazon-connection-assistant-index',
                            path: 'amazonConnectionAssistant',
                            children: {
                                start: {
                                    component: 'bf-amazon-connection-assistant-start',
                                    path: 'start',
                                    children: {
                                        authorize: {
                                            component: 'bf-amazon-connection-assistant-start-authorize',
                                            path: 'authorize'
                                        }
                                    }
                                },
                                account: {
                                    component: 'bf-amazon-connection-assistant-account',
                                    path: 'account',
                                    children: {
                                        marketplace: {
                                            component: 'bf-amazon-connection-assistant-account-marketplace',
                                            path: 'marketplace'
                                        },
                                        'product-check': {
                                            component: 'bf-amazon-connection-assistant-account-product',
                                            path: 'product-check'
                                        }
                                    }
                                }
                            }
                        },
                        ebayConnectionAssistant: {
                            component: 'bf-ebay-connection-assistant-index',
                            path: 'ebayConnectionAssistant',
                            children: {
                                start: {
                                    component: 'bf-ebay-connection-assistant-start',
                                    path: 'start',
                                    children: {
                                        authorize: {
                                            component: 'bf-ebay-connection-assistant-start-authorize',
                                            path: 'authorize'
                                        },
                                        'authorize-oauth': {
                                            component: 'bf-ebay-connection-assistant-start-authorize-oauth',
                                            path: 'authorize-oauth'
                                        }
                                    }
                                },
                                account: {
                                    component: 'bf-ebay-connection-assistant-account',
                                    path: 'account',
                                    children: {
                                        marketplace: {
                                            component: 'bf-ebay-connection-assistant-account-marketplace',
                                            path: 'marketplace'
                                        },
                                        'product-check': {
                                            component: 'bf-ebay-connection-assistant-account-product',
                                            path: 'product-check'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                product: {
                    component: 'bf-sales-channel-detail-product-list',
                    path: 'product',
                    children: {
                        detail: {
                            path: 'detail/:productId',
                            component: 'bf-sales-channel-detail-product-detail'
                        }
                    }
                },
                mapping: {
                    component: 'bf-sales-channel-detail-mapping',
                    path: 'mapping'
                },
                unit: {
                    component: 'bf-sales-channel-detail-unit-mapping',
                    path: 'unit-mapping'
                },
                'amazon-fba-prime': {
                    component: 'bf-sales-channel-detail-amazon-prime-fba',
                    path: 'amazon-fba-prime'
                }
            }
        },
        create: {
            component: 'bf-sales-channel-create',
            path: 'create/:typeId',
            redirect: {
                name: 'bf.sales.channel.create.base'
            },
            children: {
                base: {
                    component: 'bf-sales-channel-create-base',
                    path: 'base'
                }
            }
        }
    },

    getSalesChannelByTypeId: function (salesChannelTypeId) {
        switch (salesChannelTypeId) {
            case '26a9ece25bd14b288b30c3d71e667d2c':
                return 'amazon';
            case '7ff39608fed04e4bbcc62710b7223966':
                return 'ebay';
            default:
                return '';
        }
    }
});
