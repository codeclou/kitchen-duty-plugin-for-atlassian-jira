var initCsSourcePointerHover = function () {
    /** when hovering item in list on the right */
    $('.cs-source-point-list__item').hover(
        function() {
            var number = $(this).index()+1;
            var uniqueId = $(this).parent().attr('data-source-target');
            $('[data-cs-source-point-id="' + uniqueId + '"][data-cs-source-point-number="' + number + '"]').addClass('cs-source-point--active');
        }, function() {
            var number = $(this).index()+1;
            var uniqueId = $(this).parent().attr('data-source-target');
            $('[data-cs-source-point-id="' + uniqueId + '"][data-cs-source-point-number="' + number + '"]').removeClass('cs-source-point--active');
        }
    );
    /** when hovering point in the code on the left */
    $('.cs-source-point[data-cs-source-point-id][data-cs-source-point-number]').hover(
        function() {
            var number = $(this).attr('data-cs-source-point-number');
            var uniqueId = $(this).attr('data-cs-source-point-id');
            $('[data-source-target="' + uniqueId + '"]').find('a:nth-child('+ number + ')')
                .addClass('cs-source-point-list__item--active');
        }, function() {
            var number = $(this).attr('data-cs-source-point-number');
            var uniqueId = $(this).attr('data-cs-source-point-id');
            $('[data-source-target="' + uniqueId + '"]').find('a:nth-child('+ number + ')')
                .removeClass('cs-source-point-list__item--active');
        }
    );
};

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

    initCsSourcePointerHover();
});
