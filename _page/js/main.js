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



var _getHoverEffect__bg = function(svgElement) {
    return {
        element: svgElement,
        mouseInAttributes: {
            fill: 'rgba(30,159,204)'
        },
        mouseOutAttributes: {
            fill: 'black'
        }
    };
};
var _getHoverEffect__fill = function(svgElement) {
    return {
        element: svgElement,
        mouseInAttributes: {
            fill: 'rgba(240,251,255)'
        },
        mouseOutAttributes: {
            fill: 'white'
        }
    };
};
var _getHoverEffect__label = function(svgElement) {
    return {
        element: svgElement,
        mouseInAttributes: {
            fill: 'rgba(30,159,204)'
        },
        mouseOutAttributes: {
            fill: 'black'
        }
    };
};

/**
 * See images/interactive/README.md for expected SVG format and conventions used here.
 *
 * @param svgElement (group with children)
 * @param clickCallback will be executed on click
 * @private
 */
var _snapSvgMouseOverAndClickInfoBoxWithText = function(svgElement, clickCallback) {
    if (svgElement === undefined || svgElement === null) return;

    svgElement.click(function () {
        clickCallback();
    });
    $('#' + svgElement.attr('id')).css('cursor','pointer');

    var children = svgElement.selectAll('*');
    var effectsToRegister = [];
    for(var i=0 ; i < children.length ; i++) {
        if (_startsWith(children[i].attr('id'), 'bg')) {
            effectsToRegister.push(_getHoverEffect__bg(children[i]));
        }
        if (_startsWith(children[i].attr('id'), 'label')) {
            effectsToRegister.push(_getHoverEffect__label(children[i]));
        }
        if (_startsWith(children[i].attr('id'), 'fill')) {
            effectsToRegister.push(_getHoverEffect__fill(children[i]));
        }
    }
    svgElement.mouseover(function() {
        effectsToRegister.forEach(function(effectAndElement) {
            effectAndElement.element.animate(effectAndElement.mouseInAttributes, 200, mina.easein);
        });
    });
    svgElement.mouseout(function() {
        effectsToRegister.forEach(function(effectAndElement) {
            effectAndElement.element.animate(effectAndElement.mouseOutAttributes, 200, mina.easein);
        });
    });

};

var initPlanningPageSvgOverview = function () {
    var s = Snap('#kitchen-duty-planning-page--component-overview');
    var g = s.group();
    var planningPageOverview = Snap.load('/kitchen-duty-plugin-for-atlassian-jira/images/interactive/kitchen-duty-planning-page--component-overview.svg', function (loadedFragment) {
        g.append(loadedFragment);

        _snapSvgMouseOverAndClickInfoBoxWithText(g.select('#jira'), function () {
            toastr.success('JIRA', 'Awesome!')
        });
        _snapSvgMouseOverAndClickInfoBoxWithText(g.select('#kitchen-duty-resource'), function () {
            toastr.success('kitchen-duty-resource', 'Awesome!')
        });
        _snapSvgMouseOverAndClickInfoBoxWithText(g.select('#webwork-action'), function () {
            toastr.success('webwork-action', 'Awesome!')
        });
        _snapSvgMouseOverAndClickInfoBoxWithText(g.select('#user-resource'), function () {
            toastr.success('user-action', 'Awesome!')
        });
        _snapSvgMouseOverAndClickInfoBoxWithText(g.select('#user-js-controller'), function () {
            toastr.success('user-js-controller', 'Awesome!')
        });
        _snapSvgMouseOverAndClickInfoBoxWithText(g.select('#kitchen-duty-js-controller'), function () {
            toastr.success('kitchen-duty-js-controller', 'Awesome!')
        });
        _snapSvgMouseOverAndClickInfoBoxWithText(g.select('#html-view'), function () {
            toastr.success('html-view', 'Awesome!')
        });
    });
};

var _startsWith = function (string, prefix) {
    if (string === undefined || string === null) return false;
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
