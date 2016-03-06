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


var _startsWith = function (string, prefix) {
    return string.slice(0, prefix.length) == prefix;
};

$(function () {
    for (var i = 0; i < postLoadMethods.length; i++){
        postLoadMethods[i]();
    }

    initBootstrapTooltip();

    initClipboardJs();

    initCsSourcePointerHover();
});
