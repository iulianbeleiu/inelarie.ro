import ListingPlugin from 'src/plugin/listing/listing.plugin';

export default class ShapeListingPlugin extends ListingPlugin {

    /**
     * Template for an active filter label.
     *
     * @param {Object} label
     * @returns {string}
     */
    getLabelTemplate(label) {
        return `
        <span class="${this.options.activeFilterLabelClass}">
            ${this.getLabelPreviewTemplate(label)}
            <span>
                ${label.label}
            </span>
            <button class="${this.options.activeFilterLabelRemoveClass}"
                    data-id="${label.id}">
            </button>
        </span>
        `;
    }
}
