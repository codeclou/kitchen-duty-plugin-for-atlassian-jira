var exports = module.exports = {};
exports.csStringHelper = function () {
    var self = this;

    /**
     * Converts a Headlines Title to a anchorName.
     * All lowercase, Spaces to dashes, special Chars to escaped umlaut.
     *
     * @param text
     */
    self.convertToAnchor = function (text) {
        var anchorName = '???';

        if (text != undefined && text != null) {
            anchorName = text;
        }
        anchorName = anchorName.replace(/\s+/g,'-');
        anchorName = anchorName.toLowerCase();
        anchorName = anchorName.replace(/ü/g,'ue');
        anchorName = anchorName.replace(/ä/g,'ae');
        anchorName = anchorName.replace(/ö/g,'oe');
        anchorName = anchorName.replace(/ß/g,'ss');
        anchorName = anchorName.replace(/[^-a-z0-9]/g,'');

        return anchorName;
    };

    return {
        convertToAnchor: self.convertToAnchor
    }
};
