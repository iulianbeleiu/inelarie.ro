#1.3.9
- display breadCrumbs instead of category name in search categories field
- fix an issue in the generation of the salesChannel list in the admin sidebar for compatibility with other plugins
- resolved an issue with the environments, when customer instance has a dev environment

#1.3.8
- New Ebay sales channel configuration field added to configure the brand name as manufacturer.
- Fixed the ebay auth link processing

#1.3.7
- changed long errors text visibility
- Amazon sales channel configuration for FcShelfLife added.

#1.3.6
- fixed url for opening products on amazon shop
- Add logic to publish deleted articles to the marketplaces
- Endpoint to update amazon and eBay take over service status added.

#1.3.5
- Add router link to product list to enable routing directly to the products
- Fixed pagination for search and for initial product list
- Fixed the ebay auth link processing
- Fixed pagination and search field for Attribute mapping modal window

#1.3.4
- Add feature to recreate the integration user in sw and business platform
- Bugfix for removal of integration user
- Implements asin matching on products list
- Text changes

#1.3.3
- Bug fix with listing of empty attribute mappings

#1.3.2
- Only valid PayPal email addresses will be stored
- Only Logo URL with https protocol will be stored
- Fixed bug for saving attributes mapping

#1.3.1
- Fixed compatibility with PayPal Plugin

#1.3.0
- Adjusted functionality for getting Plugin compatible with SW6.4
- Add default payment for ebay sales channel
- Add filter for product list
- Add AVV for contracts
- Fixed payment method matching for ebay with more than 25 payment methods

#1.2.10
- Plugin will store information about sales channel id & sales channel api key every time the ui will loaded
to prevent issue with wrong sales channel data.
- Bugfix on installation with default language not being German or English
- Bugfix for ebay payment method mapping
- Uninstall issue fixed

# 1.2.9
- Added categories bread crumbs on categories mapping level
- Bugfix on categories mapping search input
- Bugfix on remove categories mapping
- Improvements on categories mapping 
- Fixed issue with duplicate UI entries in categories mapping

# 1.2.8
- Fixed the problem with no payment methods matching error message
- Activation error messages will be displayed only if sales channel is not active
- Required informations about sales channel domains will now be created automatically.
- Fixed reloading bug of categories Mapping
- Fixed duplicate entries for ebay attribute mapping.

# 1.2.7
- Activation error messages will be displayed only if sales channel is not active

# 1.2.6
- Fixed error with disappeared sales channel eye icon
- Marketplace online status will be green if marketplaceProductId filled and stock has value more than 0 
- Fix german translations, going from formal to informal tone
- Fix translation of prices tab for eBay

# 1.2.5
- Uniforming ebay payment
- Fixed translation
- Fixed issue with deactivation/activation of the plugin

# 1.2.4
- Fixed issue with saving on mapping-Tab (custom fields, properties)

# 1.2.3
- Allowed resize columns for products grid
- Fixed UI issue on categories mapping
- Fixed translation

# 1.2.2
- Fixed a bug for not shown attribute mapping modal
- Changed plugin name & logo
- Fixed a bug where the global sw icon style was overwritten
- Add default shipping methods field to sales channel creation part
- Rename amazon payment method

# 1.2.1
- Removed duplicate ebay token block

# Major-Release 1.2.0
- Fixed issue for ebay connection assistant
- add amazon payment method
- reorder general sales channel ui
- Rebuild Attributes mapping, look and feel
- The view of the eBay sales channel settings
- Moved all mappings into one single tab
- Redesign categories mapping and moved it to the new mapping tab.
- Bugfix: fixed issue with product list search field

# 1.1.10
- Adding multiselect for countries at sales channel general page.
- Bugfix preventing error in console. Wrong variable type was sent to component.  


# 1.1.9
- Changed logic for current contract display name, switched identifier for contracts
- Bug fix for empty policies

# 1.1.8
- Add mechanic to set ebay policies on products level

# 1.1.7
- Adding description button for variation attributes
- Fixed number field issue for amazon delivery time entry

# 1.1.6
- Creating possibility to search products by name.

# 1.1.5
- adding additional product conditions for ebay
- enabling product edit when there are errors detected
- fixing loading of product segment types on Amazon sales channel general page settings

# 1.1.4
- fixing endless loop at category saving
- fixing disabled Amazon Product segments Dropdowns on General Saleschannel page
 
# 1.1.3
- Fixed wrong activate check for amazon sales channel

# 1.1.2
- Fixed wrong link to ebay policies site.
- Check if all policies selected for activate the sales channel

# 1.1.1
- Add domain field for ebay/amazon sales channel to fix issue on orders import

# 1.1.0
- Fixed issue with saving sales channel country/currency

# 1.0.9
- Removed unused code from Connection-Assistant
- Fixed console error if sales channel is saved
- Changed info message for product list if user is not logged in into shopware store
- Fixed issue with wrong pagination for product list
- Fixed issue with wrong loading of shops products errors

# 1.0.8
- Fixed issue to store sales_channel_language entries correct
- Add new configuration to sell products with net prices

# 1.0.7
- Fixed activation issue for saleschannel
- Add Information for property/customfield mapping
- Add automatic transfer of correct api version

# 1.0.6
- Fixed issue with removed EntityExtensionInterface for Shopware 6.3.x

# 1.0.5
- fixing category import routes

# 1.0.4
- changing packages name for limitation of features

# 1.0.3
- fixed smaller issues for connection

# 1.0.2
- implement searchIds() in SalesChannelRepositoryDecorator.php

# 1.0.1
- Plugin name change

# 1.0.0
- beta release 
