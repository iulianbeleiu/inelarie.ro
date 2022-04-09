import '../../service/bf-connection-assistant.service';

/* Importing components */
import './component/bf-ebay-connection-assistant-modal';
import './component/bf-ebay-connection-assistant-logo';
import './component/bf-ebay-connection-assistant-account-status';

/* Importing pages */
import './page/index';


/* Importing views */
import './view/bf-ebay-connection-assistant-start';
import './view/bf-ebay-connection-assistant-start-authorize';
import './view/bf-ebay-connection-assistant-start-authorize-oauth';
import './view/bf-ebay-connection-assistant-start-success';
import './view/bf-ebay-connection-assistant-account';
import './view/bf-ebay-connection-assistant-account-marketplace';
import './view/bf-ebay-connection-assistant-account-product';

const {Module} = Shopware;

Module.register('bf-ebay-connection-assistant', {
    type: 'plugin',
    name: 'swagMarkets-ebay-connection-assistant',
    routes: {
        index: {
            component: 'bf-ebay-connection-assistant-index',
            path: 'index',
            redirect: {
                name: 'bf.ebay.connection.assistant.index.start.authorize'
            },
            children: {
                start: {
                    component: 'bf-ebay-connection-assistant-start',
                    path: 'start',
                    children: {
                        authorize: {
                            component: 'bf-ebay-connection-assistant-start-authorize',
                            path: 'authorize'
                        },
                        success: {
                            component: 'bf-ebay-connection-assistant-start-success',
                            path: 'success',
                            redirect: {
                                name: 'bf.ebay.connection.assistant.index.account'
                            }
                        }
                    }
                },
                account: {
                    component: 'bf-ebay-connection-assistant-account',
                    path: 'account',
                    redirect: {
                        name: 'bf.ebay.connection.assistant.index.account.marketplace'
                    },
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
});
