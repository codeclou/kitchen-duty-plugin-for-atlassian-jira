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
    /* FIXME:
    $('.cs-shell__copy-clipboard').tooltip({trigger: 'manual', title: 'copied!'});
    $('.cs-shell__copy-clipboard').click(function(){
        var that = $(this)
        that.tooltip('show');
        setTimeout(function(){
            that.tooltip('hide');
        }, 1000);
    });*/

};

var initPlanningPageSvgOverview = function () {

    console.log('loading SCG stuff');

    var s = Snap('#kitchen-duty-planning-page--component-overview');
    var g = s.group();
    var planningPageOverview = Snap.load('/kitchen-duty-plugin-for-atlassian-jira/images/interactive/kitchen-duty-planning-page--component-overview.svg', function ( loadedFragment ) {

        g.append( loadedFragment );
        var webworkBoxWrapper = g.select('#webwork-action');

        g.select('#jira').click(function () {
            toastr.success('JIRA', 'Awesome!')
        });


        webworkBoxWrapper.click(function () {
            toastr.success('You have clicked something!', 'Awesome!')
        });
        webworkBoxWrapper.mouseover(function() {
            webworkBoxWrapper.select('path').animate({fill: 'coral'}, 200, mina.easein);
            webworkBoxWrapper.select('text').animate({fill: 'coral'}, 200, mina.easein);
        });
        webworkBoxWrapper.mouseout(function() {
            webworkBoxWrapper.select('path').animate({fill: 'black'}, 200, mina.easein);
            webworkBoxWrapper.select('text').animate({fill: 'black'}, 200, mina.easein);
        });

    } );

    //var hoverover = function() { g.animate({ transform: 's2r45,150,150' }, 1000, mina.bounce ) };
    //var hoverout = function() { g.animate({ transform: 's1r0,150,150' }, 1000, mina.bounce ) };

};

var _startsWith = function (string, prefix) {
    return string.slice(0, prefix.length) == prefix;
};

$(function () {
    for (var i = 0; i < postLoadMethods.length; i++){
        postLoadMethods[i]();
    }

    initPlanningPageSvgOverview();

    /* initBootstrapTooltip(); */

    initClipboardJs();

    initCsSourcePointerHover();

});
