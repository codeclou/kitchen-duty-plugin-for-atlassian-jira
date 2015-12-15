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
    $('#toc').toc({
        scrollToOffset: 110,
        selectors: 'h2'
    });
};

$(function () {
    for (var i = 0; i < postLoadMethods.length; i++){
        postLoadMethods[i]();
    }

    initToc();

    initBootstrapTooltip();

    initClipboardJs();
});
