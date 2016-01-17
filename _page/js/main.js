var initBootstrapTooltip = function () {
    $('[data-toggle="popover"]').popover();
};

var initClipboardJs = function () {
    /* https://github.com/zenorocha/clipboard.js */
    var clipboard = new Clipboard('.cs-shell__copy-clipboard');
    $('.cs-shell__copy-clipboard').tooltip({trigger: 'manual', title: 'copied!'});
    $('.cs-shell__copy-clipboard').click(function(){
        var that = $(this)
        that.tooltip('show');
        setTimeout(function(){
            that.tooltip('hide');
        }, 1000);
    });

};

var initToc = function() {
    _scrollToTocLinkByLocationHash();
    _initTocWayPoints();
    $('a[data-scroll-to]').click(function () {
        _clickTocLink($(this).attr('data-scroll-to'));
    });
};

var _initTocWayPoints = function () {
    $('[data-scroll-to-headline]').waypoint({
        handler: function(direction) {
            var anchor = this.element.getAttribute('data-scroll-to-headline');
            if (direction === 'up') {
                anchor = this.element.getAttribute('data-scroll-to-headline-previous');
            }
            _highlightToLink(anchor);
            _updateLocationHashTocLink(anchor);
        },
        offset: '50%'
    });
};

var _highlightToLink = function (anchor) {
    $('a[data-scroll-to]').parent().removeClass('toc-active');
    $('a[data-scroll-to="' + anchor + '"]').parent().addClass('toc-active');
};

var _scrollToTocLinkByLocationHash = function () {
    if (_startsWith(location.hash, '#/')) {
        var hashParts = location.hash.split('/');
        var scrollto = null;
        if (hashParts.indexOf('scrollto') !== -1) {
            scrollto = hashParts[(hashParts.indexOf('scrollto') + 1)];
        }
        if (scrollto !== null) {
            $.scrollTo('[data-scroll-to-headline="' + scrollto + '"]', {offset: -150, duration: 500});
        }
    }
};

var _updateLocationHashTocLink = function (anchor) {
    history.pushState('kitchen-duty', '', '#' + '/scrollto/' + anchor);
};

var _clickTocLink = function (anchor) {
    _updateLocationHashTocLink(anchor);
    _scrollToTocLinkByLocationHash();
};

var _startsWith = function (string, prefix) {
    return string.slice(0, prefix.length) == prefix;
};

$(function () {
    for (var i = 0; i < postLoadMethods.length; i++){
        postLoadMethods[i]();
    }

    initToc();

    initBootstrapTooltip();

    initClipboardJs();
});
