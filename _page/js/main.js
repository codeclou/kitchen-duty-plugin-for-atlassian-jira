import 'bootstrap';
import { Bilderrahmen } from 'bilderrahmen';
// snapsvg is special :D
var Snap = require( "imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js" );


/* ================================================================================================ */
/* STUFF */
/* ================================================================================================ */
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
    $('[data-toggle="tooltip"]:visible').tooltip();
    $('[data-toggle="tooltip"]:hidden').tooltip();

};

var initClipboardJs = function () {
    $('.cs--trigger-copy-clipboard').click(function(){
        var that = $(this);

        const referenceNode = document.getElementById('copy-to-clipboard-dummy');
        referenceNode.value = that.attr('data-clipboard-text');

        try {
            referenceNode.select();
            document.execCommand('copy');
            that.tooltip('dispose');
            that.attr('title', 'copied!');
            that.tooltip('show');
            setTimeout(function(){
                that.attr('title', that.attr('data-title-orig'));
                that.tooltip('dispose');
                that.tooltip();
            }, 1000);
        } catch(e) {
            that.tooltip('dispose');
            that.attr('title', 'copy failed! Use a modern browser!');
            that.tooltip('show');
            setTimeout(function(){
                that.attr('title', that.attr('data-title-orig'));
                that.tooltip('dispose');
                that.tooltip();
            }, 1000);
        }

    });
};

/* ================================================================================================ */
/* INTERACTIVE GRAPHICS */
/* ================================================================================================ */

/* we have three elements bg*, fill* and label* which we define styles for. See `images/interactive/README.md` */

var interactiveGraphicStyles = {
    bg: {
        normal: {
            mouseIn: {
                fill: 'rgba(30,159,204)'
            },
            mouseOut: {
                fill: 'black'
            }
        },
        markedAsDone: {
            mouseIn: {
                fill: 'rgba(0, 158, 53)'
            },
            mouseOut: {
                fill: 'rgba(0, 158, 53)'
            }
        },
        markedAsTodo: {
            mouseIn: {
                fill: 'rgba(255, 145, 29)'
            },
            mouseOut: {
                fill: 'rgba(255, 145, 29)'
            }
        },
        markedAsGrayedOut: {
            mouseIn: {
                fill: 'rgba(30,159,204)'
            },
            mouseOut: {
                fill: 'black'
            }
        }
    },
    fill: {
        normal: {
            mouseIn: {
                fill: 'rgba(30,159,204)'
            },
            mouseOut: {
                fill: 'black'
            }
        },
        markedAsDone: {
            mouseIn: {
                fill: 'rgba(107, 233, 150)'
            },
            mouseOut: {
                fill: 'rgba(195, 233, 208)'
            }
        },
        markedAsTodo: {
            mouseIn: {
                fill: 'rgba(255,184,109)'
            },
            mouseOut: {
                fill: 'rgba(255,227,197)'
            }
        },
        markedAsGrayedOut: {
            mouseIn: {
                fill: 'rgba(30,159,204)'
            },
            mouseOut: {
                fill: 'black'
            }
        }
    },
    label: {
        normal: {
            mouseIn: {
                fill: 'black'
            },
            mouseOut: {
                fill: 'black'
            }
        },
        markedAsDone: {
            mouseIn: {
                fill: 'black'
            },
            mouseOut: {
                fill: 'rgba(0, 158, 53)'
            }
        },
        markedAsTodo: {
            mouseIn: {
                fill: 'black'
            },
            mouseOut: {
                fill: 'rgba(216, 111, 0)'
            }
        },
        markedAsGrayedOut: {
            mouseIn: {
                fill: 'rgba(30,159,204)'
            },
            mouseOut: {
                fill: 'black'
            }
        }
    }
};

var _extractElementTypeFromElementId = function(elementId) {
    if (_startsWith(elementId, 'bg')) {
        return 'bg';
    }
    if (_startsWith(elementId, 'label')) {
        return 'label';
    }
    if (_startsWith(elementId, 'fill')) {
        return 'fill';
    }
    return 'other';
};

/* See images/interactive/README.md for expected SVG format and conventions used here. */
var _loadInteractiveGraphic = function (el) {
    var svgId = $(el).attr('id');
    console.log('ig: loading svg graphic: ' + svgId);
    var jsonSettings = JSON.parse($(el).attr('data-json-settings'));
    if (jsonSettings === undefined || jsonSettings === null) { console.log('ig: failed1'); return; }
    if (jsonSettings['markedAsDone'] === undefined || typeof jsonSettings['markedAsDone'] !== 'object') { console.log('ig: failed2'); return; }
    if (jsonSettings['markedAsTodo'] === undefined || typeof jsonSettings['markedAsTodo'] !== 'object') { console.log('ig: failed3'); return; }
    if (jsonSettings['markedAsGrayedOut'] === undefined || typeof jsonSettings['markedAsGrayedOut'] !== 'object') { console.log('ig: failed4'); return; }
    if (jsonSettings['onClick'] === undefined || typeof jsonSettings['onClick'] !== 'object') { console.log('ig: failed5'); return; }
    console.log('ig: valid input');

    var svgToLoad = '/kitchen-duty-plugin-for-atlassian-jira/images/interactive/' + $(el).attr('data-svg-to-load') + '.svg';
    var g = Snap('#' + svgId).group();
    Snap.load(svgToLoad, function (loadedFragment) {
        g.append(loadedFragment);
        //
        // STYLE ELEMENTS
        //
        [ 'markedAsDone', 'markedAsTodo', 'markedAsGrayedOut' ].forEach(function(settingsCategory) {
            jsonSettings[settingsCategory].forEach(function(svgGroupName) {
                var svgGroup = g.select('#' + svgGroupName);
                var svgGroupChildren = svgGroup.selectAll('*');
                    $(svgGroupChildren).each(function(ind, svgGroupChild) {
                        var svgGroupChildId = svgGroupChild.attr('id');
                        var svgGroupChildType = _extractElementTypeFromElementId(svgGroupChildId);
                        if (svgGroupChildType !== 'other') {
                            svgGroupChild.attr(interactiveGraphicStyles[svgGroupChildType][settingsCategory]['mouseOut']);
                            svgGroup.mouseover(function() {
                                svgGroupChild.animate(
                                    interactiveGraphicStyles[svgGroupChildType][settingsCategory]['mouseIn'],
                                    200, mina.easein);
                            });
                            svgGroup.mouseout(function() {
                                svgGroupChild.animate(
                                    interactiveGraphicStyles[svgGroupChildType][settingsCategory]['mouseOut'],
                                    200, mina.easein);
                            });
                        }

                });
            });
        });
        //
        // REGISTER CLICK EVENTS
        //
        jsonSettings['onClick'].forEach(function(onClickSettings) {
            var onClickGroupName = Object.keys(onClickSettings)[0];
            $('#' + onClickGroupName).click(function () {
                console.log('ig: ' + onClickGroupName + ' clicked');
                window[onClickSettings[onClickGroupName]]();
            });
            // pointer on mouseover of group (note for future me: if there are "unfilled" areas inside group, point will not work in that area. Ergo: Always have filled rect in background of group.)
            $('#' + onClickGroupName).css('cursor','pointer');
        });
    });
};

var initInteractiveGraphics = function () {
    $('.cs-interactive-graphic').each(function(ind, el) {
        _loadInteractiveGraphic(el)
    });
};


/* ================================================================================================ */
/* HELPERS */
/* ================================================================================================ */

var redirectToSsl = function () {
    if (!_startsWith(window.location.protocol, 'https') && !_startsWith(window.location.href, 'http://localhost') && !_startsWith(window.location.href, 'http://192')) {
        window.location.href = "https://" + window.location.hostname + window.location.pathname + window.location.search;
    }
};

var _startsWith = function (stringS, prefix) {
    if (stringS === undefined || stringS === null) return false;
    return stringS.slice(0, prefix.length) == prefix;
};

var initStarsOnGitHub = function() {
    /* do nothing anymore */
};

/* ================================================================================================ */
/* SIDEBAR */
/* ================================================================================================ */

var initToggleSidebarByState = function() {
    var contentWrapper = $('.cs-content-wrapper');
    var sidebarWrapper = $('.cs-sidebar-wrapper');
    var sidebarState = sessionStorage.getItem('cs-kitchen-duty-sidebar-open');
    if (sidebarState !== undefined && sidebarState === 'closed') {
        contentWrapper.removeClass('cs-content-wrapper--isopen');
        sidebarWrapper.removeClass('cs-sidebar-wrapper--isopen');
    } else {
        contentWrapper.addClass('cs-content-wrapper--isopen');
        sidebarWrapper.addClass('cs-sidebar-wrapper--isopen');
    }
    var toggleSidebarButton = document.getElementById('toggleSidebarButton');
    if (toggleSidebarButton !== undefined && toggleSidebarButton !== null) {
        toggleSidebarButton.addEventListener('click', function() {
            var contentWrapper = $('.cs-content-wrapper');
            var sidebarWrapper = $('.cs-sidebar-wrapper');

            if (contentWrapper.hasClass('cs-content-wrapper--isopen')) {
                contentWrapper.removeClass('cs-content-wrapper--isopen');
                sidebarWrapper.removeClass('cs-sidebar-wrapper--isopen');
                sessionStorage.setItem('cs-kitchen-duty-sidebar-open', 'closed');
            } else {
                contentWrapper.addClass('cs-content-wrapper--isopen');
                sidebarWrapper.addClass('cs-sidebar-wrapper--isopen');
                sessionStorage.setItem('cs-kitchen-duty-sidebar-open', 'open');
            }
        });
    }
};

/* ================================================================================================ */
/* ONLOAD */
/* ================================================================================================ */

$(function () {
    redirectToSsl();

    for (var i = 0; i < postLoadMethods.length; i++){
        postLoadMethods[i]();
    }

    initInteractiveGraphics();

    initBootstrapTooltip();

    initClipboardJs();

    initCsSourcePointerHover();

    initStarsOnGitHub();

    initToggleSidebarByState();

    new Bilderrahmen({ closeOnOutsideClick: true });

    console.log('deploy info: ' + JSON.stringify(
        {
            branch:    '___BRANCH___',
            commit:    '___COMMIT___',
            buildTime: '___TIMEST___'
        }
    ));

});
