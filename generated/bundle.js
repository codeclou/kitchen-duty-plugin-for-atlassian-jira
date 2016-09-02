(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require, exports, module);
    } else {
        root.Tether = factory();
    }
})(this, function(require, exports, module) {
    "use strict";
    var _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }
    var TetherBase = undefined;
    if (typeof TetherBase === "undefined") {
        TetherBase = {
            modules: []
        };
    }
    var zeroElement = null;
    function getActualBoundingClientRect(node) {
        var boundingRect = node.getBoundingClientRect();
        var rect = {};
        for (var k in boundingRect) {
            rect[k] = boundingRect[k];
        }
        if (node.ownerDocument !== document) {
            var _frameElement = node.ownerDocument.defaultView.frameElement;
            if (_frameElement) {
                var frameRect = getActualBoundingClientRect(_frameElement);
                rect.top += frameRect.top;
                rect.bottom += frameRect.top;
                rect.left += frameRect.left;
                rect.right += frameRect.left;
            }
        }
        return rect;
    }
    function getScrollParents(el) {
        var computedStyle = getComputedStyle(el) || {};
        var position = computedStyle.position;
        var parents = [];
        if (position === "fixed") {
            return [ el ];
        }
        var parent = el;
        while ((parent = parent.parentNode) && parent && parent.nodeType === 1) {
            var style = undefined;
            try {
                style = getComputedStyle(parent);
            } catch (err) {}
            if (typeof style === "undefined" || style === null) {
                parents.push(parent);
                return parents;
            }
            var _style = style;
            var overflow = _style.overflow;
            var overflowX = _style.overflowX;
            var overflowY = _style.overflowY;
            if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
                if (position !== "absolute" || [ "relative", "absolute", "fixed" ].indexOf(style.position) >= 0) {
                    parents.push(parent);
                }
            }
        }
        parents.push(el.ownerDocument.body);
        if (el.ownerDocument !== document) {
            parents.push(el.ownerDocument.defaultView);
        }
        return parents;
    }
    var uniqueId = function() {
        var id = 0;
        return function() {
            return ++id;
        };
    }();
    var zeroPosCache = {};
    var getOrigin = function getOrigin() {
        var node = zeroElement;
        if (!node) {
            node = document.createElement("div");
            node.setAttribute("data-tether-id", uniqueId());
            extend(node.style, {
                top: 0,
                left: 0,
                position: "absolute"
            });
            document.body.appendChild(node);
            zeroElement = node;
        }
        var id = node.getAttribute("data-tether-id");
        if (typeof zeroPosCache[id] === "undefined") {
            zeroPosCache[id] = getActualBoundingClientRect(node);
            defer(function() {
                delete zeroPosCache[id];
            });
        }
        return zeroPosCache[id];
    };
    function removeUtilElements() {
        if (zeroElement) {
            document.body.removeChild(zeroElement);
        }
        zeroElement = null;
    }
    function getBounds(el) {
        var doc = undefined;
        if (el === document) {
            doc = document;
            el = document.documentElement;
        } else {
            doc = el.ownerDocument;
        }
        var docEl = doc.documentElement;
        var box = getActualBoundingClientRect(el);
        var origin = getOrigin();
        box.top -= origin.top;
        box.left -= origin.left;
        if (typeof box.width === "undefined") {
            box.width = document.body.scrollWidth - box.left - box.right;
        }
        if (typeof box.height === "undefined") {
            box.height = document.body.scrollHeight - box.top - box.bottom;
        }
        box.top = box.top - docEl.clientTop;
        box.left = box.left - docEl.clientLeft;
        box.right = doc.body.clientWidth - box.width - box.left;
        box.bottom = doc.body.clientHeight - box.height - box.top;
        return box;
    }
    function getOffsetParent(el) {
        return el.offsetParent || document.documentElement;
    }
    var _scrollBarSize = null;
    function getScrollBarSize() {
        if (_scrollBarSize) {
            return _scrollBarSize;
        }
        var inner = document.createElement("div");
        inner.style.width = "100%";
        inner.style.height = "200px";
        var outer = document.createElement("div");
        extend(outer.style, {
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            visibility: "hidden",
            width: "200px",
            height: "150px",
            overflow: "hidden"
        });
        outer.appendChild(inner);
        document.body.appendChild(outer);
        var widthContained = inner.offsetWidth;
        outer.style.overflow = "scroll";
        var widthScroll = inner.offsetWidth;
        if (widthContained === widthScroll) {
            widthScroll = outer.clientWidth;
        }
        document.body.removeChild(outer);
        var width = widthContained - widthScroll;
        _scrollBarSize = {
            width: width,
            height: width
        };
        return _scrollBarSize;
    }
    function extend() {
        var out = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var args = [];
        Array.prototype.push.apply(args, arguments);
        args.slice(1).forEach(function(obj) {
            if (obj) {
                for (var key in obj) {
                    if ({}.hasOwnProperty.call(obj, key)) {
                        out[key] = obj[key];
                    }
                }
            }
        });
        return out;
    }
    function removeClass(el, name) {
        if (typeof el.classList !== "undefined") {
            name.split(" ").forEach(function(cls) {
                if (cls.trim()) {
                    el.classList.remove(cls);
                }
            });
        } else {
            var regex = new RegExp("(^| )" + name.split(" ").join("|") + "( |$)", "gi");
            var className = getClassName(el).replace(regex, " ");
            setClassName(el, className);
        }
    }
    function addClass(el, name) {
        if (typeof el.classList !== "undefined") {
            name.split(" ").forEach(function(cls) {
                if (cls.trim()) {
                    el.classList.add(cls);
                }
            });
        } else {
            removeClass(el, name);
            var cls = getClassName(el) + (" " + name);
            setClassName(el, cls);
        }
    }
    function hasClass(el, name) {
        if (typeof el.classList !== "undefined") {
            return el.classList.contains(name);
        }
        var className = getClassName(el);
        return new RegExp("(^| )" + name + "( |$)", "gi").test(className);
    }
    function getClassName(el) {
        if (el.className instanceof el.ownerDocument.defaultView.SVGAnimatedString) {
            return el.className.baseVal;
        }
        return el.className;
    }
    function setClassName(el, className) {
        el.setAttribute("class", className);
    }
    function updateClasses(el, add, all) {
        all.forEach(function(cls) {
            if (add.indexOf(cls) === -1 && hasClass(el, cls)) {
                removeClass(el, cls);
            }
        });
        add.forEach(function(cls) {
            if (!hasClass(el, cls)) {
                addClass(el, cls);
            }
        });
    }
    var deferred = [];
    var defer = function defer(fn) {
        deferred.push(fn);
    };
    var flush = function flush() {
        var fn = undefined;
        while (fn = deferred.pop()) {
            fn();
        }
    };
    var Evented = function() {
        function Evented() {
            _classCallCheck(this, Evented);
        }
        _createClass(Evented, [ {
            key: "on",
            value: function on(event, handler, ctx) {
                var once = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
                if (typeof this.bindings === "undefined") {
                    this.bindings = {};
                }
                if (typeof this.bindings[event] === "undefined") {
                    this.bindings[event] = [];
                }
                this.bindings[event].push({
                    handler: handler,
                    ctx: ctx,
                    once: once
                });
            }
        }, {
            key: "once",
            value: function once(event, handler, ctx) {
                this.on(event, handler, ctx, true);
            }
        }, {
            key: "off",
            value: function off(event, handler) {
                if (typeof this.bindings === "undefined" || typeof this.bindings[event] === "undefined") {
                    return;
                }
                if (typeof handler === "undefined") {
                    delete this.bindings[event];
                } else {
                    var i = 0;
                    while (i < this.bindings[event].length) {
                        if (this.bindings[event][i].handler === handler) {
                            this.bindings[event].splice(i, 1);
                        } else {
                            ++i;
                        }
                    }
                }
            }
        }, {
            key: "trigger",
            value: function trigger(event) {
                if (typeof this.bindings !== "undefined" && this.bindings[event]) {
                    var i = 0;
                    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                        args[_key - 1] = arguments[_key];
                    }
                    while (i < this.bindings[event].length) {
                        var _bindings$event$i = this.bindings[event][i];
                        var handler = _bindings$event$i.handler;
                        var ctx = _bindings$event$i.ctx;
                        var once = _bindings$event$i.once;
                        var context = ctx;
                        if (typeof context === "undefined") {
                            context = this;
                        }
                        handler.apply(context, args);
                        if (once) {
                            this.bindings[event].splice(i, 1);
                        } else {
                            ++i;
                        }
                    }
                }
            }
        } ]);
        return Evented;
    }();
    TetherBase.Utils = {
        getActualBoundingClientRect: getActualBoundingClientRect,
        getScrollParents: getScrollParents,
        getBounds: getBounds,
        getOffsetParent: getOffsetParent,
        extend: extend,
        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,
        updateClasses: updateClasses,
        defer: defer,
        flush: flush,
        uniqueId: uniqueId,
        Evented: Evented,
        getScrollBarSize: getScrollBarSize,
        removeUtilElements: removeUtilElements
    };
    "use strict";
    var _slicedToArray = function() {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;
            var _e = undefined;
            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);
                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"]) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }
            return _arr;
        }
        return function(arr, i) {
            if (Array.isArray(arr)) {
                return arr;
            } else if (Symbol.iterator in Object(arr)) {
                return sliceIterator(arr, i);
            } else {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
        };
    }();
    var _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();
    var _get = function get(_x6, _x7, _x8) {
        var _again = true;
        _function: while (_again) {
            var object = _x6, property = _x7, receiver = _x8;
            _again = false;
            if (object === null) object = Function.prototype;
            var desc = Object.getOwnPropertyDescriptor(object, property);
            if (desc === undefined) {
                var parent = Object.getPrototypeOf(object);
                if (parent === null) {
                    return undefined;
                } else {
                    _x6 = parent;
                    _x7 = property;
                    _x8 = receiver;
                    _again = true;
                    desc = parent = undefined;
                    continue _function;
                }
            } else if ("value" in desc) {
                return desc.value;
            } else {
                var getter = desc.get;
                if (getter === undefined) {
                    return undefined;
                }
                return getter.call(receiver);
            }
        }
    };
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }
    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    if (typeof TetherBase === "undefined") {
        throw new Error("You must include the utils.js file before tether.js");
    }
    var _TetherBase$Utils = TetherBase.Utils;
    var getScrollParents = _TetherBase$Utils.getScrollParents;
    var getBounds = _TetherBase$Utils.getBounds;
    var getOffsetParent = _TetherBase$Utils.getOffsetParent;
    var extend = _TetherBase$Utils.extend;
    var addClass = _TetherBase$Utils.addClass;
    var removeClass = _TetherBase$Utils.removeClass;
    var updateClasses = _TetherBase$Utils.updateClasses;
    var defer = _TetherBase$Utils.defer;
    var flush = _TetherBase$Utils.flush;
    var getScrollBarSize = _TetherBase$Utils.getScrollBarSize;
    var removeUtilElements = _TetherBase$Utils.removeUtilElements;
    function within(a, b) {
        var diff = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];
        return a + diff >= b && b >= a - diff;
    }
    var transformKey = function() {
        if (typeof document === "undefined") {
            return "";
        }
        var el = document.createElement("div");
        var transforms = [ "transform", "WebkitTransform", "OTransform", "MozTransform", "msTransform" ];
        for (var i = 0; i < transforms.length; ++i) {
            var key = transforms[i];
            if (el.style[key] !== undefined) {
                return key;
            }
        }
    }();
    var tethers = [];
    var position = function position() {
        tethers.forEach(function(tether) {
            tether.position(false);
        });
        flush();
    };
    function now() {
        if (typeof performance !== "undefined" && typeof performance.now !== "undefined") {
            return performance.now();
        }
        return +new Date();
    }
    (function() {
        var lastCall = null;
        var lastDuration = null;
        var pendingTimeout = null;
        var tick = function tick() {
            if (typeof lastDuration !== "undefined" && lastDuration > 16) {
                lastDuration = Math.min(lastDuration - 16, 250);
                pendingTimeout = setTimeout(tick, 250);
                return;
            }
            if (typeof lastCall !== "undefined" && now() - lastCall < 10) {
                return;
            }
            if (pendingTimeout != null) {
                clearTimeout(pendingTimeout);
                pendingTimeout = null;
            }
            lastCall = now();
            position();
            lastDuration = now() - lastCall;
        };
        if (typeof window !== "undefined" && typeof window.addEventListener !== "undefined") {
            [ "resize", "scroll", "touchmove" ].forEach(function(event) {
                window.addEventListener(event, tick);
            });
        }
    })();
    var MIRROR_LR = {
        center: "center",
        left: "right",
        right: "left"
    };
    var MIRROR_TB = {
        middle: "middle",
        top: "bottom",
        bottom: "top"
    };
    var OFFSET_MAP = {
        top: 0,
        left: 0,
        middle: "50%",
        center: "50%",
        bottom: "100%",
        right: "100%"
    };
    var autoToFixedAttachment = function autoToFixedAttachment(attachment, relativeToAttachment) {
        var left = attachment.left;
        var top = attachment.top;
        if (left === "auto") {
            left = MIRROR_LR[relativeToAttachment.left];
        }
        if (top === "auto") {
            top = MIRROR_TB[relativeToAttachment.top];
        }
        return {
            left: left,
            top: top
        };
    };
    var attachmentToOffset = function attachmentToOffset(attachment) {
        var left = attachment.left;
        var top = attachment.top;
        if (typeof OFFSET_MAP[attachment.left] !== "undefined") {
            left = OFFSET_MAP[attachment.left];
        }
        if (typeof OFFSET_MAP[attachment.top] !== "undefined") {
            top = OFFSET_MAP[attachment.top];
        }
        return {
            left: left,
            top: top
        };
    };
    function addOffset() {
        var out = {
            top: 0,
            left: 0
        };
        for (var _len = arguments.length, offsets = Array(_len), _key = 0; _key < _len; _key++) {
            offsets[_key] = arguments[_key];
        }
        offsets.forEach(function(_ref) {
            var top = _ref.top;
            var left = _ref.left;
            if (typeof top === "string") {
                top = parseFloat(top, 10);
            }
            if (typeof left === "string") {
                left = parseFloat(left, 10);
            }
            out.top += top;
            out.left += left;
        });
        return out;
    }
    function offsetToPx(offset, size) {
        if (typeof offset.left === "string" && offset.left.indexOf("%") !== -1) {
            offset.left = parseFloat(offset.left, 10) / 100 * size.width;
        }
        if (typeof offset.top === "string" && offset.top.indexOf("%") !== -1) {
            offset.top = parseFloat(offset.top, 10) / 100 * size.height;
        }
        return offset;
    }
    var parseOffset = function parseOffset(value) {
        var _value$split = value.split(" ");
        var _value$split2 = _slicedToArray(_value$split, 2);
        var top = _value$split2[0];
        var left = _value$split2[1];
        return {
            top: top,
            left: left
        };
    };
    var parseAttachment = parseOffset;
    var TetherClass = function(_Evented) {
        _inherits(TetherClass, _Evented);
        function TetherClass(options) {
            var _this = this;
            _classCallCheck(this, TetherClass);
            _get(Object.getPrototypeOf(TetherClass.prototype), "constructor", this).call(this);
            this.position = this.position.bind(this);
            tethers.push(this);
            this.history = [];
            this.setOptions(options, false);
            TetherBase.modules.forEach(function(module) {
                if (typeof module.initialize !== "undefined") {
                    module.initialize.call(_this);
                }
            });
            this.position();
        }
        _createClass(TetherClass, [ {
            key: "getClass",
            value: function getClass() {
                var key = arguments.length <= 0 || arguments[0] === undefined ? "" : arguments[0];
                var classes = this.options.classes;
                if (typeof classes !== "undefined" && classes[key]) {
                    return this.options.classes[key];
                } else if (this.options.classPrefix) {
                    return this.options.classPrefix + "-" + key;
                } else {
                    return key;
                }
            }
        }, {
            key: "setOptions",
            value: function setOptions(options) {
                var _this2 = this;
                var pos = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
                var defaults = {
                    offset: "0 0",
                    targetOffset: "0 0",
                    targetAttachment: "auto auto",
                    classPrefix: "tether"
                };
                this.options = extend(defaults, options);
                var _options = this.options;
                var element = _options.element;
                var target = _options.target;
                var targetModifier = _options.targetModifier;
                this.element = element;
                this.target = target;
                this.targetModifier = targetModifier;
                if (this.target === "viewport") {
                    this.target = document.body;
                    this.targetModifier = "visible";
                } else if (this.target === "scroll-handle") {
                    this.target = document.body;
                    this.targetModifier = "scroll-handle";
                }
                [ "element", "target" ].forEach(function(key) {
                    if (typeof _this2[key] === "undefined") {
                        throw new Error("Tether Error: Both element and target must be defined");
                    }
                    if (typeof _this2[key].jquery !== "undefined") {
                        _this2[key] = _this2[key][0];
                    } else if (typeof _this2[key] === "string") {
                        _this2[key] = document.querySelector(_this2[key]);
                    }
                });
                addClass(this.element, this.getClass("element"));
                if (!(this.options.addTargetClasses === false)) {
                    addClass(this.target, this.getClass("target"));
                }
                if (!this.options.attachment) {
                    throw new Error("Tether Error: You must provide an attachment");
                }
                this.targetAttachment = parseAttachment(this.options.targetAttachment);
                this.attachment = parseAttachment(this.options.attachment);
                this.offset = parseOffset(this.options.offset);
                this.targetOffset = parseOffset(this.options.targetOffset);
                if (typeof this.scrollParents !== "undefined") {
                    this.disable();
                }
                if (this.targetModifier === "scroll-handle") {
                    this.scrollParents = [ this.target ];
                } else {
                    this.scrollParents = getScrollParents(this.target);
                }
                if (!(this.options.enabled === false)) {
                    this.enable(pos);
                }
            }
        }, {
            key: "getTargetBounds",
            value: function getTargetBounds() {
                if (typeof this.targetModifier !== "undefined") {
                    if (this.targetModifier === "visible") {
                        if (this.target === document.body) {
                            return {
                                top: pageYOffset,
                                left: pageXOffset,
                                height: innerHeight,
                                width: innerWidth
                            };
                        } else {
                            var bounds = getBounds(this.target);
                            var out = {
                                height: bounds.height,
                                width: bounds.width,
                                top: bounds.top,
                                left: bounds.left
                            };
                            out.height = Math.min(out.height, bounds.height - (pageYOffset - bounds.top));
                            out.height = Math.min(out.height, bounds.height - (bounds.top + bounds.height - (pageYOffset + innerHeight)));
                            out.height = Math.min(innerHeight, out.height);
                            out.height -= 2;
                            out.width = Math.min(out.width, bounds.width - (pageXOffset - bounds.left));
                            out.width = Math.min(out.width, bounds.width - (bounds.left + bounds.width - (pageXOffset + innerWidth)));
                            out.width = Math.min(innerWidth, out.width);
                            out.width -= 2;
                            if (out.top < pageYOffset) {
                                out.top = pageYOffset;
                            }
                            if (out.left < pageXOffset) {
                                out.left = pageXOffset;
                            }
                            return out;
                        }
                    } else if (this.targetModifier === "scroll-handle") {
                        var bounds = undefined;
                        var target = this.target;
                        if (target === document.body) {
                            target = document.documentElement;
                            bounds = {
                                left: pageXOffset,
                                top: pageYOffset,
                                height: innerHeight,
                                width: innerWidth
                            };
                        } else {
                            bounds = getBounds(target);
                        }
                        var style = getComputedStyle(target);
                        var hasBottomScroll = target.scrollWidth > target.clientWidth || [ style.overflow, style.overflowX ].indexOf("scroll") >= 0 || this.target !== document.body;
                        var scrollBottom = 0;
                        if (hasBottomScroll) {
                            scrollBottom = 15;
                        }
                        var height = bounds.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - scrollBottom;
                        var out = {
                            width: 15,
                            height: height * .975 * (height / target.scrollHeight),
                            left: bounds.left + bounds.width - parseFloat(style.borderLeftWidth) - 15
                        };
                        var fitAdj = 0;
                        if (height < 408 && this.target === document.body) {
                            fitAdj = -11e-5 * Math.pow(height, 2) - .00727 * height + 22.58;
                        }
                        if (this.target !== document.body) {
                            out.height = Math.max(out.height, 24);
                        }
                        var scrollPercentage = this.target.scrollTop / (target.scrollHeight - height);
                        out.top = scrollPercentage * (height - out.height - fitAdj) + bounds.top + parseFloat(style.borderTopWidth);
                        if (this.target === document.body) {
                            out.height = Math.max(out.height, 24);
                        }
                        return out;
                    }
                } else {
                    return getBounds(this.target);
                }
            }
        }, {
            key: "clearCache",
            value: function clearCache() {
                this._cache = {};
            }
        }, {
            key: "cache",
            value: function cache(k, getter) {
                if (typeof this._cache === "undefined") {
                    this._cache = {};
                }
                if (typeof this._cache[k] === "undefined") {
                    this._cache[k] = getter.call(this);
                }
                return this._cache[k];
            }
        }, {
            key: "enable",
            value: function enable() {
                var _this3 = this;
                var pos = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
                if (!(this.options.addTargetClasses === false)) {
                    addClass(this.target, this.getClass("enabled"));
                }
                addClass(this.element, this.getClass("enabled"));
                this.enabled = true;
                this.scrollParents.forEach(function(parent) {
                    if (parent !== _this3.target.ownerDocument) {
                        parent.addEventListener("scroll", _this3.position);
                    }
                });
                if (pos) {
                    this.position();
                }
            }
        }, {
            key: "disable",
            value: function disable() {
                var _this4 = this;
                removeClass(this.target, this.getClass("enabled"));
                removeClass(this.element, this.getClass("enabled"));
                this.enabled = false;
                if (typeof this.scrollParents !== "undefined") {
                    this.scrollParents.forEach(function(parent) {
                        parent.removeEventListener("scroll", _this4.position);
                    });
                }
            }
        }, {
            key: "destroy",
            value: function destroy() {
                var _this5 = this;
                this.disable();
                tethers.forEach(function(tether, i) {
                    if (tether === _this5) {
                        tethers.splice(i, 1);
                    }
                });
                if (tethers.length === 0) {
                    removeUtilElements();
                }
            }
        }, {
            key: "updateAttachClasses",
            value: function updateAttachClasses(elementAttach, targetAttach) {
                var _this6 = this;
                elementAttach = elementAttach || this.attachment;
                targetAttach = targetAttach || this.targetAttachment;
                var sides = [ "left", "top", "bottom", "right", "middle", "center" ];
                if (typeof this._addAttachClasses !== "undefined" && this._addAttachClasses.length) {
                    this._addAttachClasses.splice(0, this._addAttachClasses.length);
                }
                if (typeof this._addAttachClasses === "undefined") {
                    this._addAttachClasses = [];
                }
                var add = this._addAttachClasses;
                if (elementAttach.top) {
                    add.push(this.getClass("element-attached") + "-" + elementAttach.top);
                }
                if (elementAttach.left) {
                    add.push(this.getClass("element-attached") + "-" + elementAttach.left);
                }
                if (targetAttach.top) {
                    add.push(this.getClass("target-attached") + "-" + targetAttach.top);
                }
                if (targetAttach.left) {
                    add.push(this.getClass("target-attached") + "-" + targetAttach.left);
                }
                var all = [];
                sides.forEach(function(side) {
                    all.push(_this6.getClass("element-attached") + "-" + side);
                    all.push(_this6.getClass("target-attached") + "-" + side);
                });
                defer(function() {
                    if (!(typeof _this6._addAttachClasses !== "undefined")) {
                        return;
                    }
                    updateClasses(_this6.element, _this6._addAttachClasses, all);
                    if (!(_this6.options.addTargetClasses === false)) {
                        updateClasses(_this6.target, _this6._addAttachClasses, all);
                    }
                    delete _this6._addAttachClasses;
                });
            }
        }, {
            key: "position",
            value: function position() {
                var _this7 = this;
                var flushChanges = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
                if (!this.enabled) {
                    return;
                }
                this.clearCache();
                var targetAttachment = autoToFixedAttachment(this.targetAttachment, this.attachment);
                this.updateAttachClasses(this.attachment, targetAttachment);
                var elementPos = this.cache("element-bounds", function() {
                    return getBounds(_this7.element);
                });
                var width = elementPos.width;
                var height = elementPos.height;
                if (width === 0 && height === 0 && typeof this.lastSize !== "undefined") {
                    var _lastSize = this.lastSize;
                    width = _lastSize.width;
                    height = _lastSize.height;
                } else {
                    this.lastSize = {
                        width: width,
                        height: height
                    };
                }
                var targetPos = this.cache("target-bounds", function() {
                    return _this7.getTargetBounds();
                });
                var targetSize = targetPos;
                var offset = offsetToPx(attachmentToOffset(this.attachment), {
                    width: width,
                    height: height
                });
                var targetOffset = offsetToPx(attachmentToOffset(targetAttachment), targetSize);
                var manualOffset = offsetToPx(this.offset, {
                    width: width,
                    height: height
                });
                var manualTargetOffset = offsetToPx(this.targetOffset, targetSize);
                offset = addOffset(offset, manualOffset);
                targetOffset = addOffset(targetOffset, manualTargetOffset);
                var left = targetPos.left + targetOffset.left - offset.left;
                var top = targetPos.top + targetOffset.top - offset.top;
                for (var i = 0; i < TetherBase.modules.length; ++i) {
                    var _module2 = TetherBase.modules[i];
                    var ret = _module2.position.call(this, {
                        left: left,
                        top: top,
                        targetAttachment: targetAttachment,
                        targetPos: targetPos,
                        elementPos: elementPos,
                        offset: offset,
                        targetOffset: targetOffset,
                        manualOffset: manualOffset,
                        manualTargetOffset: manualTargetOffset,
                        scrollbarSize: scrollbarSize,
                        attachment: this.attachment
                    });
                    if (ret === false) {
                        return false;
                    } else if (typeof ret === "undefined" || typeof ret !== "object") {
                        continue;
                    } else {
                        top = ret.top;
                        left = ret.left;
                    }
                }
                var next = {
                    page: {
                        top: top,
                        left: left
                    },
                    viewport: {
                        top: top - pageYOffset,
                        bottom: pageYOffset - top - height + innerHeight,
                        left: left - pageXOffset,
                        right: pageXOffset - left - width + innerWidth
                    }
                };
                var doc = this.target.ownerDocument;
                var win = doc.defaultView;
                var scrollbarSize = undefined;
                if (win.innerHeight > doc.documentElement.clientHeight) {
                    scrollbarSize = this.cache("scrollbar-size", getScrollBarSize);
                    next.viewport.bottom -= scrollbarSize.height;
                }
                if (win.innerWidth > doc.documentElement.clientWidth) {
                    scrollbarSize = this.cache("scrollbar-size", getScrollBarSize);
                    next.viewport.right -= scrollbarSize.width;
                }
                if ([ "", "static" ].indexOf(doc.body.style.position) === -1 || [ "", "static" ].indexOf(doc.body.parentElement.style.position) === -1) {
                    next.page.bottom = doc.body.scrollHeight - top - height;
                    next.page.right = doc.body.scrollWidth - left - width;
                }
                if (typeof this.options.optimizations !== "undefined" && this.options.optimizations.moveElement !== false && !(typeof this.targetModifier !== "undefined")) {
                    (function() {
                        var offsetParent = _this7.cache("target-offsetparent", function() {
                            return getOffsetParent(_this7.target);
                        });
                        var offsetPosition = _this7.cache("target-offsetparent-bounds", function() {
                            return getBounds(offsetParent);
                        });
                        var offsetParentStyle = getComputedStyle(offsetParent);
                        var offsetParentSize = offsetPosition;
                        var offsetBorder = {};
                        [ "Top", "Left", "Bottom", "Right" ].forEach(function(side) {
                            offsetBorder[side.toLowerCase()] = parseFloat(offsetParentStyle["border" + side + "Width"]);
                        });
                        offsetPosition.right = doc.body.scrollWidth - offsetPosition.left - offsetParentSize.width + offsetBorder.right;
                        offsetPosition.bottom = doc.body.scrollHeight - offsetPosition.top - offsetParentSize.height + offsetBorder.bottom;
                        if (next.page.top >= offsetPosition.top + offsetBorder.top && next.page.bottom >= offsetPosition.bottom) {
                            if (next.page.left >= offsetPosition.left + offsetBorder.left && next.page.right >= offsetPosition.right) {
                                var scrollTop = offsetParent.scrollTop;
                                var scrollLeft = offsetParent.scrollLeft;
                                next.offset = {
                                    top: next.page.top - offsetPosition.top + scrollTop - offsetBorder.top,
                                    left: next.page.left - offsetPosition.left + scrollLeft - offsetBorder.left
                                };
                            }
                        }
                    })();
                }
                this.move(next);
                this.history.unshift(next);
                if (this.history.length > 3) {
                    this.history.pop();
                }
                if (flushChanges) {
                    flush();
                }
                return true;
            }
        }, {
            key: "move",
            value: function move(pos) {
                var _this8 = this;
                if (!(typeof this.element.parentNode !== "undefined")) {
                    return;
                }
                var same = {};
                for (var type in pos) {
                    same[type] = {};
                    for (var key in pos[type]) {
                        var found = false;
                        for (var i = 0; i < this.history.length; ++i) {
                            var point = this.history[i];
                            if (typeof point[type] !== "undefined" && !within(point[type][key], pos[type][key])) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            same[type][key] = true;
                        }
                    }
                }
                var css = {
                    top: "",
                    left: "",
                    right: "",
                    bottom: ""
                };
                var transcribe = function transcribe(_same, _pos) {
                    var hasOptimizations = typeof _this8.options.optimizations !== "undefined";
                    var gpu = hasOptimizations ? _this8.options.optimizations.gpu : null;
                    if (gpu !== false) {
                        var yPos = undefined, xPos = undefined;
                        if (_same.top) {
                            css.top = 0;
                            yPos = _pos.top;
                        } else {
                            css.bottom = 0;
                            yPos = -_pos.bottom;
                        }
                        if (_same.left) {
                            css.left = 0;
                            xPos = _pos.left;
                        } else {
                            css.right = 0;
                            xPos = -_pos.right;
                        }
                        if (window.matchMedia) {
                            var retina = window.matchMedia("only screen and (min-resolution: 1.3dppx)").matches || window.matchMedia("only screen and (-webkit-min-device-pixel-ratio: 1.3)").matches;
                            if (!retina) {
                                xPos = Math.round(xPos);
                                yPos = Math.round(yPos);
                            }
                        }
                        css[transformKey] = "translateX(" + xPos + "px) translateY(" + yPos + "px)";
                        if (transformKey !== "msTransform") {
                            css[transformKey] += " translateZ(0)";
                        }
                    } else {
                        if (_same.top) {
                            css.top = _pos.top + "px";
                        } else {
                            css.bottom = _pos.bottom + "px";
                        }
                        if (_same.left) {
                            css.left = _pos.left + "px";
                        } else {
                            css.right = _pos.right + "px";
                        }
                    }
                };
                var moved = false;
                if ((same.page.top || same.page.bottom) && (same.page.left || same.page.right)) {
                    css.position = "absolute";
                    transcribe(same.page, pos.page);
                } else if ((same.viewport.top || same.viewport.bottom) && (same.viewport.left || same.viewport.right)) {
                    css.position = "fixed";
                    transcribe(same.viewport, pos.viewport);
                } else if (typeof same.offset !== "undefined" && same.offset.top && same.offset.left) {
                    (function() {
                        css.position = "absolute";
                        var offsetParent = _this8.cache("target-offsetparent", function() {
                            return getOffsetParent(_this8.target);
                        });
                        if (getOffsetParent(_this8.element) !== offsetParent) {
                            defer(function() {
                                _this8.element.parentNode.removeChild(_this8.element);
                                offsetParent.appendChild(_this8.element);
                            });
                        }
                        transcribe(same.offset, pos.offset);
                        moved = true;
                    })();
                } else {
                    css.position = "absolute";
                    transcribe({
                        top: true,
                        left: true
                    }, pos.page);
                }
                if (!moved) {
                    var offsetParentIsBody = true;
                    var currentNode = this.element.parentNode;
                    while (currentNode && currentNode.nodeType === 1 && currentNode.tagName !== "BODY") {
                        if (getComputedStyle(currentNode).position !== "static") {
                            offsetParentIsBody = false;
                            break;
                        }
                        currentNode = currentNode.parentNode;
                    }
                    if (!offsetParentIsBody) {
                        this.element.parentNode.removeChild(this.element);
                        this.element.ownerDocument.body.appendChild(this.element);
                    }
                }
                var writeCSS = {};
                var write = false;
                for (var key in css) {
                    var val = css[key];
                    var elVal = this.element.style[key];
                    if (elVal !== val) {
                        write = true;
                        writeCSS[key] = val;
                    }
                }
                if (write) {
                    defer(function() {
                        extend(_this8.element.style, writeCSS);
                        _this8.trigger("repositioned");
                    });
                }
            }
        } ]);
        return TetherClass;
    }(Evented);
    TetherClass.modules = [];
    TetherBase.position = position;
    var Tether = extend(TetherClass, TetherBase);
    "use strict";
    var _slicedToArray = function() {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;
            var _e = undefined;
            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);
                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"]) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }
            return _arr;
        }
        return function(arr, i) {
            if (Array.isArray(arr)) {
                return arr;
            } else if (Symbol.iterator in Object(arr)) {
                return sliceIterator(arr, i);
            } else {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
        };
    }();
    var _TetherBase$Utils = TetherBase.Utils;
    var getBounds = _TetherBase$Utils.getBounds;
    var extend = _TetherBase$Utils.extend;
    var updateClasses = _TetherBase$Utils.updateClasses;
    var defer = _TetherBase$Utils.defer;
    var BOUNDS_FORMAT = [ "left", "top", "right", "bottom" ];
    function getBoundingRect(tether, to) {
        if (to === "scrollParent") {
            to = tether.scrollParents[0];
        } else if (to === "window") {
            to = [ pageXOffset, pageYOffset, innerWidth + pageXOffset, innerHeight + pageYOffset ];
        }
        if (to === document) {
            to = to.documentElement;
        }
        if (typeof to.nodeType !== "undefined") {
            (function() {
                var node = to;
                var size = getBounds(to);
                var pos = size;
                var style = getComputedStyle(to);
                to = [ pos.left, pos.top, size.width + pos.left, size.height + pos.top ];
                if (node.ownerDocument !== document) {
                    var win = node.ownerDocument.defaultView;
                    to[0] += win.pageXOffset;
                    to[1] += win.pageYOffset;
                    to[2] += win.pageXOffset;
                    to[3] += win.pageYOffset;
                }
                BOUNDS_FORMAT.forEach(function(side, i) {
                    side = side[0].toUpperCase() + side.substr(1);
                    if (side === "Top" || side === "Left") {
                        to[i] += parseFloat(style["border" + side + "Width"]);
                    } else {
                        to[i] -= parseFloat(style["border" + side + "Width"]);
                    }
                });
            })();
        }
        return to;
    }
    TetherBase.modules.push({
        position: function position(_ref) {
            var _this = this;
            var top = _ref.top;
            var left = _ref.left;
            var targetAttachment = _ref.targetAttachment;
            if (!this.options.constraints) {
                return true;
            }
            var _cache = this.cache("element-bounds", function() {
                return getBounds(_this.element);
            });
            var height = _cache.height;
            var width = _cache.width;
            if (width === 0 && height === 0 && typeof this.lastSize !== "undefined") {
                var _lastSize = this.lastSize;
                width = _lastSize.width;
                height = _lastSize.height;
            }
            var targetSize = this.cache("target-bounds", function() {
                return _this.getTargetBounds();
            });
            var targetHeight = targetSize.height;
            var targetWidth = targetSize.width;
            var allClasses = [ this.getClass("pinned"), this.getClass("out-of-bounds") ];
            this.options.constraints.forEach(function(constraint) {
                var outOfBoundsClass = constraint.outOfBoundsClass;
                var pinnedClass = constraint.pinnedClass;
                if (outOfBoundsClass) {
                    allClasses.push(outOfBoundsClass);
                }
                if (pinnedClass) {
                    allClasses.push(pinnedClass);
                }
            });
            allClasses.forEach(function(cls) {
                [ "left", "top", "right", "bottom" ].forEach(function(side) {
                    allClasses.push(cls + "-" + side);
                });
            });
            var addClasses = [];
            var tAttachment = extend({}, targetAttachment);
            var eAttachment = extend({}, this.attachment);
            this.options.constraints.forEach(function(constraint) {
                var to = constraint.to;
                var attachment = constraint.attachment;
                var pin = constraint.pin;
                if (typeof attachment === "undefined") {
                    attachment = "";
                }
                var changeAttachX = undefined, changeAttachY = undefined;
                if (attachment.indexOf(" ") >= 0) {
                    var _attachment$split = attachment.split(" ");
                    var _attachment$split2 = _slicedToArray(_attachment$split, 2);
                    changeAttachY = _attachment$split2[0];
                    changeAttachX = _attachment$split2[1];
                } else {
                    changeAttachX = changeAttachY = attachment;
                }
                var bounds = getBoundingRect(_this, to);
                if (changeAttachY === "target" || changeAttachY === "both") {
                    if (top < bounds[1] && tAttachment.top === "top") {
                        top += targetHeight;
                        tAttachment.top = "bottom";
                    }
                    if (top + height > bounds[3] && tAttachment.top === "bottom") {
                        top -= targetHeight;
                        tAttachment.top = "top";
                    }
                }
                if (changeAttachY === "together") {
                    if (tAttachment.top === "top") {
                        if (eAttachment.top === "bottom" && top < bounds[1]) {
                            top += targetHeight;
                            tAttachment.top = "bottom";
                            top += height;
                            eAttachment.top = "top";
                        } else if (eAttachment.top === "top" && top + height > bounds[3] && top - (height - targetHeight) >= bounds[1]) {
                            top -= height - targetHeight;
                            tAttachment.top = "bottom";
                            eAttachment.top = "bottom";
                        }
                    }
                    if (tAttachment.top === "bottom") {
                        if (eAttachment.top === "top" && top + height > bounds[3]) {
                            top -= targetHeight;
                            tAttachment.top = "top";
                            top -= height;
                            eAttachment.top = "bottom";
                        } else if (eAttachment.top === "bottom" && top < bounds[1] && top + (height * 2 - targetHeight) <= bounds[3]) {
                            top += height - targetHeight;
                            tAttachment.top = "top";
                            eAttachment.top = "top";
                        }
                    }
                    if (tAttachment.top === "middle") {
                        if (top + height > bounds[3] && eAttachment.top === "top") {
                            top -= height;
                            eAttachment.top = "bottom";
                        } else if (top < bounds[1] && eAttachment.top === "bottom") {
                            top += height;
                            eAttachment.top = "top";
                        }
                    }
                }
                if (changeAttachX === "target" || changeAttachX === "both") {
                    if (left < bounds[0] && tAttachment.left === "left") {
                        left += targetWidth;
                        tAttachment.left = "right";
                    }
                    if (left + width > bounds[2] && tAttachment.left === "right") {
                        left -= targetWidth;
                        tAttachment.left = "left";
                    }
                }
                if (changeAttachX === "together") {
                    if (left < bounds[0] && tAttachment.left === "left") {
                        if (eAttachment.left === "right") {
                            left += targetWidth;
                            tAttachment.left = "right";
                            left += width;
                            eAttachment.left = "left";
                        } else if (eAttachment.left === "left") {
                            left += targetWidth;
                            tAttachment.left = "right";
                            left -= width;
                            eAttachment.left = "right";
                        }
                    } else if (left + width > bounds[2] && tAttachment.left === "right") {
                        if (eAttachment.left === "left") {
                            left -= targetWidth;
                            tAttachment.left = "left";
                            left -= width;
                            eAttachment.left = "right";
                        } else if (eAttachment.left === "right") {
                            left -= targetWidth;
                            tAttachment.left = "left";
                            left += width;
                            eAttachment.left = "left";
                        }
                    } else if (tAttachment.left === "center") {
                        if (left + width > bounds[2] && eAttachment.left === "left") {
                            left -= width;
                            eAttachment.left = "right";
                        } else if (left < bounds[0] && eAttachment.left === "right") {
                            left += width;
                            eAttachment.left = "left";
                        }
                    }
                }
                if (changeAttachY === "element" || changeAttachY === "both") {
                    if (top < bounds[1] && eAttachment.top === "bottom") {
                        top += height;
                        eAttachment.top = "top";
                    }
                    if (top + height > bounds[3] && eAttachment.top === "top") {
                        top -= height;
                        eAttachment.top = "bottom";
                    }
                }
                if (changeAttachX === "element" || changeAttachX === "both") {
                    if (left < bounds[0]) {
                        if (eAttachment.left === "right") {
                            left += width;
                            eAttachment.left = "left";
                        } else if (eAttachment.left === "center") {
                            left += width / 2;
                            eAttachment.left = "left";
                        }
                    }
                    if (left + width > bounds[2]) {
                        if (eAttachment.left === "left") {
                            left -= width;
                            eAttachment.left = "right";
                        } else if (eAttachment.left === "center") {
                            left -= width / 2;
                            eAttachment.left = "right";
                        }
                    }
                }
                if (typeof pin === "string") {
                    pin = pin.split(",").map(function(p) {
                        return p.trim();
                    });
                } else if (pin === true) {
                    pin = [ "top", "left", "right", "bottom" ];
                }
                pin = pin || [];
                var pinned = [];
                var oob = [];
                if (top < bounds[1]) {
                    if (pin.indexOf("top") >= 0) {
                        top = bounds[1];
                        pinned.push("top");
                    } else {
                        oob.push("top");
                    }
                }
                if (top + height > bounds[3]) {
                    if (pin.indexOf("bottom") >= 0) {
                        top = bounds[3] - height;
                        pinned.push("bottom");
                    } else {
                        oob.push("bottom");
                    }
                }
                if (left < bounds[0]) {
                    if (pin.indexOf("left") >= 0) {
                        left = bounds[0];
                        pinned.push("left");
                    } else {
                        oob.push("left");
                    }
                }
                if (left + width > bounds[2]) {
                    if (pin.indexOf("right") >= 0) {
                        left = bounds[2] - width;
                        pinned.push("right");
                    } else {
                        oob.push("right");
                    }
                }
                if (pinned.length) {
                    (function() {
                        var pinnedClass = undefined;
                        if (typeof _this.options.pinnedClass !== "undefined") {
                            pinnedClass = _this.options.pinnedClass;
                        } else {
                            pinnedClass = _this.getClass("pinned");
                        }
                        addClasses.push(pinnedClass);
                        pinned.forEach(function(side) {
                            addClasses.push(pinnedClass + "-" + side);
                        });
                    })();
                }
                if (oob.length) {
                    (function() {
                        var oobClass = undefined;
                        if (typeof _this.options.outOfBoundsClass !== "undefined") {
                            oobClass = _this.options.outOfBoundsClass;
                        } else {
                            oobClass = _this.getClass("out-of-bounds");
                        }
                        addClasses.push(oobClass);
                        oob.forEach(function(side) {
                            addClasses.push(oobClass + "-" + side);
                        });
                    })();
                }
                if (pinned.indexOf("left") >= 0 || pinned.indexOf("right") >= 0) {
                    eAttachment.left = tAttachment.left = false;
                }
                if (pinned.indexOf("top") >= 0 || pinned.indexOf("bottom") >= 0) {
                    eAttachment.top = tAttachment.top = false;
                }
                if (tAttachment.top !== targetAttachment.top || tAttachment.left !== targetAttachment.left || eAttachment.top !== _this.attachment.top || eAttachment.left !== _this.attachment.left) {
                    _this.updateAttachClasses(eAttachment, tAttachment);
                    _this.trigger("update", {
                        attachment: eAttachment,
                        targetAttachment: tAttachment
                    });
                }
            });
            defer(function() {
                if (!(_this.options.addTargetClasses === false)) {
                    updateClasses(_this.target, addClasses, allClasses);
                }
                updateClasses(_this.element, addClasses, allClasses);
            });
            return {
                top: top,
                left: left
            };
        }
    });
    "use strict";
    var _TetherBase$Utils = TetherBase.Utils;
    var getBounds = _TetherBase$Utils.getBounds;
    var updateClasses = _TetherBase$Utils.updateClasses;
    var defer = _TetherBase$Utils.defer;
    TetherBase.modules.push({
        position: function position(_ref) {
            var _this = this;
            var top = _ref.top;
            var left = _ref.left;
            var _cache = this.cache("element-bounds", function() {
                return getBounds(_this.element);
            });
            var height = _cache.height;
            var width = _cache.width;
            var targetPos = this.getTargetBounds();
            var bottom = top + height;
            var right = left + width;
            var abutted = [];
            if (top <= targetPos.bottom && bottom >= targetPos.top) {
                [ "left", "right" ].forEach(function(side) {
                    var targetPosSide = targetPos[side];
                    if (targetPosSide === left || targetPosSide === right) {
                        abutted.push(side);
                    }
                });
            }
            if (left <= targetPos.right && right >= targetPos.left) {
                [ "top", "bottom" ].forEach(function(side) {
                    var targetPosSide = targetPos[side];
                    if (targetPosSide === top || targetPosSide === bottom) {
                        abutted.push(side);
                    }
                });
            }
            var allClasses = [];
            var addClasses = [];
            var sides = [ "left", "top", "right", "bottom" ];
            allClasses.push(this.getClass("abutted"));
            sides.forEach(function(side) {
                allClasses.push(_this.getClass("abutted") + "-" + side);
            });
            if (abutted.length) {
                addClasses.push(this.getClass("abutted"));
            }
            abutted.forEach(function(side) {
                addClasses.push(_this.getClass("abutted") + "-" + side);
            });
            defer(function() {
                if (!(_this.options.addTargetClasses === false)) {
                    updateClasses(_this.target, addClasses, allClasses);
                }
                updateClasses(_this.element, addClasses, allClasses);
            });
            return true;
        }
    });
    "use strict";
    var _slicedToArray = function() {
        function sliceIterator(arr, i) {
            var _arr = [];
            var _n = true;
            var _d = false;
            var _e = undefined;
            try {
                for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                    _arr.push(_s.value);
                    if (i && _arr.length === i) break;
                }
            } catch (err) {
                _d = true;
                _e = err;
            } finally {
                try {
                    if (!_n && _i["return"]) _i["return"]();
                } finally {
                    if (_d) throw _e;
                }
            }
            return _arr;
        }
        return function(arr, i) {
            if (Array.isArray(arr)) {
                return arr;
            } else if (Symbol.iterator in Object(arr)) {
                return sliceIterator(arr, i);
            } else {
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            }
        };
    }();
    TetherBase.modules.push({
        position: function position(_ref) {
            var top = _ref.top;
            var left = _ref.left;
            if (!this.options.shift) {
                return;
            }
            var shift = this.options.shift;
            if (typeof this.options.shift === "function") {
                shift = this.options.shift.call(this, {
                    top: top,
                    left: left
                });
            }
            var shiftTop = undefined, shiftLeft = undefined;
            if (typeof shift === "string") {
                shift = shift.split(" ");
                shift[1] = shift[1] || shift[0];
                var _shift = shift;
                var _shift2 = _slicedToArray(_shift, 2);
                shiftTop = _shift2[0];
                shiftLeft = _shift2[1];
                shiftTop = parseFloat(shiftTop, 10);
                shiftLeft = parseFloat(shiftLeft, 10);
            } else {
                shiftTop = shift.top;
                shiftLeft = shift.left;
            }
            top += shiftTop;
            left += shiftLeft;
            return {
                top: top,
                left: left
            };
        }
    });
    return Tether;
});

(function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f();
    } else if (typeof define === "function" && define.amd) {
        define([], f);
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window;
        } else if (typeof global !== "undefined") {
            g = global;
        } else if (typeof self !== "undefined") {
            g = self;
        } else {
            g = this;
        }
        g.Clipboard = f();
    }
})(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f;
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e);
                }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s;
    }({
        1: [ function(require, module, exports) {
            var matches = require("matches-selector");
            module.exports = function(element, selector, checkYoSelf) {
                var parent = checkYoSelf ? element : element.parentNode;
                while (parent && parent !== document) {
                    if (matches(parent, selector)) return parent;
                    parent = parent.parentNode;
                }
            };
        }, {
            "matches-selector": 5
        } ],
        2: [ function(require, module, exports) {
            var closest = require("closest");
            function delegate(element, selector, type, callback, useCapture) {
                var listenerFn = listener.apply(this, arguments);
                element.addEventListener(type, listenerFn, useCapture);
                return {
                    destroy: function() {
                        element.removeEventListener(type, listenerFn, useCapture);
                    }
                };
            }
            function listener(element, selector, type, callback) {
                return function(e) {
                    e.delegateTarget = closest(e.target, selector, true);
                    if (e.delegateTarget) {
                        callback.call(element, e);
                    }
                };
            }
            module.exports = delegate;
        }, {
            closest: 1
        } ],
        3: [ function(require, module, exports) {
            exports.node = function(value) {
                return value !== undefined && value instanceof HTMLElement && value.nodeType === 1;
            };
            exports.nodeList = function(value) {
                var type = Object.prototype.toString.call(value);
                return value !== undefined && (type === "[object NodeList]" || type === "[object HTMLCollection]") && "length" in value && (value.length === 0 || exports.node(value[0]));
            };
            exports.string = function(value) {
                return typeof value === "string" || value instanceof String;
            };
            exports.fn = function(value) {
                var type = Object.prototype.toString.call(value);
                return type === "[object Function]";
            };
        }, {} ],
        4: [ function(require, module, exports) {
            var is = require("./is");
            var delegate = require("delegate");
            function listen(target, type, callback) {
                if (!target && !type && !callback) {
                    throw new Error("Missing required arguments");
                }
                if (!is.string(type)) {
                    throw new TypeError("Second argument must be a String");
                }
                if (!is.fn(callback)) {
                    throw new TypeError("Third argument must be a Function");
                }
                if (is.node(target)) {
                    return listenNode(target, type, callback);
                } else if (is.nodeList(target)) {
                    return listenNodeList(target, type, callback);
                } else if (is.string(target)) {
                    return listenSelector(target, type, callback);
                } else {
                    throw new TypeError("First argument must be a String, HTMLElement, HTMLCollection, or NodeList");
                }
            }
            function listenNode(node, type, callback) {
                node.addEventListener(type, callback);
                return {
                    destroy: function() {
                        node.removeEventListener(type, callback);
                    }
                };
            }
            function listenNodeList(nodeList, type, callback) {
                Array.prototype.forEach.call(nodeList, function(node) {
                    node.addEventListener(type, callback);
                });
                return {
                    destroy: function() {
                        Array.prototype.forEach.call(nodeList, function(node) {
                            node.removeEventListener(type, callback);
                        });
                    }
                };
            }
            function listenSelector(selector, type, callback) {
                return delegate(document.body, selector, type, callback);
            }
            module.exports = listen;
        }, {
            "./is": 3,
            delegate: 2
        } ],
        5: [ function(require, module, exports) {
            var proto = Element.prototype;
            var vendor = proto.matchesSelector || proto.webkitMatchesSelector || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector;
            module.exports = match;
            function match(el, selector) {
                if (vendor) return vendor.call(el, selector);
                var nodes = el.parentNode.querySelectorAll(selector);
                for (var i = 0; i < nodes.length; ++i) {
                    if (nodes[i] == el) return true;
                }
                return false;
            }
        }, {} ],
        6: [ function(require, module, exports) {
            function select(element) {
                var selectedText;
                if (element.nodeName === "INPUT" || element.nodeName === "TEXTAREA") {
                    element.focus();
                    element.setSelectionRange(0, element.value.length);
                    selectedText = element.value;
                } else {
                    if (element.hasAttribute("contenteditable")) {
                        element.focus();
                    }
                    var selection = window.getSelection();
                    var range = document.createRange();
                    range.selectNodeContents(element);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    selectedText = selection.toString();
                }
                return selectedText;
            }
            module.exports = select;
        }, {} ],
        7: [ function(require, module, exports) {
            function E() {}
            E.prototype = {
                on: function(name, callback, ctx) {
                    var e = this.e || (this.e = {});
                    (e[name] || (e[name] = [])).push({
                        fn: callback,
                        ctx: ctx
                    });
                    return this;
                },
                once: function(name, callback, ctx) {
                    var self = this;
                    function listener() {
                        self.off(name, listener);
                        callback.apply(ctx, arguments);
                    }
                    listener._ = callback;
                    return this.on(name, listener, ctx);
                },
                emit: function(name) {
                    var data = [].slice.call(arguments, 1);
                    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
                    var i = 0;
                    var len = evtArr.length;
                    for (i; i < len; i++) {
                        evtArr[i].fn.apply(evtArr[i].ctx, data);
                    }
                    return this;
                },
                off: function(name, callback) {
                    var e = this.e || (this.e = {});
                    var evts = e[name];
                    var liveEvents = [];
                    if (evts && callback) {
                        for (var i = 0, len = evts.length; i < len; i++) {
                            if (evts[i].fn !== callback && evts[i].fn._ !== callback) liveEvents.push(evts[i]);
                        }
                    }
                    liveEvents.length ? e[name] = liveEvents : delete e[name];
                    return this;
                }
            };
            module.exports = E;
        }, {} ],
        8: [ function(require, module, exports) {
            (function(global, factory) {
                if (typeof define === "function" && define.amd) {
                    define([ "module", "select" ], factory);
                } else if (typeof exports !== "undefined") {
                    factory(module, require("select"));
                } else {
                    var mod = {
                        exports: {}
                    };
                    factory(mod, global.select);
                    global.clipboardAction = mod.exports;
                }
            })(this, function(module, _select) {
                "use strict";
                var _select2 = _interopRequireDefault(_select);
                function _interopRequireDefault(obj) {
                    return obj && obj.__esModule ? obj : {
                        default: obj
                    };
                }
                var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
                    return typeof obj;
                } : function(obj) {
                    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
                };
                function _classCallCheck(instance, Constructor) {
                    if (!(instance instanceof Constructor)) {
                        throw new TypeError("Cannot call a class as a function");
                    }
                }
                var _createClass = function() {
                    function defineProperties(target, props) {
                        for (var i = 0; i < props.length; i++) {
                            var descriptor = props[i];
                            descriptor.enumerable = descriptor.enumerable || false;
                            descriptor.configurable = true;
                            if ("value" in descriptor) descriptor.writable = true;
                            Object.defineProperty(target, descriptor.key, descriptor);
                        }
                    }
                    return function(Constructor, protoProps, staticProps) {
                        if (protoProps) defineProperties(Constructor.prototype, protoProps);
                        if (staticProps) defineProperties(Constructor, staticProps);
                        return Constructor;
                    };
                }();
                var ClipboardAction = function() {
                    function ClipboardAction(options) {
                        _classCallCheck(this, ClipboardAction);
                        this.resolveOptions(options);
                        this.initSelection();
                    }
                    ClipboardAction.prototype.resolveOptions = function resolveOptions() {
                        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
                        this.action = options.action;
                        this.emitter = options.emitter;
                        this.target = options.target;
                        this.text = options.text;
                        this.trigger = options.trigger;
                        this.selectedText = "";
                    };
                    ClipboardAction.prototype.initSelection = function initSelection() {
                        if (this.text) {
                            this.selectFake();
                        } else if (this.target) {
                            this.selectTarget();
                        }
                    };
                    ClipboardAction.prototype.selectFake = function selectFake() {
                        var _this = this;
                        var isRTL = document.documentElement.getAttribute("dir") == "rtl";
                        this.removeFake();
                        this.fakeHandlerCallback = function() {
                            return _this.removeFake();
                        };
                        this.fakeHandler = document.body.addEventListener("click", this.fakeHandlerCallback) || true;
                        this.fakeElem = document.createElement("textarea");
                        this.fakeElem.style.fontSize = "12pt";
                        this.fakeElem.style.border = "0";
                        this.fakeElem.style.padding = "0";
                        this.fakeElem.style.margin = "0";
                        this.fakeElem.style.position = "absolute";
                        this.fakeElem.style[isRTL ? "right" : "left"] = "-9999px";
                        this.fakeElem.style.top = (window.pageYOffset || document.documentElement.scrollTop) + "px";
                        this.fakeElem.setAttribute("readonly", "");
                        this.fakeElem.value = this.text;
                        document.body.appendChild(this.fakeElem);
                        this.selectedText = (0, _select2.default)(this.fakeElem);
                        this.copyText();
                    };
                    ClipboardAction.prototype.removeFake = function removeFake() {
                        if (this.fakeHandler) {
                            document.body.removeEventListener("click", this.fakeHandlerCallback);
                            this.fakeHandler = null;
                            this.fakeHandlerCallback = null;
                        }
                        if (this.fakeElem) {
                            document.body.removeChild(this.fakeElem);
                            this.fakeElem = null;
                        }
                    };
                    ClipboardAction.prototype.selectTarget = function selectTarget() {
                        this.selectedText = (0, _select2.default)(this.target);
                        this.copyText();
                    };
                    ClipboardAction.prototype.copyText = function copyText() {
                        var succeeded = undefined;
                        try {
                            succeeded = document.execCommand(this.action);
                        } catch (err) {
                            succeeded = false;
                        }
                        this.handleResult(succeeded);
                    };
                    ClipboardAction.prototype.handleResult = function handleResult(succeeded) {
                        if (succeeded) {
                            this.emitter.emit("success", {
                                action: this.action,
                                text: this.selectedText,
                                trigger: this.trigger,
                                clearSelection: this.clearSelection.bind(this)
                            });
                        } else {
                            this.emitter.emit("error", {
                                action: this.action,
                                trigger: this.trigger,
                                clearSelection: this.clearSelection.bind(this)
                            });
                        }
                    };
                    ClipboardAction.prototype.clearSelection = function clearSelection() {
                        if (this.target) {
                            this.target.blur();
                        }
                        window.getSelection().removeAllRanges();
                    };
                    ClipboardAction.prototype.destroy = function destroy() {
                        this.removeFake();
                    };
                    _createClass(ClipboardAction, [ {
                        key: "action",
                        set: function set() {
                            var action = arguments.length <= 0 || arguments[0] === undefined ? "copy" : arguments[0];
                            this._action = action;
                            if (this._action !== "copy" && this._action !== "cut") {
                                throw new Error('Invalid "action" value, use either "copy" or "cut"');
                            }
                        },
                        get: function get() {
                            return this._action;
                        }
                    }, {
                        key: "target",
                        set: function set(target) {
                            if (target !== undefined) {
                                if (target && (typeof target === "undefined" ? "undefined" : _typeof(target)) === "object" && target.nodeType === 1) {
                                    if (this.action === "copy" && target.hasAttribute("disabled")) {
                                        throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');
                                    }
                                    if (this.action === "cut" && (target.hasAttribute("readonly") || target.hasAttribute("disabled"))) {
                                        throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes');
                                    }
                                    this._target = target;
                                } else {
                                    throw new Error('Invalid "target" value, use a valid Element');
                                }
                            }
                        },
                        get: function get() {
                            return this._target;
                        }
                    } ]);
                    return ClipboardAction;
                }();
                module.exports = ClipboardAction;
            });
        }, {
            select: 6
        } ],
        9: [ function(require, module, exports) {
            (function(global, factory) {
                if (typeof define === "function" && define.amd) {
                    define([ "module", "./clipboard-action", "tiny-emitter", "good-listener" ], factory);
                } else if (typeof exports !== "undefined") {
                    factory(module, require("./clipboard-action"), require("tiny-emitter"), require("good-listener"));
                } else {
                    var mod = {
                        exports: {}
                    };
                    factory(mod, global.clipboardAction, global.tinyEmitter, global.goodListener);
                    global.clipboard = mod.exports;
                }
            })(this, function(module, _clipboardAction, _tinyEmitter, _goodListener) {
                "use strict";
                var _clipboardAction2 = _interopRequireDefault(_clipboardAction);
                var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);
                var _goodListener2 = _interopRequireDefault(_goodListener);
                function _interopRequireDefault(obj) {
                    return obj && obj.__esModule ? obj : {
                        default: obj
                    };
                }
                function _classCallCheck(instance, Constructor) {
                    if (!(instance instanceof Constructor)) {
                        throw new TypeError("Cannot call a class as a function");
                    }
                }
                function _possibleConstructorReturn(self, call) {
                    if (!self) {
                        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                    }
                    return call && (typeof call === "object" || typeof call === "function") ? call : self;
                }
                function _inherits(subClass, superClass) {
                    if (typeof superClass !== "function" && superClass !== null) {
                        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
                    }
                    subClass.prototype = Object.create(superClass && superClass.prototype, {
                        constructor: {
                            value: subClass,
                            enumerable: false,
                            writable: true,
                            configurable: true
                        }
                    });
                    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
                }
                var Clipboard = function(_Emitter) {
                    _inherits(Clipboard, _Emitter);
                    function Clipboard(trigger, options) {
                        _classCallCheck(this, Clipboard);
                        var _this = _possibleConstructorReturn(this, _Emitter.call(this));
                        _this.resolveOptions(options);
                        _this.listenClick(trigger);
                        return _this;
                    }
                    Clipboard.prototype.resolveOptions = function resolveOptions() {
                        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
                        this.action = typeof options.action === "function" ? options.action : this.defaultAction;
                        this.target = typeof options.target === "function" ? options.target : this.defaultTarget;
                        this.text = typeof options.text === "function" ? options.text : this.defaultText;
                    };
                    Clipboard.prototype.listenClick = function listenClick(trigger) {
                        var _this2 = this;
                        this.listener = (0, _goodListener2.default)(trigger, "click", function(e) {
                            return _this2.onClick(e);
                        });
                    };
                    Clipboard.prototype.onClick = function onClick(e) {
                        var trigger = e.delegateTarget || e.currentTarget;
                        if (this.clipboardAction) {
                            this.clipboardAction = null;
                        }
                        this.clipboardAction = new _clipboardAction2.default({
                            action: this.action(trigger),
                            target: this.target(trigger),
                            text: this.text(trigger),
                            trigger: trigger,
                            emitter: this
                        });
                    };
                    Clipboard.prototype.defaultAction = function defaultAction(trigger) {
                        return getAttributeValue("action", trigger);
                    };
                    Clipboard.prototype.defaultTarget = function defaultTarget(trigger) {
                        var selector = getAttributeValue("target", trigger);
                        if (selector) {
                            return document.querySelector(selector);
                        }
                    };
                    Clipboard.prototype.defaultText = function defaultText(trigger) {
                        return getAttributeValue("text", trigger);
                    };
                    Clipboard.prototype.destroy = function destroy() {
                        this.listener.destroy();
                        if (this.clipboardAction) {
                            this.clipboardAction.destroy();
                            this.clipboardAction = null;
                        }
                    };
                    return Clipboard;
                }(_tinyEmitter2.default);
                function getAttributeValue(suffix, element) {
                    var attribute = "data-clipboard-" + suffix;
                    if (!element.hasAttribute(attribute)) {
                        return;
                    }
                    return element.getAttribute(attribute);
                }
                module.exports = Clipboard;
            });
        }, {
            "./clipboard-action": 8,
            "good-listener": 4,
            "tiny-emitter": 7
        } ]
    }, {}, [ 9 ])(9);
});

(function(global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ? factory(global, true) : function(w) {
            if (!w.document) {
                throw new Error("jQuery requires a window with a document");
            }
            return factory(w);
        };
    } else {
        factory(global);
    }
})(typeof window !== "undefined" ? window : this, function(window, noGlobal) {
    var arr = [];
    var document = window.document;
    var slice = arr.slice;
    var concat = arr.concat;
    var push = arr.push;
    var indexOf = arr.indexOf;
    var class2type = {};
    var toString = class2type.toString;
    var hasOwn = class2type.hasOwnProperty;
    var support = {};
    var version = "2.2.4", jQuery = function(selector, context) {
        return new jQuery.fn.init(selector, context);
    }, rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, rmsPrefix = /^-ms-/, rdashAlpha = /-([\da-z])/gi, fcamelCase = function(all, letter) {
        return letter.toUpperCase();
    };
    jQuery.fn = jQuery.prototype = {
        jquery: version,
        constructor: jQuery,
        selector: "",
        length: 0,
        toArray: function() {
            return slice.call(this);
        },
        get: function(num) {
            return num != null ? num < 0 ? this[num + this.length] : this[num] : slice.call(this);
        },
        pushStack: function(elems) {
            var ret = jQuery.merge(this.constructor(), elems);
            ret.prevObject = this;
            ret.context = this.context;
            return ret;
        },
        each: function(callback) {
            return jQuery.each(this, callback);
        },
        map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
                return callback.call(elem, i, elem);
            }));
        },
        slice: function() {
            return this.pushStack(slice.apply(this, arguments));
        },
        first: function() {
            return this.eq(0);
        },
        last: function() {
            return this.eq(-1);
        },
        eq: function(i) {
            var len = this.length, j = +i + (i < 0 ? len : 0);
            return this.pushStack(j >= 0 && j < len ? [ this[j] ] : []);
        },
        end: function() {
            return this.prevObject || this.constructor();
        },
        push: push,
        sort: arr.sort,
        splice: arr.splice
    };
    jQuery.extend = jQuery.fn.extend = function() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[i] || {};
            i++;
        }
        if (typeof target !== "object" && !jQuery.isFunction(target)) {
            target = {};
        }
        if (i === length) {
            target = this;
            i--;
        }
        for (;i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];
                    if (target === copy) {
                        continue;
                    }
                    if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && jQuery.isArray(src) ? src : [];
                        } else {
                            clone = src && jQuery.isPlainObject(src) ? src : {};
                        }
                        target[name] = jQuery.extend(deep, clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }
        return target;
    };
    jQuery.extend({
        expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
        isReady: true,
        error: function(msg) {
            throw new Error(msg);
        },
        noop: function() {},
        isFunction: function(obj) {
            return jQuery.type(obj) === "function";
        },
        isArray: Array.isArray,
        isWindow: function(obj) {
            return obj != null && obj === obj.window;
        },
        isNumeric: function(obj) {
            var realStringObj = obj && obj.toString();
            return !jQuery.isArray(obj) && realStringObj - parseFloat(realStringObj) + 1 >= 0;
        },
        isPlainObject: function(obj) {
            var key;
            if (jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)) {
                return false;
            }
            if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype || {}, "isPrototypeOf")) {
                return false;
            }
            for (key in obj) {}
            return key === undefined || hasOwn.call(obj, key);
        },
        isEmptyObject: function(obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },
        type: function(obj) {
            if (obj == null) {
                return obj + "";
            }
            return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
        },
        globalEval: function(code) {
            var script, indirect = eval;
            code = jQuery.trim(code);
            if (code) {
                if (code.indexOf("use strict") === 1) {
                    script = document.createElement("script");
                    script.text = code;
                    document.head.appendChild(script).parentNode.removeChild(script);
                } else {
                    indirect(code);
                }
            }
        },
        camelCase: function(string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },
        nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },
        each: function(obj, callback) {
            var length, i = 0;
            if (isArrayLike(obj)) {
                length = obj.length;
                for (;i < length; i++) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            }
            return obj;
        },
        trim: function(text) {
            return text == null ? "" : (text + "").replace(rtrim, "");
        },
        makeArray: function(arr, results) {
            var ret = results || [];
            if (arr != null) {
                if (isArrayLike(Object(arr))) {
                    jQuery.merge(ret, typeof arr === "string" ? [ arr ] : arr);
                } else {
                    push.call(ret, arr);
                }
            }
            return ret;
        },
        inArray: function(elem, arr, i) {
            return arr == null ? -1 : indexOf.call(arr, elem, i);
        },
        merge: function(first, second) {
            var len = +second.length, j = 0, i = first.length;
            for (;j < len; j++) {
                first[i++] = second[j];
            }
            first.length = i;
            return first;
        },
        grep: function(elems, callback, invert) {
            var callbackInverse, matches = [], i = 0, length = elems.length, callbackExpect = !invert;
            for (;i < length; i++) {
                callbackInverse = !callback(elems[i], i);
                if (callbackInverse !== callbackExpect) {
                    matches.push(elems[i]);
                }
            }
            return matches;
        },
        map: function(elems, callback, arg) {
            var length, value, i = 0, ret = [];
            if (isArrayLike(elems)) {
                length = elems.length;
                for (;i < length; i++) {
                    value = callback(elems[i], i, arg);
                    if (value != null) {
                        ret.push(value);
                    }
                }
            } else {
                for (i in elems) {
                    value = callback(elems[i], i, arg);
                    if (value != null) {
                        ret.push(value);
                    }
                }
            }
            return concat.apply([], ret);
        },
        guid: 1,
        proxy: function(fn, context) {
            var tmp, args, proxy;
            if (typeof context === "string") {
                tmp = fn[context];
                context = fn;
                fn = tmp;
            }
            if (!jQuery.isFunction(fn)) {
                return undefined;
            }
            args = slice.call(arguments, 2);
            proxy = function() {
                return fn.apply(context || this, args.concat(slice.call(arguments)));
            };
            proxy.guid = fn.guid = fn.guid || jQuery.guid++;
            return proxy;
        },
        now: Date.now,
        support: support
    });
    if (typeof Symbol === "function") {
        jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
    }
    jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
    });
    function isArrayLike(obj) {
        var length = !!obj && "length" in obj && obj.length, type = jQuery.type(obj);
        if (type === "function" || jQuery.isWindow(obj)) {
            return false;
        }
        return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
    }
    var Sizzle = function(window) {
        var i, support, Expr, getText, isXML, tokenize, compile, select, outermostContext, sortInput, hasDuplicate, setDocument, document, docElem, documentIsHTML, rbuggyQSA, rbuggyMatches, matches, contains, expando = "sizzle" + 1 * new Date(), preferredDoc = window.document, dirruns = 0, done = 0, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), sortOrder = function(a, b) {
            if (a === b) {
                hasDuplicate = true;
            }
            return 0;
        }, MAX_NEGATIVE = 1 << 31, hasOwn = {}.hasOwnProperty, arr = [], pop = arr.pop, push_native = arr.push, push = arr.push, slice = arr.slice, indexOf = function(list, elem) {
            var i = 0, len = list.length;
            for (;i < len; i++) {
                if (list[i] === elem) {
                    return i;
                }
            }
            return -1;
        }, booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", whitespace = "[\\x20\\t\\r\\n\\f]", identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + "*([*^$|!~]?=)" + whitespace + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]", pseudos = ":(" + identifier + ")(?:\\((" + "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" + "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" + ".*" + ")\\)|)", rwhitespace = new RegExp(whitespace + "+", "g"), rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"), rattributeQuotes = new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g"), rpseudo = new RegExp(pseudos), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = {
            ID: new RegExp("^#(" + identifier + ")"),
            CLASS: new RegExp("^\\.(" + identifier + ")"),
            TAG: new RegExp("^(" + identifier + "|[*])"),
            ATTR: new RegExp("^" + attributes),
            PSEUDO: new RegExp("^" + pseudos),
            CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
            bool: new RegExp("^(?:" + booleans + ")$", "i"),
            needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
        }, rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rnative = /^[^{]+\{\s*\[native \w/, rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, rsibling = /[+~]/, rescape = /'|\\/g, runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"), funescape = function(_, escaped, escapedWhitespace) {
            var high = "0x" + escaped - 65536;
            return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
        }, unloadHandler = function() {
            setDocument();
        };
        try {
            push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);
            arr[preferredDoc.childNodes.length].nodeType;
        } catch (e) {
            push = {
                apply: arr.length ? function(target, els) {
                    push_native.apply(target, slice.call(els));
                } : function(target, els) {
                    var j = target.length, i = 0;
                    while (target[j++] = els[i++]) {}
                    target.length = j - 1;
                }
            };
        }
        function Sizzle(selector, context, results, seed) {
            var m, i, elem, nid, nidselect, match, groups, newSelector, newContext = context && context.ownerDocument, nodeType = context ? context.nodeType : 9;
            results = results || [];
            if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
                return results;
            }
            if (!seed) {
                if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
                    setDocument(context);
                }
                context = context || document;
                if (documentIsHTML) {
                    if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
                        if (m = match[1]) {
                            if (nodeType === 9) {
                                if (elem = context.getElementById(m)) {
                                    if (elem.id === m) {
                                        results.push(elem);
                                        return results;
                                    }
                                } else {
                                    return results;
                                }
                            } else {
                                if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {
                                    results.push(elem);
                                    return results;
                                }
                            }
                        } else if (match[2]) {
                            push.apply(results, context.getElementsByTagName(selector));
                            return results;
                        } else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {
                            push.apply(results, context.getElementsByClassName(m));
                            return results;
                        }
                    }
                    if (support.qsa && !compilerCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
                        if (nodeType !== 1) {
                            newContext = context;
                            newSelector = selector;
                        } else if (context.nodeName.toLowerCase() !== "object") {
                            if (nid = context.getAttribute("id")) {
                                nid = nid.replace(rescape, "\\$&");
                            } else {
                                context.setAttribute("id", nid = expando);
                            }
                            groups = tokenize(selector);
                            i = groups.length;
                            nidselect = ridentifier.test(nid) ? "#" + nid : "[id='" + nid + "']";
                            while (i--) {
                                groups[i] = nidselect + " " + toSelector(groups[i]);
                            }
                            newSelector = groups.join(",");
                            newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
                        }
                        if (newSelector) {
                            try {
                                push.apply(results, newContext.querySelectorAll(newSelector));
                                return results;
                            } catch (qsaError) {} finally {
                                if (nid === expando) {
                                    context.removeAttribute("id");
                                }
                            }
                        }
                    }
                }
            }
            return select(selector.replace(rtrim, "$1"), context, results, seed);
        }
        function createCache() {
            var keys = [];
            function cache(key, value) {
                if (keys.push(key + " ") > Expr.cacheLength) {
                    delete cache[keys.shift()];
                }
                return cache[key + " "] = value;
            }
            return cache;
        }
        function markFunction(fn) {
            fn[expando] = true;
            return fn;
        }
        function assert(fn) {
            var div = document.createElement("div");
            try {
                return !!fn(div);
            } catch (e) {
                return false;
            } finally {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
                div = null;
            }
        }
        function addHandle(attrs, handler) {
            var arr = attrs.split("|"), i = arr.length;
            while (i--) {
                Expr.attrHandle[arr[i]] = handler;
            }
        }
        function siblingCheck(a, b) {
            var cur = b && a, diff = cur && a.nodeType === 1 && b.nodeType === 1 && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE);
            if (diff) {
                return diff;
            }
            if (cur) {
                while (cur = cur.nextSibling) {
                    if (cur === b) {
                        return -1;
                    }
                }
            }
            return a ? 1 : -1;
        }
        function createInputPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return name === "input" && elem.type === type;
            };
        }
        function createButtonPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return (name === "input" || name === "button") && elem.type === type;
            };
        }
        function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
                argument = +argument;
                return markFunction(function(seed, matches) {
                    var j, matchIndexes = fn([], seed.length, argument), i = matchIndexes.length;
                    while (i--) {
                        if (seed[j = matchIndexes[i]]) {
                            seed[j] = !(matches[j] = seed[j]);
                        }
                    }
                });
            });
        }
        function testContext(context) {
            return context && typeof context.getElementsByTagName !== "undefined" && context;
        }
        support = Sizzle.support = {};
        isXML = Sizzle.isXML = function(elem) {
            var documentElement = elem && (elem.ownerDocument || elem).documentElement;
            return documentElement ? documentElement.nodeName !== "HTML" : false;
        };
        setDocument = Sizzle.setDocument = function(node) {
            var hasCompare, parent, doc = node ? node.ownerDocument || node : preferredDoc;
            if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
                return document;
            }
            document = doc;
            docElem = document.documentElement;
            documentIsHTML = !isXML(document);
            if ((parent = document.defaultView) && parent.top !== parent) {
                if (parent.addEventListener) {
                    parent.addEventListener("unload", unloadHandler, false);
                } else if (parent.attachEvent) {
                    parent.attachEvent("onunload", unloadHandler);
                }
            }
            support.attributes = assert(function(div) {
                div.className = "i";
                return !div.getAttribute("className");
            });
            support.getElementsByTagName = assert(function(div) {
                div.appendChild(document.createComment(""));
                return !div.getElementsByTagName("*").length;
            });
            support.getElementsByClassName = rnative.test(document.getElementsByClassName);
            support.getById = assert(function(div) {
                docElem.appendChild(div).id = expando;
                return !document.getElementsByName || !document.getElementsByName(expando).length;
            });
            if (support.getById) {
                Expr.find["ID"] = function(id, context) {
                    if (typeof context.getElementById !== "undefined" && documentIsHTML) {
                        var m = context.getElementById(id);
                        return m ? [ m ] : [];
                    }
                };
                Expr.filter["ID"] = function(id) {
                    var attrId = id.replace(runescape, funescape);
                    return function(elem) {
                        return elem.getAttribute("id") === attrId;
                    };
                };
            } else {
                delete Expr.find["ID"];
                Expr.filter["ID"] = function(id) {
                    var attrId = id.replace(runescape, funescape);
                    return function(elem) {
                        var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                        return node && node.value === attrId;
                    };
                };
            }
            Expr.find["TAG"] = support.getElementsByTagName ? function(tag, context) {
                if (typeof context.getElementsByTagName !== "undefined") {
                    return context.getElementsByTagName(tag);
                } else if (support.qsa) {
                    return context.querySelectorAll(tag);
                }
            } : function(tag, context) {
                var elem, tmp = [], i = 0, results = context.getElementsByTagName(tag);
                if (tag === "*") {
                    while (elem = results[i++]) {
                        if (elem.nodeType === 1) {
                            tmp.push(elem);
                        }
                    }
                    return tmp;
                }
                return results;
            };
            Expr.find["CLASS"] = support.getElementsByClassName && function(className, context) {
                if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
                    return context.getElementsByClassName(className);
                }
            };
            rbuggyMatches = [];
            rbuggyQSA = [];
            if (support.qsa = rnative.test(document.querySelectorAll)) {
                assert(function(div) {
                    docElem.appendChild(div).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\r\\' msallowcapture=''>" + "<option selected=''></option></select>";
                    if (div.querySelectorAll("[msallowcapture^='']").length) {
                        rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
                    }
                    if (!div.querySelectorAll("[selected]").length) {
                        rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
                    }
                    if (!div.querySelectorAll("[id~=" + expando + "-]").length) {
                        rbuggyQSA.push("~=");
                    }
                    if (!div.querySelectorAll(":checked").length) {
                        rbuggyQSA.push(":checked");
                    }
                    if (!div.querySelectorAll("a#" + expando + "+*").length) {
                        rbuggyQSA.push(".#.+[+~]");
                    }
                });
                assert(function(div) {
                    var input = document.createElement("input");
                    input.setAttribute("type", "hidden");
                    div.appendChild(input).setAttribute("name", "D");
                    if (div.querySelectorAll("[name=d]").length) {
                        rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");
                    }
                    if (!div.querySelectorAll(":enabled").length) {
                        rbuggyQSA.push(":enabled", ":disabled");
                    }
                    div.querySelectorAll("*,:x");
                    rbuggyQSA.push(",.*:");
                });
            }
            if (support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) {
                assert(function(div) {
                    support.disconnectedMatch = matches.call(div, "div");
                    matches.call(div, "[s!='']:x");
                    rbuggyMatches.push("!=", pseudos);
                });
            }
            rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
            rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));
            hasCompare = rnative.test(docElem.compareDocumentPosition);
            contains = hasCompare || rnative.test(docElem.contains) ? function(a, b) {
                var adown = a.nodeType === 9 ? a.documentElement : a, bup = b && b.parentNode;
                return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
            } : function(a, b) {
                if (b) {
                    while (b = b.parentNode) {
                        if (b === a) {
                            return true;
                        }
                    }
                }
                return false;
            };
            sortOrder = hasCompare ? function(a, b) {
                if (a === b) {
                    hasDuplicate = true;
                    return 0;
                }
                var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
                if (compare) {
                    return compare;
                }
                compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1;
                if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {
                    if (a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a)) {
                        return -1;
                    }
                    if (b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b)) {
                        return 1;
                    }
                    return sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
                }
                return compare & 4 ? -1 : 1;
            } : function(a, b) {
                if (a === b) {
                    hasDuplicate = true;
                    return 0;
                }
                var cur, i = 0, aup = a.parentNode, bup = b.parentNode, ap = [ a ], bp = [ b ];
                if (!aup || !bup) {
                    return a === document ? -1 : b === document ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
                } else if (aup === bup) {
                    return siblingCheck(a, b);
                }
                cur = a;
                while (cur = cur.parentNode) {
                    ap.unshift(cur);
                }
                cur = b;
                while (cur = cur.parentNode) {
                    bp.unshift(cur);
                }
                while (ap[i] === bp[i]) {
                    i++;
                }
                return i ? siblingCheck(ap[i], bp[i]) : ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
            };
            return document;
        };
        Sizzle.matches = function(expr, elements) {
            return Sizzle(expr, null, null, elements);
        };
        Sizzle.matchesSelector = function(elem, expr) {
            if ((elem.ownerDocument || elem) !== document) {
                setDocument(elem);
            }
            expr = expr.replace(rattributeQuotes, "='$1']");
            if (support.matchesSelector && documentIsHTML && !compilerCache[expr + " "] && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
                try {
                    var ret = matches.call(elem, expr);
                    if (ret || support.disconnectedMatch || elem.document && elem.document.nodeType !== 11) {
                        return ret;
                    }
                } catch (e) {}
            }
            return Sizzle(expr, document, null, [ elem ]).length > 0;
        };
        Sizzle.contains = function(context, elem) {
            if ((context.ownerDocument || context) !== document) {
                setDocument(context);
            }
            return contains(context, elem);
        };
        Sizzle.attr = function(elem, name) {
            if ((elem.ownerDocument || elem) !== document) {
                setDocument(elem);
            }
            var fn = Expr.attrHandle[name.toLowerCase()], val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
            return val !== undefined ? val : support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
        };
        Sizzle.error = function(msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
        };
        Sizzle.uniqueSort = function(results) {
            var elem, duplicates = [], j = 0, i = 0;
            hasDuplicate = !support.detectDuplicates;
            sortInput = !support.sortStable && results.slice(0);
            results.sort(sortOrder);
            if (hasDuplicate) {
                while (elem = results[i++]) {
                    if (elem === results[i]) {
                        j = duplicates.push(i);
                    }
                }
                while (j--) {
                    results.splice(duplicates[j], 1);
                }
            }
            sortInput = null;
            return results;
        };
        getText = Sizzle.getText = function(elem) {
            var node, ret = "", i = 0, nodeType = elem.nodeType;
            if (!nodeType) {
                while (node = elem[i++]) {
                    ret += getText(node);
                }
            } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
                if (typeof elem.textContent === "string") {
                    return elem.textContent;
                } else {
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                        ret += getText(elem);
                    }
                }
            } else if (nodeType === 3 || nodeType === 4) {
                return elem.nodeValue;
            }
            return ret;
        };
        Expr = Sizzle.selectors = {
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            attrHandle: {},
            find: {},
            relative: {
                ">": {
                    dir: "parentNode",
                    first: true
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: true
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(match) {
                    match[1] = match[1].replace(runescape, funescape);
                    match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);
                    if (match[2] === "~=") {
                        match[3] = " " + match[3] + " ";
                    }
                    return match.slice(0, 4);
                },
                CHILD: function(match) {
                    match[1] = match[1].toLowerCase();
                    if (match[1].slice(0, 3) === "nth") {
                        if (!match[3]) {
                            Sizzle.error(match[0]);
                        }
                        match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
                        match[5] = +(match[7] + match[8] || match[3] === "odd");
                    } else if (match[3]) {
                        Sizzle.error(match[0]);
                    }
                    return match;
                },
                PSEUDO: function(match) {
                    var excess, unquoted = !match[6] && match[2];
                    if (matchExpr["CHILD"].test(match[0])) {
                        return null;
                    }
                    if (match[3]) {
                        match[2] = match[4] || match[5] || "";
                    } else if (unquoted && rpseudo.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
                        match[0] = match[0].slice(0, excess);
                        match[2] = unquoted.slice(0, excess);
                    }
                    return match.slice(0, 3);
                }
            },
            filter: {
                TAG: function(nodeNameSelector) {
                    var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
                    return nodeNameSelector === "*" ? function() {
                        return true;
                    } : function(elem) {
                        return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                    };
                },
                CLASS: function(className) {
                    var pattern = classCache[className + " "];
                    return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                        return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");
                    });
                },
                ATTR: function(name, operator, check) {
                    return function(elem) {
                        var result = Sizzle.attr(elem, name);
                        if (result == null) {
                            return operator === "!=";
                        }
                        if (!operator) {
                            return true;
                        }
                        result += "";
                        return operator === "=" ? result === check : operator === "!=" ? result !== check : operator === "^=" ? check && result.indexOf(check) === 0 : operator === "*=" ? check && result.indexOf(check) > -1 : operator === "$=" ? check && result.slice(-check.length) === check : operator === "~=" ? (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1 : operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" : false;
                    };
                },
                CHILD: function(type, what, argument, first, last) {
                    var simple = type.slice(0, 3) !== "nth", forward = type.slice(-4) !== "last", ofType = what === "of-type";
                    return first === 1 && last === 0 ? function(elem) {
                        return !!elem.parentNode;
                    } : function(elem, context, xml) {
                        var cache, uniqueCache, outerCache, node, nodeIndex, start, dir = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
                        if (parent) {
                            if (simple) {
                                while (dir) {
                                    node = elem;
                                    while (node = node[dir]) {
                                        if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
                                            return false;
                                        }
                                    }
                                    start = dir = type === "only" && !start && "nextSibling";
                                }
                                return true;
                            }
                            start = [ forward ? parent.firstChild : parent.lastChild ];
                            if (forward && useCache) {
                                node = parent;
                                outerCache = node[expando] || (node[expando] = {});
                                uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                                cache = uniqueCache[type] || [];
                                nodeIndex = cache[0] === dirruns && cache[1];
                                diff = nodeIndex && cache[2];
                                node = nodeIndex && parent.childNodes[nodeIndex];
                                while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
                                    if (node.nodeType === 1 && ++diff && node === elem) {
                                        uniqueCache[type] = [ dirruns, nodeIndex, diff ];
                                        break;
                                    }
                                }
                            } else {
                                if (useCache) {
                                    node = elem;
                                    outerCache = node[expando] || (node[expando] = {});
                                    uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                                    cache = uniqueCache[type] || [];
                                    nodeIndex = cache[0] === dirruns && cache[1];
                                    diff = nodeIndex;
                                }
                                if (diff === false) {
                                    while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {
                                        if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
                                            if (useCache) {
                                                outerCache = node[expando] || (node[expando] = {});
                                                uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                                                uniqueCache[type] = [ dirruns, diff ];
                                            }
                                            if (node === elem) {
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            diff -= last;
                            return diff === first || diff % first === 0 && diff / first >= 0;
                        }
                    };
                },
                PSEUDO: function(pseudo, argument) {
                    var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
                    if (fn[expando]) {
                        return fn(argument);
                    }
                    if (fn.length > 1) {
                        args = [ pseudo, pseudo, "", argument ];
                        return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches) {
                            var idx, matched = fn(seed, argument), i = matched.length;
                            while (i--) {
                                idx = indexOf(seed, matched[i]);
                                seed[idx] = !(matches[idx] = matched[i]);
                            }
                        }) : function(elem) {
                            return fn(elem, 0, args);
                        };
                    }
                    return fn;
                }
            },
            pseudos: {
                not: markFunction(function(selector) {
                    var input = [], results = [], matcher = compile(selector.replace(rtrim, "$1"));
                    return matcher[expando] ? markFunction(function(seed, matches, context, xml) {
                        var elem, unmatched = matcher(seed, null, xml, []), i = seed.length;
                        while (i--) {
                            if (elem = unmatched[i]) {
                                seed[i] = !(matches[i] = elem);
                            }
                        }
                    }) : function(elem, context, xml) {
                        input[0] = elem;
                        matcher(input, null, xml, results);
                        input[0] = null;
                        return !results.pop();
                    };
                }),
                has: markFunction(function(selector) {
                    return function(elem) {
                        return Sizzle(selector, elem).length > 0;
                    };
                }),
                contains: markFunction(function(text) {
                    text = text.replace(runescape, funescape);
                    return function(elem) {
                        return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
                    };
                }),
                lang: markFunction(function(lang) {
                    if (!ridentifier.test(lang || "")) {
                        Sizzle.error("unsupported lang: " + lang);
                    }
                    lang = lang.replace(runescape, funescape).toLowerCase();
                    return function(elem) {
                        var elemLang;
                        do {
                            if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                                elemLang = elemLang.toLowerCase();
                                return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
                            }
                        } while ((elem = elem.parentNode) && elem.nodeType === 1);
                        return false;
                    };
                }),
                target: function(elem) {
                    var hash = window.location && window.location.hash;
                    return hash && hash.slice(1) === elem.id;
                },
                root: function(elem) {
                    return elem === docElem;
                },
                focus: function(elem) {
                    return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
                },
                enabled: function(elem) {
                    return elem.disabled === false;
                },
                disabled: function(elem) {
                    return elem.disabled === true;
                },
                checked: function(elem) {
                    var nodeName = elem.nodeName.toLowerCase();
                    return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;
                },
                selected: function(elem) {
                    if (elem.parentNode) {
                        elem.parentNode.selectedIndex;
                    }
                    return elem.selected === true;
                },
                empty: function(elem) {
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                        if (elem.nodeType < 6) {
                            return false;
                        }
                    }
                    return true;
                },
                parent: function(elem) {
                    return !Expr.pseudos["empty"](elem);
                },
                header: function(elem) {
                    return rheader.test(elem.nodeName);
                },
                input: function(elem) {
                    return rinputs.test(elem.nodeName);
                },
                button: function(elem) {
                    var name = elem.nodeName.toLowerCase();
                    return name === "input" && elem.type === "button" || name === "button";
                },
                text: function(elem) {
                    var attr;
                    return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ((attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
                },
                first: createPositionalPseudo(function() {
                    return [ 0 ];
                }),
                last: createPositionalPseudo(function(matchIndexes, length) {
                    return [ length - 1 ];
                }),
                eq: createPositionalPseudo(function(matchIndexes, length, argument) {
                    return [ argument < 0 ? argument + length : argument ];
                }),
                even: createPositionalPseudo(function(matchIndexes, length) {
                    var i = 0;
                    for (;i < length; i += 2) {
                        matchIndexes.push(i);
                    }
                    return matchIndexes;
                }),
                odd: createPositionalPseudo(function(matchIndexes, length) {
                    var i = 1;
                    for (;i < length; i += 2) {
                        matchIndexes.push(i);
                    }
                    return matchIndexes;
                }),
                lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    var i = argument < 0 ? argument + length : argument;
                    for (;--i >= 0; ) {
                        matchIndexes.push(i);
                    }
                    return matchIndexes;
                }),
                gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    var i = argument < 0 ? argument + length : argument;
                    for (;++i < length; ) {
                        matchIndexes.push(i);
                    }
                    return matchIndexes;
                })
            }
        };
        Expr.pseudos["nth"] = Expr.pseudos["eq"];
        for (i in {
            radio: true,
            checkbox: true,
            file: true,
            password: true,
            image: true
        }) {
            Expr.pseudos[i] = createInputPseudo(i);
        }
        for (i in {
            submit: true,
            reset: true
        }) {
            Expr.pseudos[i] = createButtonPseudo(i);
        }
        function setFilters() {}
        setFilters.prototype = Expr.filters = Expr.pseudos;
        Expr.setFilters = new setFilters();
        tokenize = Sizzle.tokenize = function(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
            if (cached) {
                return parseOnly ? 0 : cached.slice(0);
            }
            soFar = selector;
            groups = [];
            preFilters = Expr.preFilter;
            while (soFar) {
                if (!matched || (match = rcomma.exec(soFar))) {
                    if (match) {
                        soFar = soFar.slice(match[0].length) || soFar;
                    }
                    groups.push(tokens = []);
                }
                matched = false;
                if (match = rcombinators.exec(soFar)) {
                    matched = match.shift();
                    tokens.push({
                        value: matched,
                        type: match[0].replace(rtrim, " ")
                    });
                    soFar = soFar.slice(matched.length);
                }
                for (type in Expr.filter) {
                    if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
                        matched = match.shift();
                        tokens.push({
                            value: matched,
                            type: type,
                            matches: match
                        });
                        soFar = soFar.slice(matched.length);
                    }
                }
                if (!matched) {
                    break;
                }
            }
            return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
        };
        function toSelector(tokens) {
            var i = 0, len = tokens.length, selector = "";
            for (;i < len; i++) {
                selector += tokens[i].value;
            }
            return selector;
        }
        function addCombinator(matcher, combinator, base) {
            var dir = combinator.dir, checkNonElements = base && dir === "parentNode", doneName = done++;
            return combinator.first ? function(elem, context, xml) {
                while (elem = elem[dir]) {
                    if (elem.nodeType === 1 || checkNonElements) {
                        return matcher(elem, context, xml);
                    }
                }
            } : function(elem, context, xml) {
                var oldCache, uniqueCache, outerCache, newCache = [ dirruns, doneName ];
                if (xml) {
                    while (elem = elem[dir]) {
                        if (elem.nodeType === 1 || checkNonElements) {
                            if (matcher(elem, context, xml)) {
                                return true;
                            }
                        }
                    }
                } else {
                    while (elem = elem[dir]) {
                        if (elem.nodeType === 1 || checkNonElements) {
                            outerCache = elem[expando] || (elem[expando] = {});
                            uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});
                            if ((oldCache = uniqueCache[dir]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                                return newCache[2] = oldCache[2];
                            } else {
                                uniqueCache[dir] = newCache;
                                if (newCache[2] = matcher(elem, context, xml)) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            };
        }
        function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
                var i = matchers.length;
                while (i--) {
                    if (!matchers[i](elem, context, xml)) {
                        return false;
                    }
                }
                return true;
            } : matchers[0];
        }
        function multipleContexts(selector, contexts, results) {
            var i = 0, len = contexts.length;
            for (;i < len; i++) {
                Sizzle(selector, contexts[i], results);
            }
            return results;
        }
        function condense(unmatched, map, filter, context, xml) {
            var elem, newUnmatched = [], i = 0, len = unmatched.length, mapped = map != null;
            for (;i < len; i++) {
                if (elem = unmatched[i]) {
                    if (!filter || filter(elem, context, xml)) {
                        newUnmatched.push(elem);
                        if (mapped) {
                            map.push(i);
                        }
                    }
                }
            }
            return newUnmatched;
        }
        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            if (postFilter && !postFilter[expando]) {
                postFilter = setMatcher(postFilter);
            }
            if (postFinder && !postFinder[expando]) {
                postFinder = setMatcher(postFinder, postSelector);
            }
            return markFunction(function(seed, results, context, xml) {
                var temp, i, elem, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(selector || "*", context.nodeType ? [ context ] : context, []), matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems, matcherOut = matcher ? postFinder || (seed ? preFilter : preexisting || postFilter) ? [] : results : matcherIn;
                if (matcher) {
                    matcher(matcherIn, matcherOut, context, xml);
                }
                if (postFilter) {
                    temp = condense(matcherOut, postMap);
                    postFilter(temp, [], context, xml);
                    i = temp.length;
                    while (i--) {
                        if (elem = temp[i]) {
                            matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
                        }
                    }
                }
                if (seed) {
                    if (postFinder || preFilter) {
                        if (postFinder) {
                            temp = [];
                            i = matcherOut.length;
                            while (i--) {
                                if (elem = matcherOut[i]) {
                                    temp.push(matcherIn[i] = elem);
                                }
                            }
                            postFinder(null, matcherOut = [], temp, xml);
                        }
                        i = matcherOut.length;
                        while (i--) {
                            if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {
                                seed[temp] = !(results[temp] = elem);
                            }
                        }
                    }
                } else {
                    matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
                    if (postFinder) {
                        postFinder(null, results, matcherOut, xml);
                    } else {
                        push.apply(results, matcherOut);
                    }
                }
            });
        }
        function matcherFromTokens(tokens) {
            var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
                return elem === checkContext;
            }, implicitRelative, true), matchAnyContext = addCombinator(function(elem) {
                return indexOf(checkContext, elem) > -1;
            }, implicitRelative, true), matchers = [ function(elem, context, xml) {
                var ret = !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
                checkContext = null;
                return ret;
            } ];
            for (;i < len; i++) {
                if (matcher = Expr.relative[tokens[i].type]) {
                    matchers = [ addCombinator(elementMatcher(matchers), matcher) ];
                } else {
                    matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);
                    if (matcher[expando]) {
                        j = ++i;
                        for (;j < len; j++) {
                            if (Expr.relative[tokens[j].type]) {
                                break;
                            }
                        }
                        return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(tokens.slice(0, i - 1).concat({
                            value: tokens[i - 2].type === " " ? "*" : ""
                        })).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));
                    }
                    matchers.push(matcher);
                }
            }
            return elementMatcher(matchers);
        }
        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, outermost) {
                var elem, j, matcher, matchedCount = 0, i = "0", unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && Expr.find["TAG"]("*", outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || .1, len = elems.length;
                if (outermost) {
                    outermostContext = context === document || context || outermost;
                }
                for (;i !== len && (elem = elems[i]) != null; i++) {
                    if (byElement && elem) {
                        j = 0;
                        if (!context && elem.ownerDocument !== document) {
                            setDocument(elem);
                            xml = !documentIsHTML;
                        }
                        while (matcher = elementMatchers[j++]) {
                            if (matcher(elem, context || document, xml)) {
                                results.push(elem);
                                break;
                            }
                        }
                        if (outermost) {
                            dirruns = dirrunsUnique;
                        }
                    }
                    if (bySet) {
                        if (elem = !matcher && elem) {
                            matchedCount--;
                        }
                        if (seed) {
                            unmatched.push(elem);
                        }
                    }
                }
                matchedCount += i;
                if (bySet && i !== matchedCount) {
                    j = 0;
                    while (matcher = setMatchers[j++]) {
                        matcher(unmatched, setMatched, context, xml);
                    }
                    if (seed) {
                        if (matchedCount > 0) {
                            while (i--) {
                                if (!(unmatched[i] || setMatched[i])) {
                                    setMatched[i] = pop.call(results);
                                }
                            }
                        }
                        setMatched = condense(setMatched);
                    }
                    push.apply(results, setMatched);
                    if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                        Sizzle.uniqueSort(results);
                    }
                }
                if (outermost) {
                    dirruns = dirrunsUnique;
                    outermostContext = contextBackup;
                }
                return unmatched;
            };
            return bySet ? markFunction(superMatcher) : superMatcher;
        }
        compile = Sizzle.compile = function(selector, match) {
            var i, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
            if (!cached) {
                if (!match) {
                    match = tokenize(selector);
                }
                i = match.length;
                while (i--) {
                    cached = matcherFromTokens(match[i]);
                    if (cached[expando]) {
                        setMatchers.push(cached);
                    } else {
                        elementMatchers.push(cached);
                    }
                }
                cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
                cached.selector = selector;
            }
            return cached;
        };
        select = Sizzle.select = function(selector, context, results, seed) {
            var i, tokens, token, type, find, compiled = typeof selector === "function" && selector, match = !seed && tokenize(selector = compiled.selector || selector);
            results = results || [];
            if (match.length === 1) {
                tokens = match[0] = match[0].slice(0);
                if (tokens.length > 2 && (token = tokens[0]).type === "ID" && support.getById && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
                    context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
                    if (!context) {
                        return results;
                    } else if (compiled) {
                        context = context.parentNode;
                    }
                    selector = selector.slice(tokens.shift().value.length);
                }
                i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
                while (i--) {
                    token = tokens[i];
                    if (Expr.relative[type = token.type]) {
                        break;
                    }
                    if (find = Expr.find[type]) {
                        if (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)) {
                            tokens.splice(i, 1);
                            selector = seed.length && toSelector(tokens);
                            if (!selector) {
                                push.apply(results, seed);
                                return results;
                            }
                            break;
                        }
                    }
                }
            }
            (compiled || compile(selector, match))(seed, context, !documentIsHTML, results, !context || rsibling.test(selector) && testContext(context.parentNode) || context);
            return results;
        };
        support.sortStable = expando.split("").sort(sortOrder).join("") === expando;
        support.detectDuplicates = !!hasDuplicate;
        setDocument();
        support.sortDetached = assert(function(div1) {
            return div1.compareDocumentPosition(document.createElement("div")) & 1;
        });
        if (!assert(function(div) {
            div.innerHTML = "<a href='#'></a>";
            return div.firstChild.getAttribute("href") === "#";
        })) {
            addHandle("type|href|height|width", function(elem, name, isXML) {
                if (!isXML) {
                    return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
                }
            });
        }
        if (!support.attributes || !assert(function(div) {
            div.innerHTML = "<input/>";
            div.firstChild.setAttribute("value", "");
            return div.firstChild.getAttribute("value") === "";
        })) {
            addHandle("value", function(elem, name, isXML) {
                if (!isXML && elem.nodeName.toLowerCase() === "input") {
                    return elem.defaultValue;
                }
            });
        }
        if (!assert(function(div) {
            return div.getAttribute("disabled") == null;
        })) {
            addHandle(booleans, function(elem, name, isXML) {
                var val;
                if (!isXML) {
                    return elem[name] === true ? name.toLowerCase() : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
                }
            });
        }
        return Sizzle;
    }(window);
    jQuery.find = Sizzle;
    jQuery.expr = Sizzle.selectors;
    jQuery.expr[":"] = jQuery.expr.pseudos;
    jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
    jQuery.text = Sizzle.getText;
    jQuery.isXMLDoc = Sizzle.isXML;
    jQuery.contains = Sizzle.contains;
    var dir = function(elem, dir, until) {
        var matched = [], truncate = until !== undefined;
        while ((elem = elem[dir]) && elem.nodeType !== 9) {
            if (elem.nodeType === 1) {
                if (truncate && jQuery(elem).is(until)) {
                    break;
                }
                matched.push(elem);
            }
        }
        return matched;
    };
    var siblings = function(n, elem) {
        var matched = [];
        for (;n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== elem) {
                matched.push(n);
            }
        }
        return matched;
    };
    var rneedsContext = jQuery.expr.match.needsContext;
    var rsingleTag = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/;
    var risSimple = /^.[^:#\[\.,]*$/;
    function winnow(elements, qualifier, not) {
        if (jQuery.isFunction(qualifier)) {
            return jQuery.grep(elements, function(elem, i) {
                return !!qualifier.call(elem, i, elem) !== not;
            });
        }
        if (qualifier.nodeType) {
            return jQuery.grep(elements, function(elem) {
                return elem === qualifier !== not;
            });
        }
        if (typeof qualifier === "string") {
            if (risSimple.test(qualifier)) {
                return jQuery.filter(qualifier, elements, not);
            }
            qualifier = jQuery.filter(qualifier, elements);
        }
        return jQuery.grep(elements, function(elem) {
            return indexOf.call(qualifier, elem) > -1 !== not;
        });
    }
    jQuery.filter = function(expr, elems, not) {
        var elem = elems[0];
        if (not) {
            expr = ":not(" + expr + ")";
        }
        return elems.length === 1 && elem.nodeType === 1 ? jQuery.find.matchesSelector(elem, expr) ? [ elem ] : [] : jQuery.find.matches(expr, jQuery.grep(elems, function(elem) {
            return elem.nodeType === 1;
        }));
    };
    jQuery.fn.extend({
        find: function(selector) {
            var i, len = this.length, ret = [], self = this;
            if (typeof selector !== "string") {
                return this.pushStack(jQuery(selector).filter(function() {
                    for (i = 0; i < len; i++) {
                        if (jQuery.contains(self[i], this)) {
                            return true;
                        }
                    }
                }));
            }
            for (i = 0; i < len; i++) {
                jQuery.find(selector, self[i], ret);
            }
            ret = this.pushStack(len > 1 ? jQuery.unique(ret) : ret);
            ret.selector = this.selector ? this.selector + " " + selector : selector;
            return ret;
        },
        filter: function(selector) {
            return this.pushStack(winnow(this, selector || [], false));
        },
        not: function(selector) {
            return this.pushStack(winnow(this, selector || [], true));
        },
        is: function(selector) {
            return !!winnow(this, typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [], false).length;
        }
    });
    var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, init = jQuery.fn.init = function(selector, context, root) {
        var match, elem;
        if (!selector) {
            return this;
        }
        root = root || rootjQuery;
        if (typeof selector === "string") {
            if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
                match = [ null, selector, null ];
            } else {
                match = rquickExpr.exec(selector);
            }
            if (match && (match[1] || !context)) {
                if (match[1]) {
                    context = context instanceof jQuery ? context[0] : context;
                    jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
                    if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
                        for (match in context) {
                            if (jQuery.isFunction(this[match])) {
                                this[match](context[match]);
                            } else {
                                this.attr(match, context[match]);
                            }
                        }
                    }
                    return this;
                } else {
                    elem = document.getElementById(match[2]);
                    if (elem && elem.parentNode) {
                        this.length = 1;
                        this[0] = elem;
                    }
                    this.context = document;
                    this.selector = selector;
                    return this;
                }
            } else if (!context || context.jquery) {
                return (context || root).find(selector);
            } else {
                return this.constructor(context).find(selector);
            }
        } else if (selector.nodeType) {
            this.context = this[0] = selector;
            this.length = 1;
            return this;
        } else if (jQuery.isFunction(selector)) {
            return root.ready !== undefined ? root.ready(selector) : selector(jQuery);
        }
        if (selector.selector !== undefined) {
            this.selector = selector.selector;
            this.context = selector.context;
        }
        return jQuery.makeArray(selector, this);
    };
    init.prototype = jQuery.fn;
    rootjQuery = jQuery(document);
    var rparentsprev = /^(?:parents|prev(?:Until|All))/, guaranteedUnique = {
        children: true,
        contents: true,
        next: true,
        prev: true
    };
    jQuery.fn.extend({
        has: function(target) {
            var targets = jQuery(target, this), l = targets.length;
            return this.filter(function() {
                var i = 0;
                for (;i < l; i++) {
                    if (jQuery.contains(this, targets[i])) {
                        return true;
                    }
                }
            });
        },
        closest: function(selectors, context) {
            var cur, i = 0, l = this.length, matched = [], pos = rneedsContext.test(selectors) || typeof selectors !== "string" ? jQuery(selectors, context || this.context) : 0;
            for (;i < l; i++) {
                for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
                    if (cur.nodeType < 11 && (pos ? pos.index(cur) > -1 : cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))) {
                        matched.push(cur);
                        break;
                    }
                }
            }
            return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
        },
        index: function(elem) {
            if (!elem) {
                return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
            }
            if (typeof elem === "string") {
                return indexOf.call(jQuery(elem), this[0]);
            }
            return indexOf.call(this, elem.jquery ? elem[0] : elem);
        },
        add: function(selector, context) {
            return this.pushStack(jQuery.uniqueSort(jQuery.merge(this.get(), jQuery(selector, context))));
        },
        addBack: function(selector) {
            return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector));
        }
    });
    function sibling(cur, dir) {
        while ((cur = cur[dir]) && cur.nodeType !== 1) {}
        return cur;
    }
    jQuery.each({
        parent: function(elem) {
            var parent = elem.parentNode;
            return parent && parent.nodeType !== 11 ? parent : null;
        },
        parents: function(elem) {
            return dir(elem, "parentNode");
        },
        parentsUntil: function(elem, i, until) {
            return dir(elem, "parentNode", until);
        },
        next: function(elem) {
            return sibling(elem, "nextSibling");
        },
        prev: function(elem) {
            return sibling(elem, "previousSibling");
        },
        nextAll: function(elem) {
            return dir(elem, "nextSibling");
        },
        prevAll: function(elem) {
            return dir(elem, "previousSibling");
        },
        nextUntil: function(elem, i, until) {
            return dir(elem, "nextSibling", until);
        },
        prevUntil: function(elem, i, until) {
            return dir(elem, "previousSibling", until);
        },
        siblings: function(elem) {
            return siblings((elem.parentNode || {}).firstChild, elem);
        },
        children: function(elem) {
            return siblings(elem.firstChild);
        },
        contents: function(elem) {
            return elem.contentDocument || jQuery.merge([], elem.childNodes);
        }
    }, function(name, fn) {
        jQuery.fn[name] = function(until, selector) {
            var matched = jQuery.map(this, fn, until);
            if (name.slice(-5) !== "Until") {
                selector = until;
            }
            if (selector && typeof selector === "string") {
                matched = jQuery.filter(selector, matched);
            }
            if (this.length > 1) {
                if (!guaranteedUnique[name]) {
                    jQuery.uniqueSort(matched);
                }
                if (rparentsprev.test(name)) {
                    matched.reverse();
                }
            }
            return this.pushStack(matched);
        };
    });
    var rnotwhite = /\S+/g;
    function createOptions(options) {
        var object = {};
        jQuery.each(options.match(rnotwhite) || [], function(_, flag) {
            object[flag] = true;
        });
        return object;
    }
    jQuery.Callbacks = function(options) {
        options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);
        var firing, memory, fired, locked, list = [], queue = [], firingIndex = -1, fire = function() {
            locked = options.once;
            fired = firing = true;
            for (;queue.length; firingIndex = -1) {
                memory = queue.shift();
                while (++firingIndex < list.length) {
                    if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
                        firingIndex = list.length;
                        memory = false;
                    }
                }
            }
            if (!options.memory) {
                memory = false;
            }
            firing = false;
            if (locked) {
                if (memory) {
                    list = [];
                } else {
                    list = "";
                }
            }
        }, self = {
            add: function() {
                if (list) {
                    if (memory && !firing) {
                        firingIndex = list.length - 1;
                        queue.push(memory);
                    }
                    (function add(args) {
                        jQuery.each(args, function(_, arg) {
                            if (jQuery.isFunction(arg)) {
                                if (!options.unique || !self.has(arg)) {
                                    list.push(arg);
                                }
                            } else if (arg && arg.length && jQuery.type(arg) !== "string") {
                                add(arg);
                            }
                        });
                    })(arguments);
                    if (memory && !firing) {
                        fire();
                    }
                }
                return this;
            },
            remove: function() {
                jQuery.each(arguments, function(_, arg) {
                    var index;
                    while ((index = jQuery.inArray(arg, list, index)) > -1) {
                        list.splice(index, 1);
                        if (index <= firingIndex) {
                            firingIndex--;
                        }
                    }
                });
                return this;
            },
            has: function(fn) {
                return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
            },
            empty: function() {
                if (list) {
                    list = [];
                }
                return this;
            },
            disable: function() {
                locked = queue = [];
                list = memory = "";
                return this;
            },
            disabled: function() {
                return !list;
            },
            lock: function() {
                locked = queue = [];
                if (!memory) {
                    list = memory = "";
                }
                return this;
            },
            locked: function() {
                return !!locked;
            },
            fireWith: function(context, args) {
                if (!locked) {
                    args = args || [];
                    args = [ context, args.slice ? args.slice() : args ];
                    queue.push(args);
                    if (!firing) {
                        fire();
                    }
                }
                return this;
            },
            fire: function() {
                self.fireWith(this, arguments);
                return this;
            },
            fired: function() {
                return !!fired;
            }
        };
        return self;
    };
    jQuery.extend({
        Deferred: function(func) {
            var tuples = [ [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ], [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ], [ "notify", "progress", jQuery.Callbacks("memory") ] ], state = "pending", promise = {
                state: function() {
                    return state;
                },
                always: function() {
                    deferred.done(arguments).fail(arguments);
                    return this;
                },
                then: function() {
                    var fns = arguments;
                    return jQuery.Deferred(function(newDefer) {
                        jQuery.each(tuples, function(i, tuple) {
                            var fn = jQuery.isFunction(fns[i]) && fns[i];
                            deferred[tuple[1]](function() {
                                var returned = fn && fn.apply(this, arguments);
                                if (returned && jQuery.isFunction(returned.promise)) {
                                    returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                                } else {
                                    newDefer[tuple[0] + "With"](this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments);
                                }
                            });
                        });
                        fns = null;
                    }).promise();
                },
                promise: function(obj) {
                    return obj != null ? jQuery.extend(obj, promise) : promise;
                }
            }, deferred = {};
            promise.pipe = promise.then;
            jQuery.each(tuples, function(i, tuple) {
                var list = tuple[2], stateString = tuple[3];
                promise[tuple[1]] = list.add;
                if (stateString) {
                    list.add(function() {
                        state = stateString;
                    }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
                }
                deferred[tuple[0]] = function() {
                    deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments);
                    return this;
                };
                deferred[tuple[0] + "With"] = list.fireWith;
            });
            promise.promise(deferred);
            if (func) {
                func.call(deferred, deferred);
            }
            return deferred;
        },
        when: function(subordinate) {
            var i = 0, resolveValues = slice.call(arguments), length = resolveValues.length, remaining = length !== 1 || subordinate && jQuery.isFunction(subordinate.promise) ? length : 0, deferred = remaining === 1 ? subordinate : jQuery.Deferred(), updateFunc = function(i, contexts, values) {
                return function(value) {
                    contexts[i] = this;
                    values[i] = arguments.length > 1 ? slice.call(arguments) : value;
                    if (values === progressValues) {
                        deferred.notifyWith(contexts, values);
                    } else if (!--remaining) {
                        deferred.resolveWith(contexts, values);
                    }
                };
            }, progressValues, progressContexts, resolveContexts;
            if (length > 1) {
                progressValues = new Array(length);
                progressContexts = new Array(length);
                resolveContexts = new Array(length);
                for (;i < length; i++) {
                    if (resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)) {
                        resolveValues[i].promise().progress(updateFunc(i, progressContexts, progressValues)).done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject);
                    } else {
                        --remaining;
                    }
                }
            }
            if (!remaining) {
                deferred.resolveWith(resolveContexts, resolveValues);
            }
            return deferred.promise();
        }
    });
    var readyList;
    jQuery.fn.ready = function(fn) {
        jQuery.ready.promise().done(fn);
        return this;
    };
    jQuery.extend({
        isReady: false,
        readyWait: 1,
        holdReady: function(hold) {
            if (hold) {
                jQuery.readyWait++;
            } else {
                jQuery.ready(true);
            }
        },
        ready: function(wait) {
            if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
                return;
            }
            jQuery.isReady = true;
            if (wait !== true && --jQuery.readyWait > 0) {
                return;
            }
            readyList.resolveWith(document, [ jQuery ]);
            if (jQuery.fn.triggerHandler) {
                jQuery(document).triggerHandler("ready");
                jQuery(document).off("ready");
            }
        }
    });
    function completed() {
        document.removeEventListener("DOMContentLoaded", completed);
        window.removeEventListener("load", completed);
        jQuery.ready();
    }
    jQuery.ready.promise = function(obj) {
        if (!readyList) {
            readyList = jQuery.Deferred();
            if (document.readyState === "complete" || document.readyState !== "loading" && !document.documentElement.doScroll) {
                window.setTimeout(jQuery.ready);
            } else {
                document.addEventListener("DOMContentLoaded", completed);
                window.addEventListener("load", completed);
            }
        }
        return readyList.promise(obj);
    };
    jQuery.ready.promise();
    var access = function(elems, fn, key, value, chainable, emptyGet, raw) {
        var i = 0, len = elems.length, bulk = key == null;
        if (jQuery.type(key) === "object") {
            chainable = true;
            for (i in key) {
                access(elems, fn, i, key[i], true, emptyGet, raw);
            }
        } else if (value !== undefined) {
            chainable = true;
            if (!jQuery.isFunction(value)) {
                raw = true;
            }
            if (bulk) {
                if (raw) {
                    fn.call(elems, value);
                    fn = null;
                } else {
                    bulk = fn;
                    fn = function(elem, key, value) {
                        return bulk.call(jQuery(elem), value);
                    };
                }
            }
            if (fn) {
                for (;i < len; i++) {
                    fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
                }
            }
        }
        return chainable ? elems : bulk ? fn.call(elems) : len ? fn(elems[0], key) : emptyGet;
    };
    var acceptData = function(owner) {
        return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
    };
    function Data() {
        this.expando = jQuery.expando + Data.uid++;
    }
    Data.uid = 1;
    Data.prototype = {
        register: function(owner, initial) {
            var value = initial || {};
            if (owner.nodeType) {
                owner[this.expando] = value;
            } else {
                Object.defineProperty(owner, this.expando, {
                    value: value,
                    writable: true,
                    configurable: true
                });
            }
            return owner[this.expando];
        },
        cache: function(owner) {
            if (!acceptData(owner)) {
                return {};
            }
            var value = owner[this.expando];
            if (!value) {
                value = {};
                if (acceptData(owner)) {
                    if (owner.nodeType) {
                        owner[this.expando] = value;
                    } else {
                        Object.defineProperty(owner, this.expando, {
                            value: value,
                            configurable: true
                        });
                    }
                }
            }
            return value;
        },
        set: function(owner, data, value) {
            var prop, cache = this.cache(owner);
            if (typeof data === "string") {
                cache[data] = value;
            } else {
                for (prop in data) {
                    cache[prop] = data[prop];
                }
            }
            return cache;
        },
        get: function(owner, key) {
            return key === undefined ? this.cache(owner) : owner[this.expando] && owner[this.expando][key];
        },
        access: function(owner, key, value) {
            var stored;
            if (key === undefined || key && typeof key === "string" && value === undefined) {
                stored = this.get(owner, key);
                return stored !== undefined ? stored : this.get(owner, jQuery.camelCase(key));
            }
            this.set(owner, key, value);
            return value !== undefined ? value : key;
        },
        remove: function(owner, key) {
            var i, name, camel, cache = owner[this.expando];
            if (cache === undefined) {
                return;
            }
            if (key === undefined) {
                this.register(owner);
            } else {
                if (jQuery.isArray(key)) {
                    name = key.concat(key.map(jQuery.camelCase));
                } else {
                    camel = jQuery.camelCase(key);
                    if (key in cache) {
                        name = [ key, camel ];
                    } else {
                        name = camel;
                        name = name in cache ? [ name ] : name.match(rnotwhite) || [];
                    }
                }
                i = name.length;
                while (i--) {
                    delete cache[name[i]];
                }
            }
            if (key === undefined || jQuery.isEmptyObject(cache)) {
                if (owner.nodeType) {
                    owner[this.expando] = undefined;
                } else {
                    delete owner[this.expando];
                }
            }
        },
        hasData: function(owner) {
            var cache = owner[this.expando];
            return cache !== undefined && !jQuery.isEmptyObject(cache);
        }
    };
    var dataPriv = new Data();
    var dataUser = new Data();
    var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
    function dataAttr(elem, key, data) {
        var name;
        if (data === undefined && elem.nodeType === 1) {
            name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
            data = elem.getAttribute(name);
            if (typeof data === "string") {
                try {
                    data = data === "true" ? true : data === "false" ? false : data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? jQuery.parseJSON(data) : data;
                } catch (e) {}
                dataUser.set(elem, key, data);
            } else {
                data = undefined;
            }
        }
        return data;
    }
    jQuery.extend({
        hasData: function(elem) {
            return dataUser.hasData(elem) || dataPriv.hasData(elem);
        },
        data: function(elem, name, data) {
            return dataUser.access(elem, name, data);
        },
        removeData: function(elem, name) {
            dataUser.remove(elem, name);
        },
        _data: function(elem, name, data) {
            return dataPriv.access(elem, name, data);
        },
        _removeData: function(elem, name) {
            dataPriv.remove(elem, name);
        }
    });
    jQuery.fn.extend({
        data: function(key, value) {
            var i, name, data, elem = this[0], attrs = elem && elem.attributes;
            if (key === undefined) {
                if (this.length) {
                    data = dataUser.get(elem);
                    if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
                        i = attrs.length;
                        while (i--) {
                            if (attrs[i]) {
                                name = attrs[i].name;
                                if (name.indexOf("data-") === 0) {
                                    name = jQuery.camelCase(name.slice(5));
                                    dataAttr(elem, name, data[name]);
                                }
                            }
                        }
                        dataPriv.set(elem, "hasDataAttrs", true);
                    }
                }
                return data;
            }
            if (typeof key === "object") {
                return this.each(function() {
                    dataUser.set(this, key);
                });
            }
            return access(this, function(value) {
                var data, camelKey;
                if (elem && value === undefined) {
                    data = dataUser.get(elem, key) || dataUser.get(elem, key.replace(rmultiDash, "-$&").toLowerCase());
                    if (data !== undefined) {
                        return data;
                    }
                    camelKey = jQuery.camelCase(key);
                    data = dataUser.get(elem, camelKey);
                    if (data !== undefined) {
                        return data;
                    }
                    data = dataAttr(elem, camelKey, undefined);
                    if (data !== undefined) {
                        return data;
                    }
                    return;
                }
                camelKey = jQuery.camelCase(key);
                this.each(function() {
                    var data = dataUser.get(this, camelKey);
                    dataUser.set(this, camelKey, value);
                    if (key.indexOf("-") > -1 && data !== undefined) {
                        dataUser.set(this, key, value);
                    }
                });
            }, null, value, arguments.length > 1, null, true);
        },
        removeData: function(key) {
            return this.each(function() {
                dataUser.remove(this, key);
            });
        }
    });
    jQuery.extend({
        queue: function(elem, type, data) {
            var queue;
            if (elem) {
                type = (type || "fx") + "queue";
                queue = dataPriv.get(elem, type);
                if (data) {
                    if (!queue || jQuery.isArray(data)) {
                        queue = dataPriv.access(elem, type, jQuery.makeArray(data));
                    } else {
                        queue.push(data);
                    }
                }
                return queue || [];
            }
        },
        dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery._queueHooks(elem, type), next = function() {
                jQuery.dequeue(elem, type);
            };
            if (fn === "inprogress") {
                fn = queue.shift();
                startLength--;
            }
            if (fn) {
                if (type === "fx") {
                    queue.unshift("inprogress");
                }
                delete hooks.stop;
                fn.call(elem, next, hooks);
            }
            if (!startLength && hooks) {
                hooks.empty.fire();
            }
        },
        _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
                empty: jQuery.Callbacks("once memory").add(function() {
                    dataPriv.remove(elem, [ type + "queue", key ]);
                })
            });
        }
    });
    jQuery.fn.extend({
        queue: function(type, data) {
            var setter = 2;
            if (typeof type !== "string") {
                data = type;
                type = "fx";
                setter--;
            }
            if (arguments.length < setter) {
                return jQuery.queue(this[0], type);
            }
            return data === undefined ? this : this.each(function() {
                var queue = jQuery.queue(this, type, data);
                jQuery._queueHooks(this, type);
                if (type === "fx" && queue[0] !== "inprogress") {
                    jQuery.dequeue(this, type);
                }
            });
        },
        dequeue: function(type) {
            return this.each(function() {
                jQuery.dequeue(this, type);
            });
        },
        clearQueue: function(type) {
            return this.queue(type || "fx", []);
        },
        promise: function(type, obj) {
            var tmp, count = 1, defer = jQuery.Deferred(), elements = this, i = this.length, resolve = function() {
                if (!--count) {
                    defer.resolveWith(elements, [ elements ]);
                }
            };
            if (typeof type !== "string") {
                obj = type;
                type = undefined;
            }
            type = type || "fx";
            while (i--) {
                tmp = dataPriv.get(elements[i], type + "queueHooks");
                if (tmp && tmp.empty) {
                    count++;
                    tmp.empty.add(resolve);
                }
            }
            resolve();
            return defer.promise(obj);
        }
    });
    var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
    var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
    var cssExpand = [ "Top", "Right", "Bottom", "Left" ];
    var isHidden = function(elem, el) {
        elem = el || elem;
        return jQuery.css(elem, "display") === "none" || !jQuery.contains(elem.ownerDocument, elem);
    };
    function adjustCSS(elem, prop, valueParts, tween) {
        var adjusted, scale = 1, maxIterations = 20, currentValue = tween ? function() {
            return tween.cur();
        } : function() {
            return jQuery.css(elem, prop, "");
        }, initial = currentValue(), unit = valueParts && valueParts[3] || (jQuery.cssNumber[prop] ? "" : "px"), initialInUnit = (jQuery.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery.css(elem, prop));
        if (initialInUnit && initialInUnit[3] !== unit) {
            unit = unit || initialInUnit[3];
            valueParts = valueParts || [];
            initialInUnit = +initial || 1;
            do {
                scale = scale || ".5";
                initialInUnit = initialInUnit / scale;
                jQuery.style(elem, prop, initialInUnit + unit);
            } while (scale !== (scale = currentValue() / initial) && scale !== 1 && --maxIterations);
        }
        if (valueParts) {
            initialInUnit = +initialInUnit || +initial || 0;
            adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
            if (tween) {
                tween.unit = unit;
                tween.start = initialInUnit;
                tween.end = adjusted;
            }
        }
        return adjusted;
    }
    var rcheckableType = /^(?:checkbox|radio)$/i;
    var rtagName = /<([\w:-]+)/;
    var rscriptType = /^$|\/(?:java|ecma)script/i;
    var wrapMap = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        thead: [ 1, "<table>", "</table>" ],
        col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        _default: [ 0, "", "" ]
    };
    wrapMap.optgroup = wrapMap.option;
    wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
    wrapMap.th = wrapMap.td;
    function getAll(context, tag) {
        var ret = typeof context.getElementsByTagName !== "undefined" ? context.getElementsByTagName(tag || "*") : typeof context.querySelectorAll !== "undefined" ? context.querySelectorAll(tag || "*") : [];
        return tag === undefined || tag && jQuery.nodeName(context, tag) ? jQuery.merge([ context ], ret) : ret;
    }
    function setGlobalEval(elems, refElements) {
        var i = 0, l = elems.length;
        for (;i < l; i++) {
            dataPriv.set(elems[i], "globalEval", !refElements || dataPriv.get(refElements[i], "globalEval"));
        }
    }
    var rhtml = /<|&#?\w+;/;
    function buildFragment(elems, context, scripts, selection, ignored) {
        var elem, tmp, tag, wrap, contains, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
        for (;i < l; i++) {
            elem = elems[i];
            if (elem || elem === 0) {
                if (jQuery.type(elem) === "object") {
                    jQuery.merge(nodes, elem.nodeType ? [ elem ] : elem);
                } else if (!rhtml.test(elem)) {
                    nodes.push(context.createTextNode(elem));
                } else {
                    tmp = tmp || fragment.appendChild(context.createElement("div"));
                    tag = (rtagName.exec(elem) || [ "", "" ])[1].toLowerCase();
                    wrap = wrapMap[tag] || wrapMap._default;
                    tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];
                    j = wrap[0];
                    while (j--) {
                        tmp = tmp.lastChild;
                    }
                    jQuery.merge(nodes, tmp.childNodes);
                    tmp = fragment.firstChild;
                    tmp.textContent = "";
                }
            }
        }
        fragment.textContent = "";
        i = 0;
        while (elem = nodes[i++]) {
            if (selection && jQuery.inArray(elem, selection) > -1) {
                if (ignored) {
                    ignored.push(elem);
                }
                continue;
            }
            contains = jQuery.contains(elem.ownerDocument, elem);
            tmp = getAll(fragment.appendChild(elem), "script");
            if (contains) {
                setGlobalEval(tmp);
            }
            if (scripts) {
                j = 0;
                while (elem = tmp[j++]) {
                    if (rscriptType.test(elem.type || "")) {
                        scripts.push(elem);
                    }
                }
            }
        }
        return fragment;
    }
    (function() {
        var fragment = document.createDocumentFragment(), div = fragment.appendChild(document.createElement("div")), input = document.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("checked", "checked");
        input.setAttribute("name", "t");
        div.appendChild(input);
        support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
        div.innerHTML = "<textarea>x</textarea>";
        support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
    })();
    var rkeyEvent = /^key/, rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/, rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
    function returnTrue() {
        return true;
    }
    function returnFalse() {
        return false;
    }
    function safeActiveElement() {
        try {
            return document.activeElement;
        } catch (err) {}
    }
    function on(elem, types, selector, data, fn, one) {
        var origFn, type;
        if (typeof types === "object") {
            if (typeof selector !== "string") {
                data = data || selector;
                selector = undefined;
            }
            for (type in types) {
                on(elem, type, selector, data, types[type], one);
            }
            return elem;
        }
        if (data == null && fn == null) {
            fn = selector;
            data = selector = undefined;
        } else if (fn == null) {
            if (typeof selector === "string") {
                fn = data;
                data = undefined;
            } else {
                fn = data;
                data = selector;
                selector = undefined;
            }
        }
        if (fn === false) {
            fn = returnFalse;
        } else if (!fn) {
            return elem;
        }
        if (one === 1) {
            origFn = fn;
            fn = function(event) {
                jQuery().off(event);
                return origFn.apply(this, arguments);
            };
            fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
        }
        return elem.each(function() {
            jQuery.event.add(this, types, fn, data, selector);
        });
    }
    jQuery.event = {
        global: {},
        add: function(elem, types, handler, data, selector) {
            var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
            if (!elemData) {
                return;
            }
            if (handler.handler) {
                handleObjIn = handler;
                handler = handleObjIn.handler;
                selector = handleObjIn.selector;
            }
            if (!handler.guid) {
                handler.guid = jQuery.guid++;
            }
            if (!(events = elemData.events)) {
                events = elemData.events = {};
            }
            if (!(eventHandle = elemData.handle)) {
                eventHandle = elemData.handle = function(e) {
                    return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : undefined;
                };
            }
            types = (types || "").match(rnotwhite) || [ "" ];
            t = types.length;
            while (t--) {
                tmp = rtypenamespace.exec(types[t]) || [];
                type = origType = tmp[1];
                namespaces = (tmp[2] || "").split(".").sort();
                if (!type) {
                    continue;
                }
                special = jQuery.event.special[type] || {};
                type = (selector ? special.delegateType : special.bindType) || type;
                special = jQuery.event.special[type] || {};
                handleObj = jQuery.extend({
                    type: type,
                    origType: origType,
                    data: data,
                    handler: handler,
                    guid: handler.guid,
                    selector: selector,
                    needsContext: selector && jQuery.expr.match.needsContext.test(selector),
                    namespace: namespaces.join(".")
                }, handleObjIn);
                if (!(handlers = events[type])) {
                    handlers = events[type] = [];
                    handlers.delegateCount = 0;
                    if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                        if (elem.addEventListener) {
                            elem.addEventListener(type, eventHandle);
                        }
                    }
                }
                if (special.add) {
                    special.add.call(elem, handleObj);
                    if (!handleObj.handler.guid) {
                        handleObj.handler.guid = handler.guid;
                    }
                }
                if (selector) {
                    handlers.splice(handlers.delegateCount++, 0, handleObj);
                } else {
                    handlers.push(handleObj);
                }
                jQuery.event.global[type] = true;
            }
        },
        remove: function(elem, types, handler, selector, mappedTypes) {
            var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
            if (!elemData || !(events = elemData.events)) {
                return;
            }
            types = (types || "").match(rnotwhite) || [ "" ];
            t = types.length;
            while (t--) {
                tmp = rtypenamespace.exec(types[t]) || [];
                type = origType = tmp[1];
                namespaces = (tmp[2] || "").split(".").sort();
                if (!type) {
                    for (type in events) {
                        jQuery.event.remove(elem, type + types[t], handler, selector, true);
                    }
                    continue;
                }
                special = jQuery.event.special[type] || {};
                type = (selector ? special.delegateType : special.bindType) || type;
                handlers = events[type] || [];
                tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
                origCount = j = handlers.length;
                while (j--) {
                    handleObj = handlers[j];
                    if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
                        handlers.splice(j, 1);
                        if (handleObj.selector) {
                            handlers.delegateCount--;
                        }
                        if (special.remove) {
                            special.remove.call(elem, handleObj);
                        }
                    }
                }
                if (origCount && !handlers.length) {
                    if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                        jQuery.removeEvent(elem, type, elemData.handle);
                    }
                    delete events[type];
                }
            }
            if (jQuery.isEmptyObject(events)) {
                dataPriv.remove(elem, "handle events");
            }
        },
        dispatch: function(event) {
            event = jQuery.event.fix(event);
            var i, j, ret, matched, handleObj, handlerQueue = [], args = slice.call(arguments), handlers = (dataPriv.get(this, "events") || {})[event.type] || [], special = jQuery.event.special[event.type] || {};
            args[0] = event;
            event.delegateTarget = this;
            if (special.preDispatch && special.preDispatch.call(this, event) === false) {
                return;
            }
            handlerQueue = jQuery.event.handlers.call(this, event, handlers);
            i = 0;
            while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
                event.currentTarget = matched.elem;
                j = 0;
                while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
                    if (!event.rnamespace || event.rnamespace.test(handleObj.namespace)) {
                        event.handleObj = handleObj;
                        event.data = handleObj.data;
                        ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
                        if (ret !== undefined) {
                            if ((event.result = ret) === false) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    }
                }
            }
            if (special.postDispatch) {
                special.postDispatch.call(this, event);
            }
            return event.result;
        },
        handlers: function(event, handlers) {
            var i, matches, sel, handleObj, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
            if (delegateCount && cur.nodeType && (event.type !== "click" || isNaN(event.button) || event.button < 1)) {
                for (;cur !== this; cur = cur.parentNode || this) {
                    if (cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click")) {
                        matches = [];
                        for (i = 0; i < delegateCount; i++) {
                            handleObj = handlers[i];
                            sel = handleObj.selector + " ";
                            if (matches[sel] === undefined) {
                                matches[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) > -1 : jQuery.find(sel, this, null, [ cur ]).length;
                            }
                            if (matches[sel]) {
                                matches.push(handleObj);
                            }
                        }
                        if (matches.length) {
                            handlerQueue.push({
                                elem: cur,
                                handlers: matches
                            });
                        }
                    }
                }
            }
            if (delegateCount < handlers.length) {
                handlerQueue.push({
                    elem: this,
                    handlers: handlers.slice(delegateCount)
                });
            }
            return handlerQueue;
        },
        props: ("altKey bubbles cancelable ctrlKey currentTarget detail eventPhase " + "metaKey relatedTarget shiftKey target timeStamp view which").split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(event, original) {
                if (event.which == null) {
                    event.which = original.charCode != null ? original.charCode : original.keyCode;
                }
                return event;
            }
        },
        mouseHooks: {
            props: ("button buttons clientX clientY offsetX offsetY pageX pageY " + "screenX screenY toElement").split(" "),
            filter: function(event, original) {
                var eventDoc, doc, body, button = original.button;
                if (event.pageX == null && original.clientX != null) {
                    eventDoc = event.target.ownerDocument || document;
                    doc = eventDoc.documentElement;
                    body = eventDoc.body;
                    event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                    event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
                }
                if (!event.which && button !== undefined) {
                    event.which = button & 1 ? 1 : button & 2 ? 3 : button & 4 ? 2 : 0;
                }
                return event;
            }
        },
        fix: function(event) {
            if (event[jQuery.expando]) {
                return event;
            }
            var i, prop, copy, type = event.type, originalEvent = event, fixHook = this.fixHooks[type];
            if (!fixHook) {
                this.fixHooks[type] = fixHook = rmouseEvent.test(type) ? this.mouseHooks : rkeyEvent.test(type) ? this.keyHooks : {};
            }
            copy = fixHook.props ? this.props.concat(fixHook.props) : this.props;
            event = new jQuery.Event(originalEvent);
            i = copy.length;
            while (i--) {
                prop = copy[i];
                event[prop] = originalEvent[prop];
            }
            if (!event.target) {
                event.target = document;
            }
            if (event.target.nodeType === 3) {
                event.target = event.target.parentNode;
            }
            return fixHook.filter ? fixHook.filter(event, originalEvent) : event;
        },
        special: {
            load: {
                noBubble: true
            },
            focus: {
                trigger: function() {
                    if (this !== safeActiveElement() && this.focus) {
                        this.focus();
                        return false;
                    }
                },
                delegateType: "focusin"
            },
            blur: {
                trigger: function() {
                    if (this === safeActiveElement() && this.blur) {
                        this.blur();
                        return false;
                    }
                },
                delegateType: "focusout"
            },
            click: {
                trigger: function() {
                    if (this.type === "checkbox" && this.click && jQuery.nodeName(this, "input")) {
                        this.click();
                        return false;
                    }
                },
                _default: function(event) {
                    return jQuery.nodeName(event.target, "a");
                }
            },
            beforeunload: {
                postDispatch: function(event) {
                    if (event.result !== undefined && event.originalEvent) {
                        event.originalEvent.returnValue = event.result;
                    }
                }
            }
        }
    };
    jQuery.removeEvent = function(elem, type, handle) {
        if (elem.removeEventListener) {
            elem.removeEventListener(type, handle);
        }
    };
    jQuery.Event = function(src, props) {
        if (!(this instanceof jQuery.Event)) {
            return new jQuery.Event(src, props);
        }
        if (src && src.type) {
            this.originalEvent = src;
            this.type = src.type;
            this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined && src.returnValue === false ? returnTrue : returnFalse;
        } else {
            this.type = src;
        }
        if (props) {
            jQuery.extend(this, props);
        }
        this.timeStamp = src && src.timeStamp || jQuery.now();
        this[jQuery.expando] = true;
    };
    jQuery.Event.prototype = {
        constructor: jQuery.Event,
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse,
        isSimulated: false,
        preventDefault: function() {
            var e = this.originalEvent;
            this.isDefaultPrevented = returnTrue;
            if (e && !this.isSimulated) {
                e.preventDefault();
            }
        },
        stopPropagation: function() {
            var e = this.originalEvent;
            this.isPropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
                e.stopPropagation();
            }
        },
        stopImmediatePropagation: function() {
            var e = this.originalEvent;
            this.isImmediatePropagationStopped = returnTrue;
            if (e && !this.isSimulated) {
                e.stopImmediatePropagation();
            }
            this.stopPropagation();
        }
    };
    jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout",
        pointerenter: "pointerover",
        pointerleave: "pointerout"
    }, function(orig, fix) {
        jQuery.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
                var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
                if (!related || related !== target && !jQuery.contains(target, related)) {
                    event.type = handleObj.origType;
                    ret = handleObj.handler.apply(this, arguments);
                    event.type = fix;
                }
                return ret;
            }
        };
    });
    jQuery.fn.extend({
        on: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn);
        },
        one: function(types, selector, data, fn) {
            return on(this, types, selector, data, fn, 1);
        },
        off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) {
                handleObj = types.handleObj;
                jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
                return this;
            }
            if (typeof types === "object") {
                for (type in types) {
                    this.off(type, selector, types[type]);
                }
                return this;
            }
            if (selector === false || typeof selector === "function") {
                fn = selector;
                selector = undefined;
            }
            if (fn === false) {
                fn = returnFalse;
            }
            return this.each(function() {
                jQuery.event.remove(this, types, fn, selector);
            });
        }
    });
    var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi, rnoInnerhtml = /<script|<style|<link/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rscriptTypeMasked = /^true\/(.*)/, rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;
    function manipulationTarget(elem, content) {
        return jQuery.nodeName(elem, "table") && jQuery.nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr") ? elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")) : elem;
    }
    function disableScript(elem) {
        elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
        return elem;
    }
    function restoreScript(elem) {
        var match = rscriptTypeMasked.exec(elem.type);
        if (match) {
            elem.type = match[1];
        } else {
            elem.removeAttribute("type");
        }
        return elem;
    }
    function cloneCopyEvent(src, dest) {
        var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;
        if (dest.nodeType !== 1) {
            return;
        }
        if (dataPriv.hasData(src)) {
            pdataOld = dataPriv.access(src);
            pdataCur = dataPriv.set(dest, pdataOld);
            events = pdataOld.events;
            if (events) {
                delete pdataCur.handle;
                pdataCur.events = {};
                for (type in events) {
                    for (i = 0, l = events[type].length; i < l; i++) {
                        jQuery.event.add(dest, type, events[type][i]);
                    }
                }
            }
        }
        if (dataUser.hasData(src)) {
            udataOld = dataUser.access(src);
            udataCur = jQuery.extend({}, udataOld);
            dataUser.set(dest, udataCur);
        }
    }
    function fixInput(src, dest) {
        var nodeName = dest.nodeName.toLowerCase();
        if (nodeName === "input" && rcheckableType.test(src.type)) {
            dest.checked = src.checked;
        } else if (nodeName === "input" || nodeName === "textarea") {
            dest.defaultValue = src.defaultValue;
        }
    }
    function domManip(collection, args, callback, ignored) {
        args = concat.apply([], args);
        var fragment, first, scripts, hasScripts, node, doc, i = 0, l = collection.length, iNoClone = l - 1, value = args[0], isFunction = jQuery.isFunction(value);
        if (isFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
            return collection.each(function(index) {
                var self = collection.eq(index);
                if (isFunction) {
                    args[0] = value.call(this, index, self.html());
                }
                domManip(self, args, callback, ignored);
            });
        }
        if (l) {
            fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
            first = fragment.firstChild;
            if (fragment.childNodes.length === 1) {
                fragment = first;
            }
            if (first || ignored) {
                scripts = jQuery.map(getAll(fragment, "script"), disableScript);
                hasScripts = scripts.length;
                for (;i < l; i++) {
                    node = fragment;
                    if (i !== iNoClone) {
                        node = jQuery.clone(node, true, true);
                        if (hasScripts) {
                            jQuery.merge(scripts, getAll(node, "script"));
                        }
                    }
                    callback.call(collection[i], node, i);
                }
                if (hasScripts) {
                    doc = scripts[scripts.length - 1].ownerDocument;
                    jQuery.map(scripts, restoreScript);
                    for (i = 0; i < hasScripts; i++) {
                        node = scripts[i];
                        if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {
                            if (node.src) {
                                if (jQuery._evalUrl) {
                                    jQuery._evalUrl(node.src);
                                }
                            } else {
                                jQuery.globalEval(node.textContent.replace(rcleanScript, ""));
                            }
                        }
                    }
                }
            }
        }
        return collection;
    }
    function remove(elem, selector, keepData) {
        var node, nodes = selector ? jQuery.filter(selector, elem) : elem, i = 0;
        for (;(node = nodes[i]) != null; i++) {
            if (!keepData && node.nodeType === 1) {
                jQuery.cleanData(getAll(node));
            }
            if (node.parentNode) {
                if (keepData && jQuery.contains(node.ownerDocument, node)) {
                    setGlobalEval(getAll(node, "script"));
                }
                node.parentNode.removeChild(node);
            }
        }
        return elem;
    }
    jQuery.extend({
        htmlPrefilter: function(html) {
            return html.replace(rxhtmlTag, "<$1></$2>");
        },
        clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var i, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = jQuery.contains(elem.ownerDocument, elem);
            if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
                destElements = getAll(clone);
                srcElements = getAll(elem);
                for (i = 0, l = srcElements.length; i < l; i++) {
                    fixInput(srcElements[i], destElements[i]);
                }
            }
            if (dataAndEvents) {
                if (deepDataAndEvents) {
                    srcElements = srcElements || getAll(elem);
                    destElements = destElements || getAll(clone);
                    for (i = 0, l = srcElements.length; i < l; i++) {
                        cloneCopyEvent(srcElements[i], destElements[i]);
                    }
                } else {
                    cloneCopyEvent(elem, clone);
                }
            }
            destElements = getAll(clone, "script");
            if (destElements.length > 0) {
                setGlobalEval(destElements, !inPage && getAll(elem, "script"));
            }
            return clone;
        },
        cleanData: function(elems) {
            var data, elem, type, special = jQuery.event.special, i = 0;
            for (;(elem = elems[i]) !== undefined; i++) {
                if (acceptData(elem)) {
                    if (data = elem[dataPriv.expando]) {
                        if (data.events) {
                            for (type in data.events) {
                                if (special[type]) {
                                    jQuery.event.remove(elem, type);
                                } else {
                                    jQuery.removeEvent(elem, type, data.handle);
                                }
                            }
                        }
                        elem[dataPriv.expando] = undefined;
                    }
                    if (elem[dataUser.expando]) {
                        elem[dataUser.expando] = undefined;
                    }
                }
            }
        }
    });
    jQuery.fn.extend({
        domManip: domManip,
        detach: function(selector) {
            return remove(this, selector, true);
        },
        remove: function(selector) {
            return remove(this, selector);
        },
        text: function(value) {
            return access(this, function(value) {
                return value === undefined ? jQuery.text(this) : this.empty().each(function() {
                    if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                        this.textContent = value;
                    }
                });
            }, null, value, arguments.length);
        },
        append: function() {
            return domManip(this, arguments, function(elem) {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                    var target = manipulationTarget(this, elem);
                    target.appendChild(elem);
                }
            });
        },
        prepend: function() {
            return domManip(this, arguments, function(elem) {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                    var target = manipulationTarget(this, elem);
                    target.insertBefore(elem, target.firstChild);
                }
            });
        },
        before: function() {
            return domManip(this, arguments, function(elem) {
                if (this.parentNode) {
                    this.parentNode.insertBefore(elem, this);
                }
            });
        },
        after: function() {
            return domManip(this, arguments, function(elem) {
                if (this.parentNode) {
                    this.parentNode.insertBefore(elem, this.nextSibling);
                }
            });
        },
        empty: function() {
            var elem, i = 0;
            for (;(elem = this[i]) != null; i++) {
                if (elem.nodeType === 1) {
                    jQuery.cleanData(getAll(elem, false));
                    elem.textContent = "";
                }
            }
            return this;
        },
        clone: function(dataAndEvents, deepDataAndEvents) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map(function() {
                return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
            });
        },
        html: function(value) {
            return access(this, function(value) {
                var elem = this[0] || {}, i = 0, l = this.length;
                if (value === undefined && elem.nodeType === 1) {
                    return elem.innerHTML;
                }
                if (typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || [ "", "" ])[1].toLowerCase()]) {
                    value = jQuery.htmlPrefilter(value);
                    try {
                        for (;i < l; i++) {
                            elem = this[i] || {};
                            if (elem.nodeType === 1) {
                                jQuery.cleanData(getAll(elem, false));
                                elem.innerHTML = value;
                            }
                        }
                        elem = 0;
                    } catch (e) {}
                }
                if (elem) {
                    this.empty().append(value);
                }
            }, null, value, arguments.length);
        },
        replaceWith: function() {
            var ignored = [];
            return domManip(this, arguments, function(elem) {
                var parent = this.parentNode;
                if (jQuery.inArray(this, ignored) < 0) {
                    jQuery.cleanData(getAll(this));
                    if (parent) {
                        parent.replaceChild(elem, this);
                    }
                }
            }, ignored);
        }
    });
    jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(name, original) {
        jQuery.fn[name] = function(selector) {
            var elems, ret = [], insert = jQuery(selector), last = insert.length - 1, i = 0;
            for (;i <= last; i++) {
                elems = i === last ? this : this.clone(true);
                jQuery(insert[i])[original](elems);
                push.apply(ret, elems.get());
            }
            return this.pushStack(ret);
        };
    });
    var iframe, elemdisplay = {
        HTML: "block",
        BODY: "block"
    };
    function actualDisplay(name, doc) {
        var elem = jQuery(doc.createElement(name)).appendTo(doc.body), display = jQuery.css(elem[0], "display");
        elem.detach();
        return display;
    }
    function defaultDisplay(nodeName) {
        var doc = document, display = elemdisplay[nodeName];
        if (!display) {
            display = actualDisplay(nodeName, doc);
            if (display === "none" || !display) {
                iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>")).appendTo(doc.documentElement);
                doc = iframe[0].contentDocument;
                doc.write();
                doc.close();
                display = actualDisplay(nodeName, doc);
                iframe.detach();
            }
            elemdisplay[nodeName] = display;
        }
        return display;
    }
    var rmargin = /^margin/;
    var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
    var getStyles = function(elem) {
        var view = elem.ownerDocument.defaultView;
        if (!view || !view.opener) {
            view = window;
        }
        return view.getComputedStyle(elem);
    };
    var swap = function(elem, options, callback, args) {
        var ret, name, old = {};
        for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
        }
        ret = callback.apply(elem, args || []);
        for (name in options) {
            elem.style[name] = old[name];
        }
        return ret;
    };
    var documentElement = document.documentElement;
    (function() {
        var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal, container = document.createElement("div"), div = document.createElement("div");
        if (!div.style) {
            return;
        }
        div.style.backgroundClip = "content-box";
        div.cloneNode(true).style.backgroundClip = "";
        support.clearCloneStyle = div.style.backgroundClip === "content-box";
        container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" + "padding:0;margin-top:1px;position:absolute";
        container.appendChild(div);
        function computeStyleTests() {
            div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;" + "position:relative;display:block;" + "margin:auto;border:1px;padding:1px;" + "top:1%;width:50%";
            div.innerHTML = "";
            documentElement.appendChild(container);
            var divStyle = window.getComputedStyle(div);
            pixelPositionVal = divStyle.top !== "1%";
            reliableMarginLeftVal = divStyle.marginLeft === "2px";
            boxSizingReliableVal = divStyle.width === "4px";
            div.style.marginRight = "50%";
            pixelMarginRightVal = divStyle.marginRight === "4px";
            documentElement.removeChild(container);
        }
        jQuery.extend(support, {
            pixelPosition: function() {
                computeStyleTests();
                return pixelPositionVal;
            },
            boxSizingReliable: function() {
                if (boxSizingReliableVal == null) {
                    computeStyleTests();
                }
                return boxSizingReliableVal;
            },
            pixelMarginRight: function() {
                if (boxSizingReliableVal == null) {
                    computeStyleTests();
                }
                return pixelMarginRightVal;
            },
            reliableMarginLeft: function() {
                if (boxSizingReliableVal == null) {
                    computeStyleTests();
                }
                return reliableMarginLeftVal;
            },
            reliableMarginRight: function() {
                var ret, marginDiv = div.appendChild(document.createElement("div"));
                marginDiv.style.cssText = div.style.cssText = "-webkit-box-sizing:content-box;box-sizing:content-box;" + "display:block;margin:0;border:0;padding:0";
                marginDiv.style.marginRight = marginDiv.style.width = "0";
                div.style.width = "1px";
                documentElement.appendChild(container);
                ret = !parseFloat(window.getComputedStyle(marginDiv).marginRight);
                documentElement.removeChild(container);
                div.removeChild(marginDiv);
                return ret;
            }
        });
    })();
    function curCSS(elem, name, computed) {
        var width, minWidth, maxWidth, ret, style = elem.style;
        computed = computed || getStyles(elem);
        ret = computed ? computed.getPropertyValue(name) || computed[name] : undefined;
        if ((ret === "" || ret === undefined) && !jQuery.contains(elem.ownerDocument, elem)) {
            ret = jQuery.style(elem, name);
        }
        if (computed) {
            if (!support.pixelMarginRight() && rnumnonpx.test(ret) && rmargin.test(name)) {
                width = style.width;
                minWidth = style.minWidth;
                maxWidth = style.maxWidth;
                style.minWidth = style.maxWidth = style.width = ret;
                ret = computed.width;
                style.width = width;
                style.minWidth = minWidth;
                style.maxWidth = maxWidth;
            }
        }
        return ret !== undefined ? ret + "" : ret;
    }
    function addGetHookIf(conditionFn, hookFn) {
        return {
            get: function() {
                if (conditionFn()) {
                    delete this.get;
                    return;
                }
                return (this.get = hookFn).apply(this, arguments);
            }
        };
    }
    var rdisplayswap = /^(none|table(?!-c[ea]).+)/, cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }, cssNormalTransform = {
        letterSpacing: "0",
        fontWeight: "400"
    }, cssPrefixes = [ "Webkit", "O", "Moz", "ms" ], emptyStyle = document.createElement("div").style;
    function vendorPropName(name) {
        if (name in emptyStyle) {
            return name;
        }
        var capName = name[0].toUpperCase() + name.slice(1), i = cssPrefixes.length;
        while (i--) {
            name = cssPrefixes[i] + capName;
            if (name in emptyStyle) {
                return name;
            }
        }
    }
    function setPositiveNumber(elem, value, subtract) {
        var matches = rcssNum.exec(value);
        return matches ? Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px") : value;
    }
    function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
        var i = extra === (isBorderBox ? "border" : "content") ? 4 : name === "width" ? 1 : 0, val = 0;
        for (;i < 4; i += 2) {
            if (extra === "margin") {
                val += jQuery.css(elem, extra + cssExpand[i], true, styles);
            }
            if (isBorderBox) {
                if (extra === "content") {
                    val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
                }
                if (extra !== "margin") {
                    val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
                }
            } else {
                val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);
                if (extra !== "padding") {
                    val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
                }
            }
        }
        return val;
    }
    function getWidthOrHeight(elem, name, extra) {
        var valueIsBorderBox = true, val = name === "width" ? elem.offsetWidth : elem.offsetHeight, styles = getStyles(elem), isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";
        if (val <= 0 || val == null) {
            val = curCSS(elem, name, styles);
            if (val < 0 || val == null) {
                val = elem.style[name];
            }
            if (rnumnonpx.test(val)) {
                return val;
            }
            valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);
            val = parseFloat(val) || 0;
        }
        return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles) + "px";
    }
    function showHide(elements, show) {
        var display, elem, hidden, values = [], index = 0, length = elements.length;
        for (;index < length; index++) {
            elem = elements[index];
            if (!elem.style) {
                continue;
            }
            values[index] = dataPriv.get(elem, "olddisplay");
            display = elem.style.display;
            if (show) {
                if (!values[index] && display === "none") {
                    elem.style.display = "";
                }
                if (elem.style.display === "" && isHidden(elem)) {
                    values[index] = dataPriv.access(elem, "olddisplay", defaultDisplay(elem.nodeName));
                }
            } else {
                hidden = isHidden(elem);
                if (display !== "none" || !hidden) {
                    dataPriv.set(elem, "olddisplay", hidden ? display : jQuery.css(elem, "display"));
                }
            }
        }
        for (index = 0; index < length; index++) {
            elem = elements[index];
            if (!elem.style) {
                continue;
            }
            if (!show || elem.style.display === "none" || elem.style.display === "") {
                elem.style.display = show ? values[index] || "" : "none";
            }
        }
        return elements;
    }
    jQuery.extend({
        cssHooks: {
            opacity: {
                get: function(elem, computed) {
                    if (computed) {
                        var ret = curCSS(elem, "opacity");
                        return ret === "" ? "1" : ret;
                    }
                }
            }
        },
        cssNumber: {
            animationIterationCount: true,
            columnCount: true,
            fillOpacity: true,
            flexGrow: true,
            flexShrink: true,
            fontWeight: true,
            lineHeight: true,
            opacity: true,
            order: true,
            orphans: true,
            widows: true,
            zIndex: true,
            zoom: true
        },
        cssProps: {
            float: "cssFloat"
        },
        style: function(elem, name, value, extra) {
            if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
                return;
            }
            var ret, type, hooks, origName = jQuery.camelCase(name), style = elem.style;
            name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(origName) || origName);
            hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
            if (value !== undefined) {
                type = typeof value;
                if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
                    value = adjustCSS(elem, name, ret);
                    type = "number";
                }
                if (value == null || value !== value) {
                    return;
                }
                if (type === "number") {
                    value += ret && ret[3] || (jQuery.cssNumber[origName] ? "" : "px");
                }
                if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
                    style[name] = "inherit";
                }
                if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
                    style[name] = value;
                }
            } else {
                if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {
                    return ret;
                }
                return style[name];
            }
        },
        css: function(elem, name, extra, styles) {
            var val, num, hooks, origName = jQuery.camelCase(name);
            name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(origName) || origName);
            hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];
            if (hooks && "get" in hooks) {
                val = hooks.get(elem, true, extra);
            }
            if (val === undefined) {
                val = curCSS(elem, name, styles);
            }
            if (val === "normal" && name in cssNormalTransform) {
                val = cssNormalTransform[name];
            }
            if (extra === "" || extra) {
                num = parseFloat(val);
                return extra === true || isFinite(num) ? num || 0 : val;
            }
            return val;
        }
    });
    jQuery.each([ "height", "width" ], function(i, name) {
        jQuery.cssHooks[name] = {
            get: function(elem, computed, extra) {
                if (computed) {
                    return rdisplayswap.test(jQuery.css(elem, "display")) && elem.offsetWidth === 0 ? swap(elem, cssShow, function() {
                        return getWidthOrHeight(elem, name, extra);
                    }) : getWidthOrHeight(elem, name, extra);
                }
            },
            set: function(elem, value, extra) {
                var matches, styles = extra && getStyles(elem), subtract = extra && augmentWidthOrHeight(elem, name, extra, jQuery.css(elem, "boxSizing", false, styles) === "border-box", styles);
                if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {
                    elem.style[name] = value;
                    value = jQuery.css(elem, name);
                }
                return setPositiveNumber(elem, value, subtract);
            }
        };
    });
    jQuery.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, function(elem, computed) {
        if (computed) {
            return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, {
                marginLeft: 0
            }, function() {
                return elem.getBoundingClientRect().left;
            })) + "px";
        }
    });
    jQuery.cssHooks.marginRight = addGetHookIf(support.reliableMarginRight, function(elem, computed) {
        if (computed) {
            return swap(elem, {
                display: "inline-block"
            }, curCSS, [ elem, "marginRight" ]);
        }
    });
    jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(prefix, suffix) {
        jQuery.cssHooks[prefix + suffix] = {
            expand: function(value) {
                var i = 0, expanded = {}, parts = typeof value === "string" ? value.split(" ") : [ value ];
                for (;i < 4; i++) {
                    expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
                }
                return expanded;
            }
        };
        if (!rmargin.test(prefix)) {
            jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
        }
    });
    jQuery.fn.extend({
        css: function(name, value) {
            return access(this, function(elem, name, value) {
                var styles, len, map = {}, i = 0;
                if (jQuery.isArray(name)) {
                    styles = getStyles(elem);
                    len = name.length;
                    for (;i < len; i++) {
                        map[name[i]] = jQuery.css(elem, name[i], false, styles);
                    }
                    return map;
                }
                return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
            }, name, value, arguments.length > 1);
        },
        show: function() {
            return showHide(this, true);
        },
        hide: function() {
            return showHide(this);
        },
        toggle: function(state) {
            if (typeof state === "boolean") {
                return state ? this.show() : this.hide();
            }
            return this.each(function() {
                if (isHidden(this)) {
                    jQuery(this).show();
                } else {
                    jQuery(this).hide();
                }
            });
        }
    });
    function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing);
    }
    jQuery.Tween = Tween;
    Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem;
            this.prop = prop;
            this.easing = easing || jQuery.easing._default;
            this.options = options;
            this.start = this.now = this.cur();
            this.end = end;
            this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
        },
        cur: function() {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
        },
        run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];
            if (this.options.duration) {
                this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);
            } else {
                this.pos = eased = percent;
            }
            this.now = (this.end - this.start) * eased + this.start;
            if (this.options.step) {
                this.options.step.call(this.elem, this.now, this);
            }
            if (hooks && hooks.set) {
                hooks.set(this);
            } else {
                Tween.propHooks._default.set(this);
            }
            return this;
        }
    };
    Tween.prototype.init.prototype = Tween.prototype;
    Tween.propHooks = {
        _default: {
            get: function(tween) {
                var result;
                if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
                    return tween.elem[tween.prop];
                }
                result = jQuery.css(tween.elem, tween.prop, "");
                return !result || result === "auto" ? 0 : result;
            },
            set: function(tween) {
                if (jQuery.fx.step[tween.prop]) {
                    jQuery.fx.step[tween.prop](tween);
                } else if (tween.elem.nodeType === 1 && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
                    jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
                } else {
                    tween.elem[tween.prop] = tween.now;
                }
            }
        }
    };
    Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function(tween) {
            if (tween.elem.nodeType && tween.elem.parentNode) {
                tween.elem[tween.prop] = tween.now;
            }
        }
    };
    jQuery.easing = {
        linear: function(p) {
            return p;
        },
        swing: function(p) {
            return .5 - Math.cos(p * Math.PI) / 2;
        },
        _default: "swing"
    };
    jQuery.fx = Tween.prototype.init;
    jQuery.fx.step = {};
    var fxNow, timerId, rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
    function createFxNow() {
        window.setTimeout(function() {
            fxNow = undefined;
        });
        return fxNow = jQuery.now();
    }
    function genFx(type, includeWidth) {
        var which, i = 0, attrs = {
            height: type
        };
        includeWidth = includeWidth ? 1 : 0;
        for (;i < 4; i += 2 - includeWidth) {
            which = cssExpand[i];
            attrs["margin" + which] = attrs["padding" + which] = type;
        }
        if (includeWidth) {
            attrs.opacity = attrs.width = type;
        }
        return attrs;
    }
    function createTween(value, prop, animation) {
        var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]), index = 0, length = collection.length;
        for (;index < length; index++) {
            if (tween = collection[index].call(animation, prop, value)) {
                return tween;
            }
        }
    }
    function defaultPrefilter(elem, props, opts) {
        var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay, anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHidden(elem), dataShow = dataPriv.get(elem, "fxshow");
        if (!opts.queue) {
            hooks = jQuery._queueHooks(elem, "fx");
            if (hooks.unqueued == null) {
                hooks.unqueued = 0;
                oldfire = hooks.empty.fire;
                hooks.empty.fire = function() {
                    if (!hooks.unqueued) {
                        oldfire();
                    }
                };
            }
            hooks.unqueued++;
            anim.always(function() {
                anim.always(function() {
                    hooks.unqueued--;
                    if (!jQuery.queue(elem, "fx").length) {
                        hooks.empty.fire();
                    }
                });
            });
        }
        if (elem.nodeType === 1 && ("height" in props || "width" in props)) {
            opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];
            display = jQuery.css(elem, "display");
            checkDisplay = display === "none" ? dataPriv.get(elem, "olddisplay") || defaultDisplay(elem.nodeName) : display;
            if (checkDisplay === "inline" && jQuery.css(elem, "float") === "none") {
                style.display = "inline-block";
            }
        }
        if (opts.overflow) {
            style.overflow = "hidden";
            anim.always(function() {
                style.overflow = opts.overflow[0];
                style.overflowX = opts.overflow[1];
                style.overflowY = opts.overflow[2];
            });
        }
        for (prop in props) {
            value = props[prop];
            if (rfxtypes.exec(value)) {
                delete props[prop];
                toggle = toggle || value === "toggle";
                if (value === (hidden ? "hide" : "show")) {
                    if (value === "show" && dataShow && dataShow[prop] !== undefined) {
                        hidden = true;
                    } else {
                        continue;
                    }
                }
                orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
            } else {
                display = undefined;
            }
        }
        if (!jQuery.isEmptyObject(orig)) {
            if (dataShow) {
                if ("hidden" in dataShow) {
                    hidden = dataShow.hidden;
                }
            } else {
                dataShow = dataPriv.access(elem, "fxshow", {});
            }
            if (toggle) {
                dataShow.hidden = !hidden;
            }
            if (hidden) {
                jQuery(elem).show();
            } else {
                anim.done(function() {
                    jQuery(elem).hide();
                });
            }
            anim.done(function() {
                var prop;
                dataPriv.remove(elem, "fxshow");
                for (prop in orig) {
                    jQuery.style(elem, prop, orig[prop]);
                }
            });
            for (prop in orig) {
                tween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
                if (!(prop in dataShow)) {
                    dataShow[prop] = tween.start;
                    if (hidden) {
                        tween.end = tween.start;
                        tween.start = prop === "width" || prop === "height" ? 1 : 0;
                    }
                }
            }
        } else if ((display === "none" ? defaultDisplay(elem.nodeName) : display) === "inline") {
            style.display = display;
        }
    }
    function propFilter(props, specialEasing) {
        var index, name, easing, value, hooks;
        for (index in props) {
            name = jQuery.camelCase(index);
            easing = specialEasing[name];
            value = props[index];
            if (jQuery.isArray(value)) {
                easing = value[1];
                value = props[index] = value[0];
            }
            if (index !== name) {
                props[name] = value;
                delete props[index];
            }
            hooks = jQuery.cssHooks[name];
            if (hooks && "expand" in hooks) {
                value = hooks.expand(value);
                delete props[name];
                for (index in value) {
                    if (!(index in props)) {
                        props[index] = value[index];
                        specialEasing[index] = easing;
                    }
                }
            } else {
                specialEasing[name] = easing;
            }
        }
    }
    function Animation(elem, properties, options) {
        var result, stopped, index = 0, length = Animation.prefilters.length, deferred = jQuery.Deferred().always(function() {
            delete tick.elem;
        }), tick = function() {
            if (stopped) {
                return false;
            }
            var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), temp = remaining / animation.duration || 0, percent = 1 - temp, index = 0, length = animation.tweens.length;
            for (;index < length; index++) {
                animation.tweens[index].run(percent);
            }
            deferred.notifyWith(elem, [ animation, percent, remaining ]);
            if (percent < 1 && length) {
                return remaining;
            } else {
                deferred.resolveWith(elem, [ animation ]);
                return false;
            }
        }, animation = deferred.promise({
            elem: elem,
            props: jQuery.extend({}, properties),
            opts: jQuery.extend(true, {
                specialEasing: {},
                easing: jQuery.easing._default
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function(prop, end) {
                var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                animation.tweens.push(tween);
                return tween;
            },
            stop: function(gotoEnd) {
                var index = 0, length = gotoEnd ? animation.tweens.length : 0;
                if (stopped) {
                    return this;
                }
                stopped = true;
                for (;index < length; index++) {
                    animation.tweens[index].run(1);
                }
                if (gotoEnd) {
                    deferred.notifyWith(elem, [ animation, 1, 0 ]);
                    deferred.resolveWith(elem, [ animation, gotoEnd ]);
                } else {
                    deferred.rejectWith(elem, [ animation, gotoEnd ]);
                }
                return this;
            }
        }), props = animation.props;
        propFilter(props, animation.opts.specialEasing);
        for (;index < length; index++) {
            result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
            if (result) {
                if (jQuery.isFunction(result.stop)) {
                    jQuery._queueHooks(animation.elem, animation.opts.queue).stop = jQuery.proxy(result.stop, result);
                }
                return result;
            }
        }
        jQuery.map(props, createTween, animation);
        if (jQuery.isFunction(animation.opts.start)) {
            animation.opts.start.call(elem, animation);
        }
        jQuery.fx.timer(jQuery.extend(tick, {
            elem: elem,
            anim: animation,
            queue: animation.opts.queue
        }));
        return animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    }
    jQuery.Animation = jQuery.extend(Animation, {
        tweeners: {
            "*": [ function(prop, value) {
                var tween = this.createTween(prop, value);
                adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
                return tween;
            } ]
        },
        tweener: function(props, callback) {
            if (jQuery.isFunction(props)) {
                callback = props;
                props = [ "*" ];
            } else {
                props = props.match(rnotwhite);
            }
            var prop, index = 0, length = props.length;
            for (;index < length; index++) {
                prop = props[index];
                Animation.tweeners[prop] = Animation.tweeners[prop] || [];
                Animation.tweeners[prop].unshift(callback);
            }
        },
        prefilters: [ defaultPrefilter ],
        prefilter: function(callback, prepend) {
            if (prepend) {
                Animation.prefilters.unshift(callback);
            } else {
                Animation.prefilters.push(callback);
            }
        }
    });
    jQuery.speed = function(speed, easing, fn) {
        var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
            complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
        };
        opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration : opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default;
        if (opt.queue == null || opt.queue === true) {
            opt.queue = "fx";
        }
        opt.old = opt.complete;
        opt.complete = function() {
            if (jQuery.isFunction(opt.old)) {
                opt.old.call(this);
            }
            if (opt.queue) {
                jQuery.dequeue(this, opt.queue);
            }
        };
        return opt;
    };
    jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {
            return this.filter(isHidden).css("opacity", 0).show().end().animate({
                opacity: to
            }, speed, easing, callback);
        },
        animate: function(prop, speed, easing, callback) {
            var empty = jQuery.isEmptyObject(prop), optall = jQuery.speed(speed, easing, callback), doAnimation = function() {
                var anim = Animation(this, jQuery.extend({}, prop), optall);
                if (empty || dataPriv.get(this, "finish")) {
                    anim.stop(true);
                }
            };
            doAnimation.finish = doAnimation;
            return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
        },
        stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
                var stop = hooks.stop;
                delete hooks.stop;
                stop(gotoEnd);
            };
            if (typeof type !== "string") {
                gotoEnd = clearQueue;
                clearQueue = type;
                type = undefined;
            }
            if (clearQueue && type !== false) {
                this.queue(type || "fx", []);
            }
            return this.each(function() {
                var dequeue = true, index = type != null && type + "queueHooks", timers = jQuery.timers, data = dataPriv.get(this);
                if (index) {
                    if (data[index] && data[index].stop) {
                        stopQueue(data[index]);
                    }
                } else {
                    for (index in data) {
                        if (data[index] && data[index].stop && rrun.test(index)) {
                            stopQueue(data[index]);
                        }
                    }
                }
                for (index = timers.length; index--; ) {
                    if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
                        timers[index].anim.stop(gotoEnd);
                        dequeue = false;
                        timers.splice(index, 1);
                    }
                }
                if (dequeue || !gotoEnd) {
                    jQuery.dequeue(this, type);
                }
            });
        },
        finish: function(type) {
            if (type !== false) {
                type = type || "fx";
            }
            return this.each(function() {
                var index, data = dataPriv.get(this), queue = data[type + "queue"], hooks = data[type + "queueHooks"], timers = jQuery.timers, length = queue ? queue.length : 0;
                data.finish = true;
                jQuery.queue(this, type, []);
                if (hooks && hooks.stop) {
                    hooks.stop.call(this, true);
                }
                for (index = timers.length; index--; ) {
                    if (timers[index].elem === this && timers[index].queue === type) {
                        timers[index].anim.stop(true);
                        timers.splice(index, 1);
                    }
                }
                for (index = 0; index < length; index++) {
                    if (queue[index] && queue[index].finish) {
                        queue[index].finish.call(this);
                    }
                }
                delete data.finish;
            });
        }
    });
    jQuery.each([ "toggle", "show", "hide" ], function(i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
            return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
        };
    });
    jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
        };
    });
    jQuery.timers = [];
    jQuery.fx.tick = function() {
        var timer, i = 0, timers = jQuery.timers;
        fxNow = jQuery.now();
        for (;i < timers.length; i++) {
            timer = timers[i];
            if (!timer() && timers[i] === timer) {
                timers.splice(i--, 1);
            }
        }
        if (!timers.length) {
            jQuery.fx.stop();
        }
        fxNow = undefined;
    };
    jQuery.fx.timer = function(timer) {
        jQuery.timers.push(timer);
        if (timer()) {
            jQuery.fx.start();
        } else {
            jQuery.timers.pop();
        }
    };
    jQuery.fx.interval = 13;
    jQuery.fx.start = function() {
        if (!timerId) {
            timerId = window.setInterval(jQuery.fx.tick, jQuery.fx.interval);
        }
    };
    jQuery.fx.stop = function() {
        window.clearInterval(timerId);
        timerId = null;
    };
    jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    };
    jQuery.fn.delay = function(time, type) {
        time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
        type = type || "fx";
        return this.queue(type, function(next, hooks) {
            var timeout = window.setTimeout(next, time);
            hooks.stop = function() {
                window.clearTimeout(timeout);
            };
        });
    };
    (function() {
        var input = document.createElement("input"), select = document.createElement("select"), opt = select.appendChild(document.createElement("option"));
        input.type = "checkbox";
        support.checkOn = input.value !== "";
        support.optSelected = opt.selected;
        select.disabled = true;
        support.optDisabled = !opt.disabled;
        input = document.createElement("input");
        input.value = "t";
        input.type = "radio";
        support.radioValue = input.value === "t";
    })();
    var boolHook, attrHandle = jQuery.expr.attrHandle;
    jQuery.fn.extend({
        attr: function(name, value) {
            return access(this, jQuery.attr, name, value, arguments.length > 1);
        },
        removeAttr: function(name) {
            return this.each(function() {
                jQuery.removeAttr(this, name);
            });
        }
    });
    jQuery.extend({
        attr: function(elem, name, value) {
            var ret, hooks, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
                return;
            }
            if (typeof elem.getAttribute === "undefined") {
                return jQuery.prop(elem, name, value);
            }
            if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
                name = name.toLowerCase();
                hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
            }
            if (value !== undefined) {
                if (value === null) {
                    jQuery.removeAttr(elem, name);
                    return;
                }
                if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
                    return ret;
                }
                elem.setAttribute(name, value + "");
                return value;
            }
            if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
                return ret;
            }
            ret = jQuery.find.attr(elem, name);
            return ret == null ? undefined : ret;
        },
        attrHooks: {
            type: {
                set: function(elem, value) {
                    if (!support.radioValue && value === "radio" && jQuery.nodeName(elem, "input")) {
                        var val = elem.value;
                        elem.setAttribute("type", value);
                        if (val) {
                            elem.value = val;
                        }
                        return value;
                    }
                }
            }
        },
        removeAttr: function(elem, value) {
            var name, propName, i = 0, attrNames = value && value.match(rnotwhite);
            if (attrNames && elem.nodeType === 1) {
                while (name = attrNames[i++]) {
                    propName = jQuery.propFix[name] || name;
                    if (jQuery.expr.match.bool.test(name)) {
                        elem[propName] = false;
                    }
                    elem.removeAttribute(name);
                }
            }
        }
    });
    boolHook = {
        set: function(elem, value, name) {
            if (value === false) {
                jQuery.removeAttr(elem, name);
            } else {
                elem.setAttribute(name, name);
            }
            return name;
        }
    };
    jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function(i, name) {
        var getter = attrHandle[name] || jQuery.find.attr;
        attrHandle[name] = function(elem, name, isXML) {
            var ret, handle;
            if (!isXML) {
                handle = attrHandle[name];
                attrHandle[name] = ret;
                ret = getter(elem, name, isXML) != null ? name.toLowerCase() : null;
                attrHandle[name] = handle;
            }
            return ret;
        };
    });
    var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
    jQuery.fn.extend({
        prop: function(name, value) {
            return access(this, jQuery.prop, name, value, arguments.length > 1);
        },
        removeProp: function(name) {
            return this.each(function() {
                delete this[jQuery.propFix[name] || name];
            });
        }
    });
    jQuery.extend({
        prop: function(elem, name, value) {
            var ret, hooks, nType = elem.nodeType;
            if (nType === 3 || nType === 8 || nType === 2) {
                return;
            }
            if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
                name = jQuery.propFix[name] || name;
                hooks = jQuery.propHooks[name];
            }
            if (value !== undefined) {
                if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
                    return ret;
                }
                return elem[name] = value;
            }
            if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
                return ret;
            }
            return elem[name];
        },
        propHooks: {
            tabIndex: {
                get: function(elem) {
                    var tabindex = jQuery.find.attr(elem, "tabindex");
                    return tabindex ? parseInt(tabindex, 10) : rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href ? 0 : -1;
                }
            }
        },
        propFix: {
            for: "htmlFor",
            class: "className"
        }
    });
    if (!support.optSelected) {
        jQuery.propHooks.selected = {
            get: function(elem) {
                var parent = elem.parentNode;
                if (parent && parent.parentNode) {
                    parent.parentNode.selectedIndex;
                }
                return null;
            },
            set: function(elem) {
                var parent = elem.parentNode;
                if (parent) {
                    parent.selectedIndex;
                    if (parent.parentNode) {
                        parent.parentNode.selectedIndex;
                    }
                }
            }
        };
    }
    jQuery.each([ "tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable" ], function() {
        jQuery.propFix[this.toLowerCase()] = this;
    });
    var rclass = /[\t\r\n\f]/g;
    function getClass(elem) {
        return elem.getAttribute && elem.getAttribute("class") || "";
    }
    jQuery.fn.extend({
        addClass: function(value) {
            var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
            if (jQuery.isFunction(value)) {
                return this.each(function(j) {
                    jQuery(this).addClass(value.call(this, j, getClass(this)));
                });
            }
            if (typeof value === "string" && value) {
                classes = value.match(rnotwhite) || [];
                while (elem = this[i++]) {
                    curValue = getClass(elem);
                    cur = elem.nodeType === 1 && (" " + curValue + " ").replace(rclass, " ");
                    if (cur) {
                        j = 0;
                        while (clazz = classes[j++]) {
                            if (cur.indexOf(" " + clazz + " ") < 0) {
                                cur += clazz + " ";
                            }
                        }
                        finalValue = jQuery.trim(cur);
                        if (curValue !== finalValue) {
                            elem.setAttribute("class", finalValue);
                        }
                    }
                }
            }
            return this;
        },
        removeClass: function(value) {
            var classes, elem, cur, curValue, clazz, j, finalValue, i = 0;
            if (jQuery.isFunction(value)) {
                return this.each(function(j) {
                    jQuery(this).removeClass(value.call(this, j, getClass(this)));
                });
            }
            if (!arguments.length) {
                return this.attr("class", "");
            }
            if (typeof value === "string" && value) {
                classes = value.match(rnotwhite) || [];
                while (elem = this[i++]) {
                    curValue = getClass(elem);
                    cur = elem.nodeType === 1 && (" " + curValue + " ").replace(rclass, " ");
                    if (cur) {
                        j = 0;
                        while (clazz = classes[j++]) {
                            while (cur.indexOf(" " + clazz + " ") > -1) {
                                cur = cur.replace(" " + clazz + " ", " ");
                            }
                        }
                        finalValue = jQuery.trim(cur);
                        if (curValue !== finalValue) {
                            elem.setAttribute("class", finalValue);
                        }
                    }
                }
            }
            return this;
        },
        toggleClass: function(value, stateVal) {
            var type = typeof value;
            if (typeof stateVal === "boolean" && type === "string") {
                return stateVal ? this.addClass(value) : this.removeClass(value);
            }
            if (jQuery.isFunction(value)) {
                return this.each(function(i) {
                    jQuery(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal);
                });
            }
            return this.each(function() {
                var className, i, self, classNames;
                if (type === "string") {
                    i = 0;
                    self = jQuery(this);
                    classNames = value.match(rnotwhite) || [];
                    while (className = classNames[i++]) {
                        if (self.hasClass(className)) {
                            self.removeClass(className);
                        } else {
                            self.addClass(className);
                        }
                    }
                } else if (value === undefined || type === "boolean") {
                    className = getClass(this);
                    if (className) {
                        dataPriv.set(this, "__className__", className);
                    }
                    if (this.setAttribute) {
                        this.setAttribute("class", className || value === false ? "" : dataPriv.get(this, "__className__") || "");
                    }
                }
            });
        },
        hasClass: function(selector) {
            var className, elem, i = 0;
            className = " " + selector + " ";
            while (elem = this[i++]) {
                if (elem.nodeType === 1 && (" " + getClass(elem) + " ").replace(rclass, " ").indexOf(className) > -1) {
                    return true;
                }
            }
            return false;
        }
    });
    var rreturn = /\r/g, rspaces = /[\x20\t\r\n\f]+/g;
    jQuery.fn.extend({
        val: function(value) {
            var hooks, ret, isFunction, elem = this[0];
            if (!arguments.length) {
                if (elem) {
                    hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];
                    if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
                        return ret;
                    }
                    ret = elem.value;
                    return typeof ret === "string" ? ret.replace(rreturn, "") : ret == null ? "" : ret;
                }
                return;
            }
            isFunction = jQuery.isFunction(value);
            return this.each(function(i) {
                var val;
                if (this.nodeType !== 1) {
                    return;
                }
                if (isFunction) {
                    val = value.call(this, i, jQuery(this).val());
                } else {
                    val = value;
                }
                if (val == null) {
                    val = "";
                } else if (typeof val === "number") {
                    val += "";
                } else if (jQuery.isArray(val)) {
                    val = jQuery.map(val, function(value) {
                        return value == null ? "" : value + "";
                    });
                }
                hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];
                if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
                    this.value = val;
                }
            });
        }
    });
    jQuery.extend({
        valHooks: {
            option: {
                get: function(elem) {
                    var val = jQuery.find.attr(elem, "value");
                    return val != null ? val : jQuery.trim(jQuery.text(elem)).replace(rspaces, " ");
                }
            },
            select: {
                get: function(elem) {
                    var value, option, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one" || index < 0, values = one ? null : [], max = one ? index + 1 : options.length, i = index < 0 ? max : one ? index : 0;
                    for (;i < max; i++) {
                        option = options[i];
                        if ((option.selected || i === index) && (support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode, "optgroup"))) {
                            value = jQuery(option).val();
                            if (one) {
                                return value;
                            }
                            values.push(value);
                        }
                    }
                    return values;
                },
                set: function(elem, value) {
                    var optionSet, option, options = elem.options, values = jQuery.makeArray(value), i = options.length;
                    while (i--) {
                        option = options[i];
                        if (option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1) {
                            optionSet = true;
                        }
                    }
                    if (!optionSet) {
                        elem.selectedIndex = -1;
                    }
                    return values;
                }
            }
        }
    });
    jQuery.each([ "radio", "checkbox" ], function() {
        jQuery.valHooks[this] = {
            set: function(elem, value) {
                if (jQuery.isArray(value)) {
                    return elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1;
                }
            }
        };
        if (!support.checkOn) {
            jQuery.valHooks[this].get = function(elem) {
                return elem.getAttribute("value") === null ? "on" : elem.value;
            };
        }
    });
    var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;
    jQuery.extend(jQuery.event, {
        trigger: function(event, data, elem, onlyHandlers) {
            var i, cur, tmp, bubbleType, ontype, handle, special, eventPath = [ elem || document ], type = hasOwn.call(event, "type") ? event.type : event, namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
            cur = tmp = elem = elem || document;
            if (elem.nodeType === 3 || elem.nodeType === 8) {
                return;
            }
            if (rfocusMorph.test(type + jQuery.event.triggered)) {
                return;
            }
            if (type.indexOf(".") > -1) {
                namespaces = type.split(".");
                type = namespaces.shift();
                namespaces.sort();
            }
            ontype = type.indexOf(":") < 0 && "on" + type;
            event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);
            event.isTrigger = onlyHandlers ? 2 : 3;
            event.namespace = namespaces.join(".");
            event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
            event.result = undefined;
            if (!event.target) {
                event.target = elem;
            }
            data = data == null ? [ event ] : jQuery.makeArray(data, [ event ]);
            special = jQuery.event.special[type] || {};
            if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
                return;
            }
            if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
                bubbleType = special.delegateType || type;
                if (!rfocusMorph.test(bubbleType + type)) {
                    cur = cur.parentNode;
                }
                for (;cur; cur = cur.parentNode) {
                    eventPath.push(cur);
                    tmp = cur;
                }
                if (tmp === (elem.ownerDocument || document)) {
                    eventPath.push(tmp.defaultView || tmp.parentWindow || window);
                }
            }
            i = 0;
            while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
                event.type = i > 1 ? bubbleType : special.bindType || type;
                handle = (dataPriv.get(cur, "events") || {})[event.type] && dataPriv.get(cur, "handle");
                if (handle) {
                    handle.apply(cur, data);
                }
                handle = ontype && cur[ontype];
                if (handle && handle.apply && acceptData(cur)) {
                    event.result = handle.apply(cur, data);
                    if (event.result === false) {
                        event.preventDefault();
                    }
                }
            }
            event.type = type;
            if (!onlyHandlers && !event.isDefaultPrevented()) {
                if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
                    if (ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)) {
                        tmp = elem[ontype];
                        if (tmp) {
                            elem[ontype] = null;
                        }
                        jQuery.event.triggered = type;
                        elem[type]();
                        jQuery.event.triggered = undefined;
                        if (tmp) {
                            elem[ontype] = tmp;
                        }
                    }
                }
            }
            return event.result;
        },
        simulate: function(type, elem, event) {
            var e = jQuery.extend(new jQuery.Event(), event, {
                type: type,
                isSimulated: true
            });
            jQuery.event.trigger(e, null, elem);
        }
    });
    jQuery.fn.extend({
        trigger: function(type, data) {
            return this.each(function() {
                jQuery.event.trigger(type, data, this);
            });
        },
        triggerHandler: function(type, data) {
            var elem = this[0];
            if (elem) {
                return jQuery.event.trigger(type, data, elem, true);
            }
        }
    });
    jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup error contextmenu").split(" "), function(i, name) {
        jQuery.fn[name] = function(data, fn) {
            return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
        };
    });
    jQuery.fn.extend({
        hover: function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        }
    });
    support.focusin = "onfocusin" in window;
    if (!support.focusin) {
        jQuery.each({
            focus: "focusin",
            blur: "focusout"
        }, function(orig, fix) {
            var handler = function(event) {
                jQuery.event.simulate(fix, event.target, jQuery.event.fix(event));
            };
            jQuery.event.special[fix] = {
                setup: function() {
                    var doc = this.ownerDocument || this, attaches = dataPriv.access(doc, fix);
                    if (!attaches) {
                        doc.addEventListener(orig, handler, true);
                    }
                    dataPriv.access(doc, fix, (attaches || 0) + 1);
                },
                teardown: function() {
                    var doc = this.ownerDocument || this, attaches = dataPriv.access(doc, fix) - 1;
                    if (!attaches) {
                        doc.removeEventListener(orig, handler, true);
                        dataPriv.remove(doc, fix);
                    } else {
                        dataPriv.access(doc, fix, attaches);
                    }
                }
            };
        });
    }
    var location = window.location;
    var nonce = jQuery.now();
    var rquery = /\?/;
    jQuery.parseJSON = function(data) {
        return JSON.parse(data + "");
    };
    jQuery.parseXML = function(data) {
        var xml;
        if (!data || typeof data !== "string") {
            return null;
        }
        try {
            xml = new window.DOMParser().parseFromString(data, "text/xml");
        } catch (e) {
            xml = undefined;
        }
        if (!xml || xml.getElementsByTagName("parsererror").length) {
            jQuery.error("Invalid XML: " + data);
        }
        return xml;
    };
    var rhash = /#.*$/, rts = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/gm, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, prefilters = {}, transports = {}, allTypes = "*/".concat("*"), originAnchor = document.createElement("a");
    originAnchor.href = location.href;
    function addToPrefiltersOrTransports(structure) {
        return function(dataTypeExpression, func) {
            if (typeof dataTypeExpression !== "string") {
                func = dataTypeExpression;
                dataTypeExpression = "*";
            }
            var dataType, i = 0, dataTypes = dataTypeExpression.toLowerCase().match(rnotwhite) || [];
            if (jQuery.isFunction(func)) {
                while (dataType = dataTypes[i++]) {
                    if (dataType[0] === "+") {
                        dataType = dataType.slice(1) || "*";
                        (structure[dataType] = structure[dataType] || []).unshift(func);
                    } else {
                        (structure[dataType] = structure[dataType] || []).push(func);
                    }
                }
            }
        };
    }
    function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
        var inspected = {}, seekingTransport = structure === transports;
        function inspect(dataType) {
            var selected;
            inspected[dataType] = true;
            jQuery.each(structure[dataType] || [], function(_, prefilterOrFactory) {
                var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
                if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
                    options.dataTypes.unshift(dataTypeOrTransport);
                    inspect(dataTypeOrTransport);
                    return false;
                } else if (seekingTransport) {
                    return !(selected = dataTypeOrTransport);
                }
            });
            return selected;
        }
        return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
    }
    function ajaxExtend(target, src) {
        var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for (key in src) {
            if (src[key] !== undefined) {
                (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
            }
        }
        if (deep) {
            jQuery.extend(true, target, deep);
        }
        return target;
    }
    function ajaxHandleResponses(s, jqXHR, responses) {
        var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes;
        while (dataTypes[0] === "*") {
            dataTypes.shift();
            if (ct === undefined) {
                ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
            }
        }
        if (ct) {
            for (type in contents) {
                if (contents[type] && contents[type].test(ct)) {
                    dataTypes.unshift(type);
                    break;
                }
            }
        }
        if (dataTypes[0] in responses) {
            finalDataType = dataTypes[0];
        } else {
            for (type in responses) {
                if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                    finalDataType = type;
                    break;
                }
                if (!firstDataType) {
                    firstDataType = type;
                }
            }
            finalDataType = finalDataType || firstDataType;
        }
        if (finalDataType) {
            if (finalDataType !== dataTypes[0]) {
                dataTypes.unshift(finalDataType);
            }
            return responses[finalDataType];
        }
    }
    function ajaxConvert(s, response, jqXHR, isSuccess) {
        var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
        if (dataTypes[1]) {
            for (conv in s.converters) {
                converters[conv.toLowerCase()] = s.converters[conv];
            }
        }
        current = dataTypes.shift();
        while (current) {
            if (s.responseFields[current]) {
                jqXHR[s.responseFields[current]] = response;
            }
            if (!prev && isSuccess && s.dataFilter) {
                response = s.dataFilter(response, s.dataType);
            }
            prev = current;
            current = dataTypes.shift();
            if (current) {
                if (current === "*") {
                    current = prev;
                } else if (prev !== "*" && prev !== current) {
                    conv = converters[prev + " " + current] || converters["* " + current];
                    if (!conv) {
                        for (conv2 in converters) {
                            tmp = conv2.split(" ");
                            if (tmp[1] === current) {
                                conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                                if (conv) {
                                    if (conv === true) {
                                        conv = converters[conv2];
                                    } else if (converters[conv2] !== true) {
                                        current = tmp[0];
                                        dataTypes.unshift(tmp[1]);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if (conv !== true) {
                        if (conv && s.throws) {
                            response = conv(response);
                        } else {
                            try {
                                response = conv(response);
                            } catch (e) {
                                return {
                                    state: "parsererror",
                                    error: conv ? e : "No conversion from " + prev + " to " + current
                                };
                            }
                        }
                    }
                }
            }
        }
        return {
            state: "success",
            data: response
        };
    }
    jQuery.extend({
        active: 0,
        lastModified: {},
        etag: {},
        ajaxSettings: {
            url: location.href,
            type: "GET",
            isLocal: rlocalProtocol.test(location.protocol),
            global: true,
            processData: true,
            async: true,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            accepts: {
                "*": allTypes,
                text: "text/plain",
                html: "text/html",
                xml: "application/xml, text/xml",
                json: "application/json, text/javascript"
            },
            contents: {
                xml: /\bxml\b/,
                html: /\bhtml/,
                json: /\bjson\b/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText",
                json: "responseJSON"
            },
            converters: {
                "* text": String,
                "text html": true,
                "text json": jQuery.parseJSON,
                "text xml": jQuery.parseXML
            },
            flatOptions: {
                url: true,
                context: true
            }
        },
        ajaxSetup: function(target, settings) {
            return settings ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) : ajaxExtend(jQuery.ajaxSettings, target);
        },
        ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
        ajaxTransport: addToPrefiltersOrTransports(transports),
        ajax: function(url, options) {
            if (typeof url === "object") {
                options = url;
                url = undefined;
            }
            options = options || {};
            var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, fireGlobals, i, s = jQuery.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event, deferred = jQuery.Deferred(), completeDeferred = jQuery.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, state = 0, strAbort = "canceled", jqXHR = {
                readyState: 0,
                getResponseHeader: function(key) {
                    var match;
                    if (state === 2) {
                        if (!responseHeaders) {
                            responseHeaders = {};
                            while (match = rheaders.exec(responseHeadersString)) {
                                responseHeaders[match[1].toLowerCase()] = match[2];
                            }
                        }
                        match = responseHeaders[key.toLowerCase()];
                    }
                    return match == null ? null : match;
                },
                getAllResponseHeaders: function() {
                    return state === 2 ? responseHeadersString : null;
                },
                setRequestHeader: function(name, value) {
                    var lname = name.toLowerCase();
                    if (!state) {
                        name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;
                        requestHeaders[name] = value;
                    }
                    return this;
                },
                overrideMimeType: function(type) {
                    if (!state) {
                        s.mimeType = type;
                    }
                    return this;
                },
                statusCode: function(map) {
                    var code;
                    if (map) {
                        if (state < 2) {
                            for (code in map) {
                                statusCode[code] = [ statusCode[code], map[code] ];
                            }
                        } else {
                            jqXHR.always(map[jqXHR.status]);
                        }
                    }
                    return this;
                },
                abort: function(statusText) {
                    var finalText = statusText || strAbort;
                    if (transport) {
                        transport.abort(finalText);
                    }
                    done(0, finalText);
                    return this;
                }
            };
            deferred.promise(jqXHR).complete = completeDeferred.add;
            jqXHR.success = jqXHR.done;
            jqXHR.error = jqXHR.fail;
            s.url = ((url || s.url || location.href) + "").replace(rhash, "").replace(rprotocol, location.protocol + "//");
            s.type = options.method || options.type || s.method || s.type;
            s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(rnotwhite) || [ "" ];
            if (s.crossDomain == null) {
                urlAnchor = document.createElement("a");
                try {
                    urlAnchor.href = s.url;
                    urlAnchor.href = urlAnchor.href;
                    s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
                } catch (e) {
                    s.crossDomain = true;
                }
            }
            if (s.data && s.processData && typeof s.data !== "string") {
                s.data = jQuery.param(s.data, s.traditional);
            }
            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
            if (state === 2) {
                return jqXHR;
            }
            fireGlobals = jQuery.event && s.global;
            if (fireGlobals && jQuery.active++ === 0) {
                jQuery.event.trigger("ajaxStart");
            }
            s.type = s.type.toUpperCase();
            s.hasContent = !rnoContent.test(s.type);
            cacheURL = s.url;
            if (!s.hasContent) {
                if (s.data) {
                    cacheURL = s.url += (rquery.test(cacheURL) ? "&" : "?") + s.data;
                    delete s.data;
                }
                if (s.cache === false) {
                    s.url = rts.test(cacheURL) ? cacheURL.replace(rts, "$1_=" + nonce++) : cacheURL + (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce++;
                }
            }
            if (s.ifModified) {
                if (jQuery.lastModified[cacheURL]) {
                    jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
                }
                if (jQuery.etag[cacheURL]) {
                    jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
                }
            }
            if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
                jqXHR.setRequestHeader("Content-Type", s.contentType);
            }
            jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
            for (i in s.headers) {
                jqXHR.setRequestHeader(i, s.headers[i]);
            }
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || state === 2)) {
                return jqXHR.abort();
            }
            strAbort = "abort";
            for (i in {
                success: 1,
                error: 1,
                complete: 1
            }) {
                jqXHR[i](s[i]);
            }
            transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
            if (!transport) {
                done(-1, "No Transport");
            } else {
                jqXHR.readyState = 1;
                if (fireGlobals) {
                    globalEventContext.trigger("ajaxSend", [ jqXHR, s ]);
                }
                if (state === 2) {
                    return jqXHR;
                }
                if (s.async && s.timeout > 0) {
                    timeoutTimer = window.setTimeout(function() {
                        jqXHR.abort("timeout");
                    }, s.timeout);
                }
                try {
                    state = 1;
                    transport.send(requestHeaders, done);
                } catch (e) {
                    if (state < 2) {
                        done(-1, e);
                    } else {
                        throw e;
                    }
                }
            }
            function done(status, nativeStatusText, responses, headers) {
                var isSuccess, success, error, response, modified, statusText = nativeStatusText;
                if (state === 2) {
                    return;
                }
                state = 2;
                if (timeoutTimer) {
                    window.clearTimeout(timeoutTimer);
                }
                transport = undefined;
                responseHeadersString = headers || "";
                jqXHR.readyState = status > 0 ? 4 : 0;
                isSuccess = status >= 200 && status < 300 || status === 304;
                if (responses) {
                    response = ajaxHandleResponses(s, jqXHR, responses);
                }
                response = ajaxConvert(s, response, jqXHR, isSuccess);
                if (isSuccess) {
                    if (s.ifModified) {
                        modified = jqXHR.getResponseHeader("Last-Modified");
                        if (modified) {
                            jQuery.lastModified[cacheURL] = modified;
                        }
                        modified = jqXHR.getResponseHeader("etag");
                        if (modified) {
                            jQuery.etag[cacheURL] = modified;
                        }
                    }
                    if (status === 204 || s.type === "HEAD") {
                        statusText = "nocontent";
                    } else if (status === 304) {
                        statusText = "notmodified";
                    } else {
                        statusText = response.state;
                        success = response.data;
                        error = response.error;
                        isSuccess = !error;
                    }
                } else {
                    error = statusText;
                    if (status || !statusText) {
                        statusText = "error";
                        if (status < 0) {
                            status = 0;
                        }
                    }
                }
                jqXHR.status = status;
                jqXHR.statusText = (nativeStatusText || statusText) + "";
                if (isSuccess) {
                    deferred.resolveWith(callbackContext, [ success, statusText, jqXHR ]);
                } else {
                    deferred.rejectWith(callbackContext, [ jqXHR, statusText, error ]);
                }
                jqXHR.statusCode(statusCode);
                statusCode = undefined;
                if (fireGlobals) {
                    globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [ jqXHR, s, isSuccess ? success : error ]);
                }
                completeDeferred.fireWith(callbackContext, [ jqXHR, statusText ]);
                if (fireGlobals) {
                    globalEventContext.trigger("ajaxComplete", [ jqXHR, s ]);
                    if (!--jQuery.active) {
                        jQuery.event.trigger("ajaxStop");
                    }
                }
            }
            return jqXHR;
        },
        getJSON: function(url, data, callback) {
            return jQuery.get(url, data, callback, "json");
        },
        getScript: function(url, callback) {
            return jQuery.get(url, undefined, callback, "script");
        }
    });
    jQuery.each([ "get", "post" ], function(i, method) {
        jQuery[method] = function(url, data, callback, type) {
            if (jQuery.isFunction(data)) {
                type = type || callback;
                callback = data;
                data = undefined;
            }
            return jQuery.ajax(jQuery.extend({
                url: url,
                type: method,
                dataType: type,
                data: data,
                success: callback
            }, jQuery.isPlainObject(url) && url));
        };
    });
    jQuery._evalUrl = function(url) {
        return jQuery.ajax({
            url: url,
            type: "GET",
            dataType: "script",
            async: false,
            global: false,
            throws: true
        });
    };
    jQuery.fn.extend({
        wrapAll: function(html) {
            var wrap;
            if (jQuery.isFunction(html)) {
                return this.each(function(i) {
                    jQuery(this).wrapAll(html.call(this, i));
                });
            }
            if (this[0]) {
                wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);
                if (this[0].parentNode) {
                    wrap.insertBefore(this[0]);
                }
                wrap.map(function() {
                    var elem = this;
                    while (elem.firstElementChild) {
                        elem = elem.firstElementChild;
                    }
                    return elem;
                }).append(this);
            }
            return this;
        },
        wrapInner: function(html) {
            if (jQuery.isFunction(html)) {
                return this.each(function(i) {
                    jQuery(this).wrapInner(html.call(this, i));
                });
            }
            return this.each(function() {
                var self = jQuery(this), contents = self.contents();
                if (contents.length) {
                    contents.wrapAll(html);
                } else {
                    self.append(html);
                }
            });
        },
        wrap: function(html) {
            var isFunction = jQuery.isFunction(html);
            return this.each(function(i) {
                jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
            });
        },
        unwrap: function() {
            return this.parent().each(function() {
                if (!jQuery.nodeName(this, "body")) {
                    jQuery(this).replaceWith(this.childNodes);
                }
            }).end();
        }
    });
    jQuery.expr.filters.hidden = function(elem) {
        return !jQuery.expr.filters.visible(elem);
    };
    jQuery.expr.filters.visible = function(elem) {
        return elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
    };
    var r20 = /%20/g, rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
    function buildParams(prefix, obj, traditional, add) {
        var name;
        if (jQuery.isArray(obj)) {
            jQuery.each(obj, function(i, v) {
                if (traditional || rbracket.test(prefix)) {
                    add(prefix, v);
                } else {
                    buildParams(prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]", v, traditional, add);
                }
            });
        } else if (!traditional && jQuery.type(obj) === "object") {
            for (name in obj) {
                buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
            }
        } else {
            add(prefix, obj);
        }
    }
    jQuery.param = function(a, traditional) {
        var prefix, s = [], add = function(key, value) {
            value = jQuery.isFunction(value) ? value() : value == null ? "" : value;
            s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
        };
        if (traditional === undefined) {
            traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
        }
        if (jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {
            jQuery.each(a, function() {
                add(this.name, this.value);
            });
        } else {
            for (prefix in a) {
                buildParams(prefix, a[prefix], traditional, add);
            }
        }
        return s.join("&").replace(r20, "+");
    };
    jQuery.fn.extend({
        serialize: function() {
            return jQuery.param(this.serializeArray());
        },
        serializeArray: function() {
            return this.map(function() {
                var elements = jQuery.prop(this, "elements");
                return elements ? jQuery.makeArray(elements) : this;
            }).filter(function() {
                var type = this.type;
                return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
            }).map(function(i, elem) {
                var val = jQuery(this).val();
                return val == null ? null : jQuery.isArray(val) ? jQuery.map(val, function(val) {
                    return {
                        name: elem.name,
                        value: val.replace(rCRLF, "\r\n")
                    };
                }) : {
                    name: elem.name,
                    value: val.replace(rCRLF, "\r\n")
                };
            }).get();
        }
    });
    jQuery.ajaxSettings.xhr = function() {
        try {
            return new window.XMLHttpRequest();
        } catch (e) {}
    };
    var xhrSuccessStatus = {
        0: 200,
        1223: 204
    }, xhrSupported = jQuery.ajaxSettings.xhr();
    support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
    support.ajax = xhrSupported = !!xhrSupported;
    jQuery.ajaxTransport(function(options) {
        var callback, errorCallback;
        if (support.cors || xhrSupported && !options.crossDomain) {
            return {
                send: function(headers, complete) {
                    var i, xhr = options.xhr();
                    xhr.open(options.type, options.url, options.async, options.username, options.password);
                    if (options.xhrFields) {
                        for (i in options.xhrFields) {
                            xhr[i] = options.xhrFields[i];
                        }
                    }
                    if (options.mimeType && xhr.overrideMimeType) {
                        xhr.overrideMimeType(options.mimeType);
                    }
                    if (!options.crossDomain && !headers["X-Requested-With"]) {
                        headers["X-Requested-With"] = "XMLHttpRequest";
                    }
                    for (i in headers) {
                        xhr.setRequestHeader(i, headers[i]);
                    }
                    callback = function(type) {
                        return function() {
                            if (callback) {
                                callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;
                                if (type === "abort") {
                                    xhr.abort();
                                } else if (type === "error") {
                                    if (typeof xhr.status !== "number") {
                                        complete(0, "error");
                                    } else {
                                        complete(xhr.status, xhr.statusText);
                                    }
                                } else {
                                    complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText, (xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? {
                                        binary: xhr.response
                                    } : {
                                        text: xhr.responseText
                                    }, xhr.getAllResponseHeaders());
                                }
                            }
                        };
                    };
                    xhr.onload = callback();
                    errorCallback = xhr.onerror = callback("error");
                    if (xhr.onabort !== undefined) {
                        xhr.onabort = errorCallback;
                    } else {
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                window.setTimeout(function() {
                                    if (callback) {
                                        errorCallback();
                                    }
                                });
                            }
                        };
                    }
                    callback = callback("abort");
                    try {
                        xhr.send(options.hasContent && options.data || null);
                    } catch (e) {
                        if (callback) {
                            throw e;
                        }
                    }
                },
                abort: function() {
                    if (callback) {
                        callback();
                    }
                }
            };
        }
    });
    jQuery.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, " + "application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /\b(?:java|ecma)script\b/
        },
        converters: {
            "text script": function(text) {
                jQuery.globalEval(text);
                return text;
            }
        }
    });
    jQuery.ajaxPrefilter("script", function(s) {
        if (s.cache === undefined) {
            s.cache = false;
        }
        if (s.crossDomain) {
            s.type = "GET";
        }
    });
    jQuery.ajaxTransport("script", function(s) {
        if (s.crossDomain) {
            var script, callback;
            return {
                send: function(_, complete) {
                    script = jQuery("<script>").prop({
                        charset: s.scriptCharset,
                        src: s.url
                    }).on("load error", callback = function(evt) {
                        script.remove();
                        callback = null;
                        if (evt) {
                            complete(evt.type === "error" ? 404 : 200, evt.type);
                        }
                    });
                    document.head.appendChild(script[0]);
                },
                abort: function() {
                    if (callback) {
                        callback();
                    }
                }
            };
        }
    });
    var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
    jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce++;
            this[callback] = true;
            return callback;
        }
    });
    jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
        var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
        if (jsonProp || s.dataTypes[0] === "jsonp") {
            callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
            if (jsonProp) {
                s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
            } else if (s.jsonp !== false) {
                s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
            }
            s.converters["script json"] = function() {
                if (!responseContainer) {
                    jQuery.error(callbackName + " was not called");
                }
                return responseContainer[0];
            };
            s.dataTypes[0] = "json";
            overwritten = window[callbackName];
            window[callbackName] = function() {
                responseContainer = arguments;
            };
            jqXHR.always(function() {
                if (overwritten === undefined) {
                    jQuery(window).removeProp(callbackName);
                } else {
                    window[callbackName] = overwritten;
                }
                if (s[callbackName]) {
                    s.jsonpCallback = originalSettings.jsonpCallback;
                    oldCallbacks.push(callbackName);
                }
                if (responseContainer && jQuery.isFunction(overwritten)) {
                    overwritten(responseContainer[0]);
                }
                responseContainer = overwritten = undefined;
            });
            return "script";
        }
    });
    jQuery.parseHTML = function(data, context, keepScripts) {
        if (!data || typeof data !== "string") {
            return null;
        }
        if (typeof context === "boolean") {
            keepScripts = context;
            context = false;
        }
        context = context || document;
        var parsed = rsingleTag.exec(data), scripts = !keepScripts && [];
        if (parsed) {
            return [ context.createElement(parsed[1]) ];
        }
        parsed = buildFragment([ data ], context, scripts);
        if (scripts && scripts.length) {
            jQuery(scripts).remove();
        }
        return jQuery.merge([], parsed.childNodes);
    };
    var _load = jQuery.fn.load;
    jQuery.fn.load = function(url, params, callback) {
        if (typeof url !== "string" && _load) {
            return _load.apply(this, arguments);
        }
        var selector, type, response, self = this, off = url.indexOf(" ");
        if (off > -1) {
            selector = jQuery.trim(url.slice(off));
            url = url.slice(0, off);
        }
        if (jQuery.isFunction(params)) {
            callback = params;
            params = undefined;
        } else if (params && typeof params === "object") {
            type = "POST";
        }
        if (self.length > 0) {
            jQuery.ajax({
                url: url,
                type: type || "GET",
                dataType: "html",
                data: params
            }).done(function(responseText) {
                response = arguments;
                self.html(selector ? jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) : responseText);
            }).always(callback && function(jqXHR, status) {
                self.each(function() {
                    callback.apply(this, response || [ jqXHR.responseText, status, jqXHR ]);
                });
            });
        }
        return this;
    };
    jQuery.each([ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function(i, type) {
        jQuery.fn[type] = function(fn) {
            return this.on(type, fn);
        };
    });
    jQuery.expr.filters.animated = function(elem) {
        return jQuery.grep(jQuery.timers, function(fn) {
            return elem === fn.elem;
        }).length;
    };
    function getWindow(elem) {
        return jQuery.isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
    }
    jQuery.offset = {
        setOffset: function(elem, options, i) {
            var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery.css(elem, "position"), curElem = jQuery(elem), props = {};
            if (position === "static") {
                elem.style.position = "relative";
            }
            curOffset = curElem.offset();
            curCSSTop = jQuery.css(elem, "top");
            curCSSLeft = jQuery.css(elem, "left");
            calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
            if (calculatePosition) {
                curPosition = curElem.position();
                curTop = curPosition.top;
                curLeft = curPosition.left;
            } else {
                curTop = parseFloat(curCSSTop) || 0;
                curLeft = parseFloat(curCSSLeft) || 0;
            }
            if (jQuery.isFunction(options)) {
                options = options.call(elem, i, jQuery.extend({}, curOffset));
            }
            if (options.top != null) {
                props.top = options.top - curOffset.top + curTop;
            }
            if (options.left != null) {
                props.left = options.left - curOffset.left + curLeft;
            }
            if ("using" in options) {
                options.using.call(elem, props);
            } else {
                curElem.css(props);
            }
        }
    };
    jQuery.fn.extend({
        offset: function(options) {
            if (arguments.length) {
                return options === undefined ? this : this.each(function(i) {
                    jQuery.offset.setOffset(this, options, i);
                });
            }
            var docElem, win, elem = this[0], box = {
                top: 0,
                left: 0
            }, doc = elem && elem.ownerDocument;
            if (!doc) {
                return;
            }
            docElem = doc.documentElement;
            if (!jQuery.contains(docElem, elem)) {
                return box;
            }
            box = elem.getBoundingClientRect();
            win = getWindow(doc);
            return {
                top: box.top + win.pageYOffset - docElem.clientTop,
                left: box.left + win.pageXOffset - docElem.clientLeft
            };
        },
        position: function() {
            if (!this[0]) {
                return;
            }
            var offsetParent, offset, elem = this[0], parentOffset = {
                top: 0,
                left: 0
            };
            if (jQuery.css(elem, "position") === "fixed") {
                offset = elem.getBoundingClientRect();
            } else {
                offsetParent = this.offsetParent();
                offset = this.offset();
                if (!jQuery.nodeName(offsetParent[0], "html")) {
                    parentOffset = offsetParent.offset();
                }
                parentOffset.top += jQuery.css(offsetParent[0], "borderTopWidth", true);
                parentOffset.left += jQuery.css(offsetParent[0], "borderLeftWidth", true);
            }
            return {
                top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
                left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
            };
        },
        offsetParent: function() {
            return this.map(function() {
                var offsetParent = this.offsetParent;
                while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent || documentElement;
            });
        }
    });
    jQuery.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        var top = "pageYOffset" === prop;
        jQuery.fn[method] = function(val) {
            return access(this, function(elem, method, val) {
                var win = getWindow(elem);
                if (val === undefined) {
                    return win ? win[prop] : elem[method];
                }
                if (win) {
                    win.scrollTo(!top ? val : win.pageXOffset, top ? val : win.pageYOffset);
                } else {
                    elem[method] = val;
                }
            }, method, val, arguments.length);
        };
    });
    jQuery.each([ "top", "left" ], function(i, prop) {
        jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function(elem, computed) {
            if (computed) {
                computed = curCSS(elem, prop);
                return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed;
            }
        });
    });
    jQuery.each({
        Height: "height",
        Width: "width"
    }, function(name, type) {
        jQuery.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
        }, function(defaultExtra, funcName) {
            jQuery.fn[funcName] = function(margin, value) {
                var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"), extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
                return access(this, function(elem, type, value) {
                    var doc;
                    if (jQuery.isWindow(elem)) {
                        return elem.document.documentElement["client" + name];
                    }
                    if (elem.nodeType === 9) {
                        doc = elem.documentElement;
                        return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);
                    }
                    return value === undefined ? jQuery.css(elem, type, extra) : jQuery.style(elem, type, value, extra);
                }, type, chainable ? margin : undefined, chainable, null);
            };
        });
    });
    jQuery.fn.extend({
        bind: function(types, data, fn) {
            return this.on(types, null, data, fn);
        },
        unbind: function(types, fn) {
            return this.off(types, null, fn);
        },
        delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
            return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
        },
        size: function() {
            return this.length;
        }
    });
    jQuery.fn.andSelf = jQuery.fn.addBack;
    if (typeof define === "function" && define.amd) {
        define("jquery", [], function() {
            return jQuery;
        });
    }
    var _jQuery = window.jQuery, _$ = window.$;
    jQuery.noConflict = function(deep) {
        if (window.$ === jQuery) {
            window.$ = _$;
        }
        if (deep && window.jQuery === jQuery) {
            window.jQuery = _jQuery;
        }
        return jQuery;
    };
    if (!noGlobal) {
        window.jQuery = window.$ = jQuery;
    }
    return jQuery;
});

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([ "jquery" ], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else {
        root.lightbox = factory(root.jQuery);
    }
})(this, function($) {
    function Lightbox(options) {
        this.album = [];
        this.currentImageIndex = void 0;
        this.init();
        this.options = $.extend({}, this.constructor.defaults);
        this.option(options);
    }
    Lightbox.defaults = {
        albumLabel: "Image %1 of %2",
        alwaysShowNavOnTouchDevices: false,
        fadeDuration: 500,
        fitImagesInViewport: true,
        positionFromTop: 50,
        resizeDuration: 700,
        showImageNumberLabel: true,
        wrapAround: false
    };
    Lightbox.prototype.option = function(options) {
        $.extend(this.options, options);
    };
    Lightbox.prototype.imageCountLabel = function(currentImageNum, totalImages) {
        return this.options.albumLabel.replace(/%1/g, currentImageNum).replace(/%2/g, totalImages);
    };
    Lightbox.prototype.init = function() {
        this.enable();
        this.build();
    };
    Lightbox.prototype.enable = function() {
        var self = this;
        $("body").on("click", "a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]", function(event) {
            self.start($(event.currentTarget));
            return false;
        });
    };
    Lightbox.prototype.build = function() {
        var self = this;
        $('<div id="lightboxOverlay" class="lightboxOverlay"></div><div id="lightbox" class="lightbox"><div class="lb-outerContainer"><div class="lb-container"><img class="lb-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" /><div class="lb-nav"><a class="lb-prev" href="" ></a><a class="lb-next" href="" ></a></div><div class="lb-loader"><a class="lb-cancel"></a></div></div></div><div class="lb-dataContainer"><div class="lb-data"><div class="lb-details"><span class="lb-caption"></span><span class="lb-number"></span></div><div class="lb-closeContainer"><a class="lb-close"></a></div></div></div></div>').appendTo($("body"));
        this.$lightbox = $("#lightbox");
        this.$overlay = $("#lightboxOverlay");
        this.$outerContainer = this.$lightbox.find(".lb-outerContainer");
        this.$container = this.$lightbox.find(".lb-container");
        this.containerTopPadding = parseInt(this.$container.css("padding-top"), 10);
        this.containerRightPadding = parseInt(this.$container.css("padding-right"), 10);
        this.containerBottomPadding = parseInt(this.$container.css("padding-bottom"), 10);
        this.containerLeftPadding = parseInt(this.$container.css("padding-left"), 10);
        this.$overlay.hide().on("click", function() {
            self.end();
            return false;
        });
        this.$lightbox.hide().on("click", function(event) {
            if ($(event.target).attr("id") === "lightbox") {
                self.end();
            }
            return false;
        });
        this.$outerContainer.on("click", function(event) {
            if ($(event.target).attr("id") === "lightbox") {
                self.end();
            }
            return false;
        });
        this.$lightbox.find(".lb-prev").on("click", function() {
            if (self.currentImageIndex === 0) {
                self.changeImage(self.album.length - 1);
            } else {
                self.changeImage(self.currentImageIndex - 1);
            }
            return false;
        });
        this.$lightbox.find(".lb-next").on("click", function() {
            if (self.currentImageIndex === self.album.length - 1) {
                self.changeImage(0);
            } else {
                self.changeImage(self.currentImageIndex + 1);
            }
            return false;
        });
        this.$lightbox.find(".lb-loader, .lb-close").on("click", function() {
            self.end();
            return false;
        });
    };
    Lightbox.prototype.start = function($link) {
        var self = this;
        var $window = $(window);
        $window.on("resize", $.proxy(this.sizeOverlay, this));
        $("select, object, embed").css({
            visibility: "hidden"
        });
        this.sizeOverlay();
        this.album = [];
        var imageNumber = 0;
        function addToAlbum($link) {
            self.album.push({
                link: $link.attr("href"),
                title: $link.attr("data-title") || $link.attr("title")
            });
        }
        var dataLightboxValue = $link.attr("data-lightbox");
        var $links;
        if (dataLightboxValue) {
            $links = $($link.prop("tagName") + '[data-lightbox="' + dataLightboxValue + '"]');
            for (var i = 0; i < $links.length; i = ++i) {
                addToAlbum($($links[i]));
                if ($links[i] === $link[0]) {
                    imageNumber = i;
                }
            }
        } else {
            if ($link.attr("rel") === "lightbox") {
                addToAlbum($link);
            } else {
                $links = $($link.prop("tagName") + '[rel="' + $link.attr("rel") + '"]');
                for (var j = 0; j < $links.length; j = ++j) {
                    addToAlbum($($links[j]));
                    if ($links[j] === $link[0]) {
                        imageNumber = j;
                    }
                }
            }
        }
        var top = $window.scrollTop() + this.options.positionFromTop;
        var left = $window.scrollLeft();
        this.$lightbox.css({
            top: top + "px",
            left: left + "px"
        }).fadeIn(this.options.fadeDuration);
        this.changeImage(imageNumber);
    };
    Lightbox.prototype.changeImage = function(imageNumber) {
        var self = this;
        this.disableKeyboardNav();
        var $image = this.$lightbox.find(".lb-image");
        this.$overlay.fadeIn(this.options.fadeDuration);
        $(".lb-loader").fadeIn("slow");
        this.$lightbox.find(".lb-image, .lb-nav, .lb-prev, .lb-next, .lb-dataContainer, .lb-numbers, .lb-caption").hide();
        this.$outerContainer.addClass("animating");
        var preloader = new Image();
        preloader.onload = function() {
            var $preloader;
            var imageHeight;
            var imageWidth;
            var maxImageHeight;
            var maxImageWidth;
            var windowHeight;
            var windowWidth;
            $image.attr("src", self.album[imageNumber].link);
            $preloader = $(preloader);
            $image.width(preloader.width);
            $image.height(preloader.height);
            if (self.options.fitImagesInViewport) {
                windowWidth = $(window).width();
                windowHeight = $(window).height();
                maxImageWidth = windowWidth - self.containerLeftPadding - self.containerRightPadding - 20;
                maxImageHeight = windowHeight - self.containerTopPadding - self.containerBottomPadding - 120;
                if (self.options.maxWidth && self.options.maxWidth < maxImageWidth) {
                    maxImageWidth = self.options.maxWidth;
                }
                if (self.options.maxHeight && self.options.maxHeight < maxImageWidth) {
                    maxImageHeight = self.options.maxHeight;
                }
                if (preloader.width > maxImageWidth || preloader.height > maxImageHeight) {
                    if (preloader.width / maxImageWidth > preloader.height / maxImageHeight) {
                        imageWidth = maxImageWidth;
                        imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
                        $image.width(imageWidth);
                        $image.height(imageHeight);
                    } else {
                        imageHeight = maxImageHeight;
                        imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
                        $image.width(imageWidth);
                        $image.height(imageHeight);
                    }
                }
            }
            self.sizeContainer($image.width(), $image.height());
        };
        preloader.src = this.album[imageNumber].link;
        this.currentImageIndex = imageNumber;
    };
    Lightbox.prototype.sizeOverlay = function() {
        this.$overlay.width($(window).width()).height($(document).height());
    };
    Lightbox.prototype.sizeContainer = function(imageWidth, imageHeight) {
        var self = this;
        var oldWidth = this.$outerContainer.outerWidth();
        var oldHeight = this.$outerContainer.outerHeight();
        var newWidth = imageWidth + this.containerLeftPadding + this.containerRightPadding;
        var newHeight = imageHeight + this.containerTopPadding + this.containerBottomPadding;
        function postResize() {
            self.$lightbox.find(".lb-dataContainer").width(newWidth);
            self.$lightbox.find(".lb-prevLink").height(newHeight);
            self.$lightbox.find(".lb-nextLink").height(newHeight);
            self.showImage();
        }
        if (oldWidth !== newWidth || oldHeight !== newHeight) {
            this.$outerContainer.animate({
                width: newWidth,
                height: newHeight
            }, this.options.resizeDuration, "swing", function() {
                postResize();
            });
        } else {
            postResize();
        }
    };
    Lightbox.prototype.showImage = function() {
        this.$lightbox.find(".lb-loader").stop(true).hide();
        this.$lightbox.find(".lb-image").fadeIn("slow");
        this.updateNav();
        this.updateDetails();
        this.preloadNeighboringImages();
        this.enableKeyboardNav();
    };
    Lightbox.prototype.updateNav = function() {
        var alwaysShowNav = false;
        try {
            document.createEvent("TouchEvent");
            alwaysShowNav = this.options.alwaysShowNavOnTouchDevices ? true : false;
        } catch (e) {}
        this.$lightbox.find(".lb-nav").show();
        if (this.album.length > 1) {
            if (this.options.wrapAround) {
                if (alwaysShowNav) {
                    this.$lightbox.find(".lb-prev, .lb-next").css("opacity", "1");
                }
                this.$lightbox.find(".lb-prev, .lb-next").show();
            } else {
                if (this.currentImageIndex > 0) {
                    this.$lightbox.find(".lb-prev").show();
                    if (alwaysShowNav) {
                        this.$lightbox.find(".lb-prev").css("opacity", "1");
                    }
                }
                if (this.currentImageIndex < this.album.length - 1) {
                    this.$lightbox.find(".lb-next").show();
                    if (alwaysShowNav) {
                        this.$lightbox.find(".lb-next").css("opacity", "1");
                    }
                }
            }
        }
    };
    Lightbox.prototype.updateDetails = function() {
        var self = this;
        if (typeof this.album[this.currentImageIndex].title !== "undefined" && this.album[this.currentImageIndex].title !== "") {
            this.$lightbox.find(".lb-caption").html(this.album[this.currentImageIndex].title).fadeIn("fast").find("a").on("click", function(event) {
                if ($(this).attr("target") !== undefined) {
                    window.open($(this).attr("href"), $(this).attr("target"));
                } else {
                    location.href = $(this).attr("href");
                }
            });
        }
        if (this.album.length > 1 && this.options.showImageNumberLabel) {
            var labelText = this.imageCountLabel(this.currentImageIndex + 1, this.album.length);
            this.$lightbox.find(".lb-number").text(labelText).fadeIn("fast");
        } else {
            this.$lightbox.find(".lb-number").hide();
        }
        this.$outerContainer.removeClass("animating");
        this.$lightbox.find(".lb-dataContainer").fadeIn(this.options.resizeDuration, function() {
            return self.sizeOverlay();
        });
    };
    Lightbox.prototype.preloadNeighboringImages = function() {
        if (this.album.length > this.currentImageIndex + 1) {
            var preloadNext = new Image();
            preloadNext.src = this.album[this.currentImageIndex + 1].link;
        }
        if (this.currentImageIndex > 0) {
            var preloadPrev = new Image();
            preloadPrev.src = this.album[this.currentImageIndex - 1].link;
        }
    };
    Lightbox.prototype.enableKeyboardNav = function() {
        $(document).on("keyup.keyboard", $.proxy(this.keyboardAction, this));
    };
    Lightbox.prototype.disableKeyboardNav = function() {
        $(document).off(".keyboard");
    };
    Lightbox.prototype.keyboardAction = function(event) {
        var KEYCODE_ESC = 27;
        var KEYCODE_LEFTARROW = 37;
        var KEYCODE_RIGHTARROW = 39;
        var keycode = event.keyCode;
        var key = String.fromCharCode(keycode).toLowerCase();
        if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
            this.end();
        } else if (key === "p" || keycode === KEYCODE_LEFTARROW) {
            if (this.currentImageIndex !== 0) {
                this.changeImage(this.currentImageIndex - 1);
            } else if (this.options.wrapAround && this.album.length > 1) {
                this.changeImage(this.album.length - 1);
            }
        } else if (key === "n" || keycode === KEYCODE_RIGHTARROW) {
            if (this.currentImageIndex !== this.album.length - 1) {
                this.changeImage(this.currentImageIndex + 1);
            } else if (this.options.wrapAround && this.album.length > 1) {
                this.changeImage(0);
            }
        }
    };
    Lightbox.prototype.end = function() {
        this.disableKeyboardNav();
        $(window).off("resize", this.sizeOverlay);
        this.$lightbox.fadeOut(this.options.fadeDuration);
        this.$overlay.fadeOut(this.options.fadeDuration);
        $("select, object, embed").css({
            visibility: "visible"
        });
    };
    return new Lightbox();
});

(function() {
    var root = typeof exports === "undefined" ? window : exports;
    var config = {
        retinaImageSuffix: "@2x",
        check_mime_type: true,
        force_original_dimensions: true
    };
    function Retina() {}
    root.Retina = Retina;
    Retina.configure = function(options) {
        if (options === null) {
            options = {};
        }
        for (var prop in options) {
            if (options.hasOwnProperty(prop)) {
                config[prop] = options[prop];
            }
        }
    };
    Retina.init = function(context) {
        if (context === null) {
            context = root;
        }
        var existing_onload = context.onload || function() {};
        context.onload = function() {
            var images = document.getElementsByTagName("img"), retinaImages = [], i, image;
            for (i = 0; i < images.length; i += 1) {
                image = images[i];
                if (!!!image.getAttributeNode("data-no-retina")) {
                    retinaImages.push(new RetinaImage(image));
                }
            }
            existing_onload();
        };
    };
    Retina.isRetina = function() {
        var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5), (min--moz-device-pixel-ratio: 1.5), (-o-min-device-pixel-ratio: 3/2), (min-resolution: 1.5dppx)";
        if (root.devicePixelRatio > 1) {
            return true;
        }
        if (root.matchMedia && root.matchMedia(mediaQuery).matches) {
            return true;
        }
        return false;
    };
    var regexMatch = /\.\w+$/;
    function suffixReplace(match) {
        return config.retinaImageSuffix + match;
    }
    function RetinaImagePath(path, at_2x_path) {
        this.path = path || "";
        if (typeof at_2x_path !== "undefined" && at_2x_path !== null) {
            this.at_2x_path = at_2x_path;
            this.perform_check = false;
        } else {
            if (undefined !== document.createElement) {
                var locationObject = document.createElement("a");
                locationObject.href = this.path;
                locationObject.pathname = locationObject.pathname.replace(regexMatch, suffixReplace);
                this.at_2x_path = locationObject.href;
            } else {
                var parts = this.path.split("?");
                parts[0] = parts[0].replace(regexMatch, suffixReplace);
                this.at_2x_path = parts.join("?");
            }
            this.perform_check = true;
        }
    }
    root.RetinaImagePath = RetinaImagePath;
    RetinaImagePath.confirmed_paths = [];
    RetinaImagePath.prototype.is_external = function() {
        return !!(this.path.match(/^https?\:/i) && !this.path.match("//" + document.domain));
    };
    RetinaImagePath.prototype.check_2x_variant = function(callback) {
        var http, that = this;
        if (this.is_external()) {
            return callback(false);
        } else if (!this.perform_check && typeof this.at_2x_path !== "undefined" && this.at_2x_path !== null) {
            return callback(true);
        } else if (this.at_2x_path in RetinaImagePath.confirmed_paths) {
            return callback(true);
        } else {
            http = new XMLHttpRequest();
            http.open("HEAD", this.at_2x_path);
            http.onreadystatechange = function() {
                if (http.readyState !== 4) {
                    return callback(false);
                }
                if (http.status >= 200 && http.status <= 399) {
                    if (config.check_mime_type) {
                        var type = http.getResponseHeader("Content-Type");
                        if (type === null || !type.match(/^image/i)) {
                            return callback(false);
                        }
                    }
                    RetinaImagePath.confirmed_paths.push(that.at_2x_path);
                    return callback(true);
                } else {
                    return callback(false);
                }
            };
            http.send();
        }
    };
    function RetinaImage(el) {
        this.el = el;
        this.path = new RetinaImagePath(this.el.getAttribute("src"), this.el.getAttribute("data-at2x"));
        var that = this;
        this.path.check_2x_variant(function(hasVariant) {
            if (hasVariant) {
                that.swap();
            }
        });
    }
    root.RetinaImage = RetinaImage;
    RetinaImage.prototype.swap = function(path) {
        if (typeof path === "undefined") {
            path = this.path.at_2x_path;
        }
        var that = this;
        function load() {
            if (!that.el.complete) {
                setTimeout(load, 5);
            } else {
                if (config.force_original_dimensions) {
                    that.el.setAttribute("width", that.el.offsetWidth);
                    that.el.setAttribute("height", that.el.offsetHeight);
                }
                that.el.setAttribute("src", path);
            }
        }
        load();
    };
    if (Retina.isRetina()) {
        Retina.init(root);
    }
})();

if (typeof WeakMap === "undefined") {
    (function() {
        var defineProperty = Object.defineProperty;
        var counter = Date.now() % 1e9;
        var WeakMap = function() {
            this.name = "__st" + (Math.random() * 1e9 >>> 0) + (counter++ + "__");
        };
        WeakMap.prototype = {
            set: function(key, value) {
                var entry = key[this.name];
                if (entry && entry[0] === key) entry[1] = value; else defineProperty(key, this.name, {
                    value: [ key, value ],
                    writable: true
                });
                return this;
            },
            get: function(key) {
                var entry;
                return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
            },
            delete: function(key) {
                var entry = key[this.name];
                if (!entry || entry[0] !== key) return false;
                entry[0] = entry[1] = undefined;
                return true;
            },
            has: function(key) {
                var entry = key[this.name];
                if (!entry) return false;
                return entry[0] === key;
            }
        };
        window.WeakMap = WeakMap;
    })();
}

(function(global) {
    if (global.JsMutationObserver) {
        return;
    }
    var registrationsTable = new WeakMap();
    var setImmediate;
    if (/Trident|Edge/.test(navigator.userAgent)) {
        setImmediate = setTimeout;
    } else if (window.setImmediate) {
        setImmediate = window.setImmediate;
    } else {
        var setImmediateQueue = [];
        var sentinel = String(Math.random());
        window.addEventListener("message", function(e) {
            if (e.data === sentinel) {
                var queue = setImmediateQueue;
                setImmediateQueue = [];
                queue.forEach(function(func) {
                    func();
                });
            }
        });
        setImmediate = function(func) {
            setImmediateQueue.push(func);
            window.postMessage(sentinel, "*");
        };
    }
    var isScheduled = false;
    var scheduledObservers = [];
    function scheduleCallback(observer) {
        scheduledObservers.push(observer);
        if (!isScheduled) {
            isScheduled = true;
            setImmediate(dispatchCallbacks);
        }
    }
    function wrapIfNeeded(node) {
        return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
    }
    function dispatchCallbacks() {
        isScheduled = false;
        var observers = scheduledObservers;
        scheduledObservers = [];
        observers.sort(function(o1, o2) {
            return o1.uid_ - o2.uid_;
        });
        var anyNonEmpty = false;
        observers.forEach(function(observer) {
            var queue = observer.takeRecords();
            removeTransientObserversFor(observer);
            if (queue.length) {
                observer.callback_(queue, observer);
                anyNonEmpty = true;
            }
        });
        if (anyNonEmpty) dispatchCallbacks();
    }
    function removeTransientObserversFor(observer) {
        observer.nodes_.forEach(function(node) {
            var registrations = registrationsTable.get(node);
            if (!registrations) return;
            registrations.forEach(function(registration) {
                if (registration.observer === observer) registration.removeTransientObservers();
            });
        });
    }
    function forEachAncestorAndObserverEnqueueRecord(target, callback) {
        for (var node = target; node; node = node.parentNode) {
            var registrations = registrationsTable.get(node);
            if (registrations) {
                for (var j = 0; j < registrations.length; j++) {
                    var registration = registrations[j];
                    var options = registration.options;
                    if (node !== target && !options.subtree) continue;
                    var record = callback(options);
                    if (record) registration.enqueue(record);
                }
            }
        }
    }
    var uidCounter = 0;
    function JsMutationObserver(callback) {
        this.callback_ = callback;
        this.nodes_ = [];
        this.records_ = [];
        this.uid_ = ++uidCounter;
    }
    JsMutationObserver.prototype = {
        observe: function(target, options) {
            target = wrapIfNeeded(target);
            if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
                throw new SyntaxError();
            }
            var registrations = registrationsTable.get(target);
            if (!registrations) registrationsTable.set(target, registrations = []);
            var registration;
            for (var i = 0; i < registrations.length; i++) {
                if (registrations[i].observer === this) {
                    registration = registrations[i];
                    registration.removeListeners();
                    registration.options = options;
                    break;
                }
            }
            if (!registration) {
                registration = new Registration(this, target, options);
                registrations.push(registration);
                this.nodes_.push(target);
            }
            registration.addListeners();
        },
        disconnect: function() {
            this.nodes_.forEach(function(node) {
                var registrations = registrationsTable.get(node);
                for (var i = 0; i < registrations.length; i++) {
                    var registration = registrations[i];
                    if (registration.observer === this) {
                        registration.removeListeners();
                        registrations.splice(i, 1);
                        break;
                    }
                }
            }, this);
            this.records_ = [];
        },
        takeRecords: function() {
            var copyOfRecords = this.records_;
            this.records_ = [];
            return copyOfRecords;
        }
    };
    function MutationRecord(type, target) {
        this.type = type;
        this.target = target;
        this.addedNodes = [];
        this.removedNodes = [];
        this.previousSibling = null;
        this.nextSibling = null;
        this.attributeName = null;
        this.attributeNamespace = null;
        this.oldValue = null;
    }
    function copyMutationRecord(original) {
        var record = new MutationRecord(original.type, original.target);
        record.addedNodes = original.addedNodes.slice();
        record.removedNodes = original.removedNodes.slice();
        record.previousSibling = original.previousSibling;
        record.nextSibling = original.nextSibling;
        record.attributeName = original.attributeName;
        record.attributeNamespace = original.attributeNamespace;
        record.oldValue = original.oldValue;
        return record;
    }
    var currentRecord, recordWithOldValue;
    function getRecord(type, target) {
        return currentRecord = new MutationRecord(type, target);
    }
    function getRecordWithOldValue(oldValue) {
        if (recordWithOldValue) return recordWithOldValue;
        recordWithOldValue = copyMutationRecord(currentRecord);
        recordWithOldValue.oldValue = oldValue;
        return recordWithOldValue;
    }
    function clearRecords() {
        currentRecord = recordWithOldValue = undefined;
    }
    function recordRepresentsCurrentMutation(record) {
        return record === recordWithOldValue || record === currentRecord;
    }
    function selectRecord(lastRecord, newRecord) {
        if (lastRecord === newRecord) return lastRecord;
        if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord)) return recordWithOldValue;
        return null;
    }
    function Registration(observer, target, options) {
        this.observer = observer;
        this.target = target;
        this.options = options;
        this.transientObservedNodes = [];
    }
    Registration.prototype = {
        enqueue: function(record) {
            var records = this.observer.records_;
            var length = records.length;
            if (records.length > 0) {
                var lastRecord = records[length - 1];
                var recordToReplaceLast = selectRecord(lastRecord, record);
                if (recordToReplaceLast) {
                    records[length - 1] = recordToReplaceLast;
                    return;
                }
            } else {
                scheduleCallback(this.observer);
            }
            records[length] = record;
        },
        addListeners: function() {
            this.addListeners_(this.target);
        },
        addListeners_: function(node) {
            var options = this.options;
            if (options.attributes) node.addEventListener("DOMAttrModified", this, true);
            if (options.characterData) node.addEventListener("DOMCharacterDataModified", this, true);
            if (options.childList) node.addEventListener("DOMNodeInserted", this, true);
            if (options.childList || options.subtree) node.addEventListener("DOMNodeRemoved", this, true);
        },
        removeListeners: function() {
            this.removeListeners_(this.target);
        },
        removeListeners_: function(node) {
            var options = this.options;
            if (options.attributes) node.removeEventListener("DOMAttrModified", this, true);
            if (options.characterData) node.removeEventListener("DOMCharacterDataModified", this, true);
            if (options.childList) node.removeEventListener("DOMNodeInserted", this, true);
            if (options.childList || options.subtree) node.removeEventListener("DOMNodeRemoved", this, true);
        },
        addTransientObserver: function(node) {
            if (node === this.target) return;
            this.addListeners_(node);
            this.transientObservedNodes.push(node);
            var registrations = registrationsTable.get(node);
            if (!registrations) registrationsTable.set(node, registrations = []);
            registrations.push(this);
        },
        removeTransientObservers: function() {
            var transientObservedNodes = this.transientObservedNodes;
            this.transientObservedNodes = [];
            transientObservedNodes.forEach(function(node) {
                this.removeListeners_(node);
                var registrations = registrationsTable.get(node);
                for (var i = 0; i < registrations.length; i++) {
                    if (registrations[i] === this) {
                        registrations.splice(i, 1);
                        break;
                    }
                }
            }, this);
        },
        handleEvent: function(e) {
            e.stopImmediatePropagation();
            switch (e.type) {
              case "DOMAttrModified":
                var name = e.attrName;
                var namespace = e.relatedNode.namespaceURI;
                var target = e.target;
                var record = new getRecord("attributes", target);
                record.attributeName = name;
                record.attributeNamespace = namespace;
                var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
                forEachAncestorAndObserverEnqueueRecord(target, function(options) {
                    if (!options.attributes) return;
                    if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
                        return;
                    }
                    if (options.attributeOldValue) return getRecordWithOldValue(oldValue);
                    return record;
                });
                break;

              case "DOMCharacterDataModified":
                var target = e.target;
                var record = getRecord("characterData", target);
                var oldValue = e.prevValue;
                forEachAncestorAndObserverEnqueueRecord(target, function(options) {
                    if (!options.characterData) return;
                    if (options.characterDataOldValue) return getRecordWithOldValue(oldValue);
                    return record;
                });
                break;

              case "DOMNodeRemoved":
                this.addTransientObserver(e.target);

              case "DOMNodeInserted":
                var changedNode = e.target;
                var addedNodes, removedNodes;
                if (e.type === "DOMNodeInserted") {
                    addedNodes = [ changedNode ];
                    removedNodes = [];
                } else {
                    addedNodes = [];
                    removedNodes = [ changedNode ];
                }
                var previousSibling = changedNode.previousSibling;
                var nextSibling = changedNode.nextSibling;
                var record = getRecord("childList", e.target.parentNode);
                record.addedNodes = addedNodes;
                record.removedNodes = removedNodes;
                record.previousSibling = previousSibling;
                record.nextSibling = nextSibling;
                forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function(options) {
                    if (!options.childList) return;
                    return record;
                });
            }
            clearRecords();
        }
    };
    global.JsMutationObserver = JsMutationObserver;
    if (!global.MutationObserver) {
        global.MutationObserver = JsMutationObserver;
        JsMutationObserver._isPolyfilled = true;
    }
})(self);

(function(scope) {
    "use strict";
    if (!window.performance) {
        var start = Date.now();
        window.performance = {
            now: function() {
                return Date.now() - start;
            }
        };
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function() {
            var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
            return nativeRaf ? function(callback) {
                return nativeRaf(function() {
                    callback(performance.now());
                });
            } : function(callback) {
                return window.setTimeout(callback, 1e3 / 60);
            };
        }();
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function() {
            return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) {
                clearTimeout(id);
            };
        }();
    }
    var workingDefaultPrevented = function() {
        var e = document.createEvent("Event");
        e.initEvent("foo", true, true);
        e.preventDefault();
        return e.defaultPrevented;
    }();
    if (!workingDefaultPrevented) {
        var origPreventDefault = Event.prototype.preventDefault;
        Event.prototype.preventDefault = function() {
            if (!this.cancelable) {
                return;
            }
            origPreventDefault.call(this);
            Object.defineProperty(this, "defaultPrevented", {
                get: function() {
                    return true;
                },
                configurable: true
            });
        };
    }
    var isIE = /Trident/.test(navigator.userAgent);
    if (!window.CustomEvent || isIE && typeof window.CustomEvent !== "function") {
        window.CustomEvent = function(inType, params) {
            params = params || {};
            var e = document.createEvent("CustomEvent");
            e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
            return e;
        };
        window.CustomEvent.prototype = window.Event.prototype;
    }
    if (!window.Event || isIE && typeof window.Event !== "function") {
        var origEvent = window.Event;
        window.Event = function(inType, params) {
            params = params || {};
            var e = document.createEvent("Event");
            e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
            return e;
        };
        window.Event.prototype = origEvent.prototype;
    }
})(window.WebComponents);

window.CustomElements = window.CustomElements || {
    flags: {}
};

(function(scope) {
    var flags = scope.flags;
    var modules = [];
    var addModule = function(module) {
        modules.push(module);
    };
    var initializeModules = function() {
        modules.forEach(function(module) {
            module(scope);
        });
    };
    scope.addModule = addModule;
    scope.initializeModules = initializeModules;
    scope.hasNative = Boolean(document.registerElement);
    scope.isIE = /Trident/.test(navigator.userAgent);
    scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
})(window.CustomElements);

window.CustomElements.addModule(function(scope) {
    var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : "none";
    function forSubtree(node, cb) {
        findAllElements(node, function(e) {
            if (cb(e)) {
                return true;
            }
            forRoots(e, cb);
        });
        forRoots(node, cb);
    }
    function findAllElements(node, find, data) {
        var e = node.firstElementChild;
        if (!e) {
            e = node.firstChild;
            while (e && e.nodeType !== Node.ELEMENT_NODE) {
                e = e.nextSibling;
            }
        }
        while (e) {
            if (find(e, data) !== true) {
                findAllElements(e, find, data);
            }
            e = e.nextElementSibling;
        }
        return null;
    }
    function forRoots(node, cb) {
        var root = node.shadowRoot;
        while (root) {
            forSubtree(root, cb);
            root = root.olderShadowRoot;
        }
    }
    function forDocumentTree(doc, cb) {
        _forDocumentTree(doc, cb, []);
    }
    function _forDocumentTree(doc, cb, processingDocuments) {
        doc = window.wrap(doc);
        if (processingDocuments.indexOf(doc) >= 0) {
            return;
        }
        processingDocuments.push(doc);
        var imports = doc.querySelectorAll("link[rel=" + IMPORT_LINK_TYPE + "]");
        for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
            if (n.import) {
                _forDocumentTree(n.import, cb, processingDocuments);
            }
        }
        cb(doc);
    }
    scope.forDocumentTree = forDocumentTree;
    scope.forSubtree = forSubtree;
});

window.CustomElements.addModule(function(scope) {
    var flags = scope.flags;
    var forSubtree = scope.forSubtree;
    var forDocumentTree = scope.forDocumentTree;
    function addedNode(node, isAttached) {
        return added(node, isAttached) || addedSubtree(node, isAttached);
    }
    function added(node, isAttached) {
        if (scope.upgrade(node, isAttached)) {
            return true;
        }
        if (isAttached) {
            attached(node);
        }
    }
    function addedSubtree(node, isAttached) {
        forSubtree(node, function(e) {
            if (added(e, isAttached)) {
                return true;
            }
        });
    }
    var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags["throttle-attached"];
    scope.hasPolyfillMutations = hasThrottledAttached;
    scope.hasThrottledAttached = hasThrottledAttached;
    var isPendingMutations = false;
    var pendingMutations = [];
    function deferMutation(fn) {
        pendingMutations.push(fn);
        if (!isPendingMutations) {
            isPendingMutations = true;
            setTimeout(takeMutations);
        }
    }
    function takeMutations() {
        isPendingMutations = false;
        var $p = pendingMutations;
        for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
            p();
        }
        pendingMutations = [];
    }
    function attached(element) {
        if (hasThrottledAttached) {
            deferMutation(function() {
                _attached(element);
            });
        } else {
            _attached(element);
        }
    }
    function _attached(element) {
        if (element.__upgraded__ && !element.__attached) {
            element.__attached = true;
            if (element.attachedCallback) {
                element.attachedCallback();
            }
        }
    }
    function detachedNode(node) {
        detached(node);
        forSubtree(node, function(e) {
            detached(e);
        });
    }
    function detached(element) {
        if (hasThrottledAttached) {
            deferMutation(function() {
                _detached(element);
            });
        } else {
            _detached(element);
        }
    }
    function _detached(element) {
        if (element.__upgraded__ && element.__attached) {
            element.__attached = false;
            if (element.detachedCallback) {
                element.detachedCallback();
            }
        }
    }
    function inDocument(element) {
        var p = element;
        var doc = window.wrap(document);
        while (p) {
            if (p == doc) {
                return true;
            }
            p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
        }
    }
    function watchShadow(node) {
        if (node.shadowRoot && !node.shadowRoot.__watched) {
            flags.dom && console.log("watching shadow-root for: ", node.localName);
            var root = node.shadowRoot;
            while (root) {
                observe(root);
                root = root.olderShadowRoot;
            }
        }
    }
    function handler(root, mutations) {
        if (flags.dom) {
            var mx = mutations[0];
            if (mx && mx.type === "childList" && mx.addedNodes) {
                if (mx.addedNodes) {
                    var d = mx.addedNodes[0];
                    while (d && d !== document && !d.host) {
                        d = d.parentNode;
                    }
                    var u = d && (d.URL || d._URL || d.host && d.host.localName) || "";
                    u = u.split("/?").shift().split("/").pop();
                }
            }
            console.group("mutations (%d) [%s]", mutations.length, u || "");
        }
        var isAttached = inDocument(root);
        mutations.forEach(function(mx) {
            if (mx.type === "childList") {
                forEach(mx.addedNodes, function(n) {
                    if (!n.localName) {
                        return;
                    }
                    addedNode(n, isAttached);
                });
                forEach(mx.removedNodes, function(n) {
                    if (!n.localName) {
                        return;
                    }
                    detachedNode(n);
                });
            }
        });
        flags.dom && console.groupEnd();
    }
    function takeRecords(node) {
        node = window.wrap(node);
        if (!node) {
            node = window.wrap(document);
        }
        while (node.parentNode) {
            node = node.parentNode;
        }
        var observer = node.__observer;
        if (observer) {
            handler(node, observer.takeRecords());
            takeMutations();
        }
    }
    var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
    function observe(inRoot) {
        if (inRoot.__observer) {
            return;
        }
        var observer = new MutationObserver(handler.bind(this, inRoot));
        observer.observe(inRoot, {
            childList: true,
            subtree: true
        });
        inRoot.__observer = observer;
    }
    function upgradeDocument(doc) {
        doc = window.wrap(doc);
        flags.dom && console.group("upgradeDocument: ", doc.baseURI.split("/").pop());
        var isMainDocument = doc === window.wrap(document);
        addedNode(doc, isMainDocument);
        observe(doc);
        flags.dom && console.groupEnd();
    }
    function upgradeDocumentTree(doc) {
        forDocumentTree(doc, upgradeDocument);
    }
    var originalCreateShadowRoot = Element.prototype.createShadowRoot;
    if (originalCreateShadowRoot) {
        Element.prototype.createShadowRoot = function() {
            var root = originalCreateShadowRoot.call(this);
            window.CustomElements.watchShadow(this);
            return root;
        };
    }
    scope.watchShadow = watchShadow;
    scope.upgradeDocumentTree = upgradeDocumentTree;
    scope.upgradeDocument = upgradeDocument;
    scope.upgradeSubtree = addedSubtree;
    scope.upgradeAll = addedNode;
    scope.attached = attached;
    scope.takeRecords = takeRecords;
});

window.CustomElements.addModule(function(scope) {
    var flags = scope.flags;
    function upgrade(node, isAttached) {
        if (node.localName === "template") {
            if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
                HTMLTemplateElement.decorate(node);
            }
        }
        if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
            var is = node.getAttribute("is");
            var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
            if (definition) {
                if (is && definition.tag == node.localName || !is && !definition.extends) {
                    return upgradeWithDefinition(node, definition, isAttached);
                }
            }
        }
    }
    function upgradeWithDefinition(element, definition, isAttached) {
        flags.upgrade && console.group("upgrade:", element.localName);
        if (definition.is) {
            element.setAttribute("is", definition.is);
        }
        implementPrototype(element, definition);
        element.__upgraded__ = true;
        created(element);
        if (isAttached) {
            scope.attached(element);
        }
        scope.upgradeSubtree(element, isAttached);
        flags.upgrade && console.groupEnd();
        return element;
    }
    function implementPrototype(element, definition) {
        if (Object.__proto__) {
            element.__proto__ = definition.prototype;
        } else {
            customMixin(element, definition.prototype, definition.native);
            element.__proto__ = definition.prototype;
        }
    }
    function customMixin(inTarget, inSrc, inNative) {
        var used = {};
        var p = inSrc;
        while (p !== inNative && p !== HTMLElement.prototype) {
            var keys = Object.getOwnPropertyNames(p);
            for (var i = 0, k; k = keys[i]; i++) {
                if (!used[k]) {
                    Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
                    used[k] = 1;
                }
            }
            p = Object.getPrototypeOf(p);
        }
    }
    function created(element) {
        if (element.createdCallback) {
            element.createdCallback();
        }
    }
    scope.upgrade = upgrade;
    scope.upgradeWithDefinition = upgradeWithDefinition;
    scope.implementPrototype = implementPrototype;
});

window.CustomElements.addModule(function(scope) {
    var isIE = scope.isIE;
    var upgradeDocumentTree = scope.upgradeDocumentTree;
    var upgradeAll = scope.upgradeAll;
    var upgradeWithDefinition = scope.upgradeWithDefinition;
    var implementPrototype = scope.implementPrototype;
    var useNative = scope.useNative;
    function register(name, options) {
        var definition = options || {};
        if (!name) {
            throw new Error("document.registerElement: first argument `name` must not be empty");
        }
        if (name.indexOf("-") < 0) {
            throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '" + String(name) + "'.");
        }
        if (isReservedTag(name)) {
            throw new Error("Failed to execute 'registerElement' on 'Document': Registration failed for type '" + String(name) + "'. The type name is invalid.");
        }
        if (getRegisteredDefinition(name)) {
            throw new Error("DuplicateDefinitionError: a type with name '" + String(name) + "' is already registered");
        }
        if (!definition.prototype) {
            definition.prototype = Object.create(HTMLElement.prototype);
        }
        definition.__name = name.toLowerCase();
        if (definition.extends) {
            definition.extends = definition.extends.toLowerCase();
        }
        definition.lifecycle = definition.lifecycle || {};
        definition.ancestry = ancestry(definition.extends);
        resolveTagName(definition);
        resolvePrototypeChain(definition);
        overrideAttributeApi(definition.prototype);
        registerDefinition(definition.__name, definition);
        definition.ctor = generateConstructor(definition);
        definition.ctor.prototype = definition.prototype;
        definition.prototype.constructor = definition.ctor;
        if (scope.ready) {
            upgradeDocumentTree(document);
        }
        return definition.ctor;
    }
    function overrideAttributeApi(prototype) {
        if (prototype.setAttribute._polyfilled) {
            return;
        }
        var setAttribute = prototype.setAttribute;
        prototype.setAttribute = function(name, value) {
            changeAttribute.call(this, name, value, setAttribute);
        };
        var removeAttribute = prototype.removeAttribute;
        prototype.removeAttribute = function(name) {
            changeAttribute.call(this, name, null, removeAttribute);
        };
        prototype.setAttribute._polyfilled = true;
    }
    function changeAttribute(name, value, operation) {
        name = name.toLowerCase();
        var oldValue = this.getAttribute(name);
        operation.apply(this, arguments);
        var newValue = this.getAttribute(name);
        if (this.attributeChangedCallback && newValue !== oldValue) {
            this.attributeChangedCallback(name, oldValue, newValue);
        }
    }
    function isReservedTag(name) {
        for (var i = 0; i < reservedTagList.length; i++) {
            if (name === reservedTagList[i]) {
                return true;
            }
        }
    }
    var reservedTagList = [ "annotation-xml", "color-profile", "font-face", "font-face-src", "font-face-uri", "font-face-format", "font-face-name", "missing-glyph" ];
    function ancestry(extnds) {
        var extendee = getRegisteredDefinition(extnds);
        if (extendee) {
            return ancestry(extendee.extends).concat([ extendee ]);
        }
        return [];
    }
    function resolveTagName(definition) {
        var baseTag = definition.extends;
        for (var i = 0, a; a = definition.ancestry[i]; i++) {
            baseTag = a.is && a.tag;
        }
        definition.tag = baseTag || definition.__name;
        if (baseTag) {
            definition.is = definition.__name;
        }
    }
    function resolvePrototypeChain(definition) {
        if (!Object.__proto__) {
            var nativePrototype = HTMLElement.prototype;
            if (definition.is) {
                var inst = document.createElement(definition.tag);
                nativePrototype = Object.getPrototypeOf(inst);
            }
            var proto = definition.prototype, ancestor;
            var foundPrototype = false;
            while (proto) {
                if (proto == nativePrototype) {
                    foundPrototype = true;
                }
                ancestor = Object.getPrototypeOf(proto);
                if (ancestor) {
                    proto.__proto__ = ancestor;
                }
                proto = ancestor;
            }
            if (!foundPrototype) {
                console.warn(definition.tag + " prototype not found in prototype chain for " + definition.is);
            }
            definition.native = nativePrototype;
        }
    }
    function instantiate(definition) {
        return upgradeWithDefinition(domCreateElement(definition.tag), definition);
    }
    var registry = {};
    function getRegisteredDefinition(name) {
        if (name) {
            return registry[name.toLowerCase()];
        }
    }
    function registerDefinition(name, definition) {
        registry[name] = definition;
    }
    function generateConstructor(definition) {
        return function() {
            return instantiate(definition);
        };
    }
    var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
    function createElementNS(namespace, tag, typeExtension) {
        if (namespace === HTML_NAMESPACE) {
            return createElement(tag, typeExtension);
        } else {
            return domCreateElementNS(namespace, tag);
        }
    }
    function createElement(tag, typeExtension) {
        if (tag) {
            tag = tag.toLowerCase();
        }
        if (typeExtension) {
            typeExtension = typeExtension.toLowerCase();
        }
        var definition = getRegisteredDefinition(typeExtension || tag);
        if (definition) {
            if (tag == definition.tag && typeExtension == definition.is) {
                return new definition.ctor();
            }
            if (!typeExtension && !definition.is) {
                return new definition.ctor();
            }
        }
        var element;
        if (typeExtension) {
            element = createElement(tag);
            element.setAttribute("is", typeExtension);
            return element;
        }
        element = domCreateElement(tag);
        if (tag.indexOf("-") >= 0) {
            implementPrototype(element, HTMLElement);
        }
        return element;
    }
    var domCreateElement = document.createElement.bind(document);
    var domCreateElementNS = document.createElementNS.bind(document);
    var isInstance;
    if (!Object.__proto__ && !useNative) {
        isInstance = function(obj, ctor) {
            if (obj instanceof ctor) {
                return true;
            }
            var p = obj;
            while (p) {
                if (p === ctor.prototype) {
                    return true;
                }
                p = p.__proto__;
            }
            return false;
        };
    } else {
        isInstance = function(obj, base) {
            return obj instanceof base;
        };
    }
    function wrapDomMethodToForceUpgrade(obj, methodName) {
        var orig = obj[methodName];
        obj[methodName] = function() {
            var n = orig.apply(this, arguments);
            upgradeAll(n);
            return n;
        };
    }
    wrapDomMethodToForceUpgrade(Node.prototype, "cloneNode");
    wrapDomMethodToForceUpgrade(document, "importNode");
    document.registerElement = register;
    document.createElement = createElement;
    document.createElementNS = createElementNS;
    scope.registry = registry;
    scope.instanceof = isInstance;
    scope.reservedTagList = reservedTagList;
    scope.getRegisteredDefinition = getRegisteredDefinition;
    document.register = document.registerElement;
});

(function(scope) {
    var useNative = scope.useNative;
    var initializeModules = scope.initializeModules;
    var isIE = scope.isIE;
    if (useNative) {
        var nop = function() {};
        scope.watchShadow = nop;
        scope.upgrade = nop;
        scope.upgradeAll = nop;
        scope.upgradeDocumentTree = nop;
        scope.upgradeSubtree = nop;
        scope.takeRecords = nop;
        scope.instanceof = function(obj, base) {
            return obj instanceof base;
        };
    } else {
        initializeModules();
    }
    var upgradeDocumentTree = scope.upgradeDocumentTree;
    var upgradeDocument = scope.upgradeDocument;
    if (!window.wrap) {
        if (window.ShadowDOMPolyfill) {
            window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
            window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
        } else {
            window.wrap = window.unwrap = function(node) {
                return node;
            };
        }
    }
    if (window.HTMLImports) {
        window.HTMLImports.__importsParsingHook = function(elt) {
            if (elt.import) {
                upgradeDocument(wrap(elt.import));
            }
        };
    }
    function bootstrap() {
        upgradeDocumentTree(window.wrap(document));
        window.CustomElements.ready = true;
        var requestAnimationFrame = window.requestAnimationFrame || function(f) {
            setTimeout(f, 16);
        };
        requestAnimationFrame(function() {
            setTimeout(function() {
                window.CustomElements.readyTime = Date.now();
                if (window.HTMLImports) {
                    window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
                }
                document.dispatchEvent(new CustomEvent("WebComponentsReady", {
                    bubbles: true
                }));
            });
        });
    }
    if (document.readyState === "complete" || scope.flags.eager) {
        bootstrap();
    } else if (document.readyState === "interactive" && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
        bootstrap();
    } else {
        var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? "HTMLImportsLoaded" : "DOMContentLoaded";
        window.addEventListener(loadEvent, bootstrap);
    }
})(window.CustomElements);

if (typeof jQuery === "undefined") {
    throw new Error("Bootstrap's JavaScript requires jQuery");
}

+function($) {
    var version = $.fn.jquery.split(" ")[0].split(".");
    if (version[0] < 2 && version[1] < 9 || version[0] == 1 && version[1] == 9 && version[2] < 1 || version[0] >= 4) {
        throw new Error("Bootstrap's JavaScript requires at least jQuery v1.9.1 but less than v4.0.0");
    }
}(jQuery);

+function($) {
    "use strict";
    var _get = function get(_x, _x2, _x3) {
        var _again = true;
        _function: while (_again) {
            var object = _x, property = _x2, receiver = _x3;
            _again = false;
            if (object === null) object = Function.prototype;
            var desc = Object.getOwnPropertyDescriptor(object, property);
            if (desc === undefined) {
                var parent = Object.getPrototypeOf(object);
                if (parent === null) {
                    return undefined;
                } else {
                    _x = parent;
                    _x2 = property;
                    _x3 = receiver;
                    _again = true;
                    desc = parent = undefined;
                    continue _function;
                }
            } else if ("value" in desc) {
                return desc.value;
            } else {
                var getter = desc.get;
                if (getter === undefined) {
                    return undefined;
                }
                return getter.call(receiver);
            }
        }
    };
    var _createClass = function() {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }
        return function(Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();
    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }
    var Util = function($) {
        var transition = false;
        var MAX_UID = 1e6;
        var TransitionEndEvent = {
            WebkitTransition: "webkitTransitionEnd",
            MozTransition: "transitionend",
            OTransition: "oTransitionEnd otransitionend",
            transition: "transitionend"
        };
        function toType(obj) {
            return {}.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        }
        function isElement(obj) {
            return (obj[0] || obj).nodeType;
        }
        function getSpecialTransitionEndEvent() {
            return {
                bindType: transition.end,
                delegateType: transition.end,
                handle: function handle(event) {
                    if ($(event.target).is(this)) {
                        return event.handleObj.handler.apply(this, arguments);
                    }
                    return undefined;
                }
            };
        }
        function transitionEndTest() {
            if (window.QUnit) {
                return false;
            }
            var el = document.createElement("bootstrap");
            for (var _name in TransitionEndEvent) {
                if (el.style[_name] !== undefined) {
                    return {
                        end: TransitionEndEvent[_name]
                    };
                }
            }
            return false;
        }
        function transitionEndEmulator(duration) {
            var _this = this;
            var called = false;
            $(this).one(Util.TRANSITION_END, function() {
                called = true;
            });
            setTimeout(function() {
                if (!called) {
                    Util.triggerTransitionEnd(_this);
                }
            }, duration);
            return this;
        }
        function setTransitionEndSupport() {
            transition = transitionEndTest();
            $.fn.emulateTransitionEnd = transitionEndEmulator;
            if (Util.supportsTransitionEnd()) {
                $.event.special[Util.TRANSITION_END] = getSpecialTransitionEndEvent();
            }
        }
        var Util = {
            TRANSITION_END: "bsTransitionEnd",
            getUID: function getUID(prefix) {
                do {
                    prefix += ~~(Math.random() * MAX_UID);
                } while (document.getElementById(prefix));
                return prefix;
            },
            getSelectorFromElement: function getSelectorFromElement(element) {
                var selector = element.getAttribute("data-target");
                if (!selector) {
                    selector = element.getAttribute("href") || "";
                    selector = /^#[a-z]/i.test(selector) ? selector : null;
                }
                return selector;
            },
            reflow: function reflow(element) {
                new Function("bs", "return bs")(element.offsetHeight);
            },
            triggerTransitionEnd: function triggerTransitionEnd(element) {
                $(element).trigger(transition.end);
            },
            supportsTransitionEnd: function supportsTransitionEnd() {
                return Boolean(transition);
            },
            typeCheckConfig: function typeCheckConfig(componentName, config, configTypes) {
                for (var property in configTypes) {
                    if (configTypes.hasOwnProperty(property)) {
                        var expectedTypes = configTypes[property];
                        var value = config[property];
                        var valueType = undefined;
                        if (value && isElement(value)) {
                            valueType = "element";
                        } else {
                            valueType = toType(value);
                        }
                        if (!new RegExp(expectedTypes).test(valueType)) {
                            throw new Error(componentName.toUpperCase() + ": " + ('Option "' + property + '" provided type "' + valueType + '" ') + ('but expected type "' + expectedTypes + '".'));
                        }
                    }
                }
            }
        };
        setTransitionEndSupport();
        return Util;
    }(jQuery);
    var Alert = function($) {
        var NAME = "alert";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.alert";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var TRANSITION_DURATION = 150;
        var Selector = {
            DISMISS: '[data-dismiss="alert"]'
        };
        var Event = {
            CLOSE: "close" + EVENT_KEY,
            CLOSED: "closed" + EVENT_KEY,
            CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY
        };
        var ClassName = {
            ALERT: "alert",
            FADE: "fade",
            IN: "in"
        };
        var Alert = function() {
            function Alert(element) {
                _classCallCheck(this, Alert);
                this._element = element;
            }
            _createClass(Alert, [ {
                key: "close",
                value: function close(element) {
                    element = element || this._element;
                    var rootElement = this._getRootElement(element);
                    var customEvent = this._triggerCloseEvent(rootElement);
                    if (customEvent.isDefaultPrevented()) {
                        return;
                    }
                    this._removeElement(rootElement);
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $.removeData(this._element, DATA_KEY);
                    this._element = null;
                }
            }, {
                key: "_getRootElement",
                value: function _getRootElement(element) {
                    var selector = Util.getSelectorFromElement(element);
                    var parent = false;
                    if (selector) {
                        parent = $(selector)[0];
                    }
                    if (!parent) {
                        parent = $(element).closest("." + ClassName.ALERT)[0];
                    }
                    return parent;
                }
            }, {
                key: "_triggerCloseEvent",
                value: function _triggerCloseEvent(element) {
                    var closeEvent = $.Event(Event.CLOSE);
                    $(element).trigger(closeEvent);
                    return closeEvent;
                }
            }, {
                key: "_removeElement",
                value: function _removeElement(element) {
                    $(element).removeClass(ClassName.IN);
                    if (!Util.supportsTransitionEnd() || !$(element).hasClass(ClassName.FADE)) {
                        this._destroyElement(element);
                        return;
                    }
                    $(element).one(Util.TRANSITION_END, $.proxy(this._destroyElement, this, element)).emulateTransitionEnd(TRANSITION_DURATION);
                }
            }, {
                key: "_destroyElement",
                value: function _destroyElement(element) {
                    $(element).detach().trigger(Event.CLOSED).remove();
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var $element = $(this);
                        var data = $element.data(DATA_KEY);
                        if (!data) {
                            data = new Alert(this);
                            $element.data(DATA_KEY, data);
                        }
                        if (config === "close") {
                            data[config](this);
                        }
                    });
                }
            }, {
                key: "_handleDismiss",
                value: function _handleDismiss(alertInstance) {
                    return function(event) {
                        if (event) {
                            event.preventDefault();
                        }
                        alertInstance.close(this);
                    };
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            } ]);
            return Alert;
        }();
        $(document).on(Event.CLICK_DATA_API, Selector.DISMISS, Alert._handleDismiss(new Alert()));
        $.fn[NAME] = Alert._jQueryInterface;
        $.fn[NAME].Constructor = Alert;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Alert._jQueryInterface;
        };
        return Alert;
    }(jQuery);
    var Button = function($) {
        var NAME = "button";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.button";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var ClassName = {
            ACTIVE: "active",
            BUTTON: "btn",
            FOCUS: "focus"
        };
        var Selector = {
            DATA_TOGGLE_CARROT: '[data-toggle^="button"]',
            DATA_TOGGLE: '[data-toggle="buttons"]',
            INPUT: "input",
            ACTIVE: ".active",
            BUTTON: ".btn"
        };
        var Event = {
            CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
            FOCUS_BLUR_DATA_API: "focus" + EVENT_KEY + DATA_API_KEY + " " + ("blur" + EVENT_KEY + DATA_API_KEY)
        };
        var Button = function() {
            function Button(element) {
                _classCallCheck(this, Button);
                this._element = element;
            }
            _createClass(Button, [ {
                key: "toggle",
                value: function toggle() {
                    var triggerChangeEvent = true;
                    var rootElement = $(this._element).closest(Selector.DATA_TOGGLE)[0];
                    if (rootElement) {
                        var input = $(this._element).find(Selector.INPUT)[0];
                        if (input) {
                            if (input.type === "radio") {
                                if (input.checked && $(this._element).hasClass(ClassName.ACTIVE)) {
                                    triggerChangeEvent = false;
                                } else {
                                    var activeElement = $(rootElement).find(Selector.ACTIVE)[0];
                                    if (activeElement) {
                                        $(activeElement).removeClass(ClassName.ACTIVE);
                                    }
                                }
                            }
                            if (triggerChangeEvent) {
                                input.checked = !$(this._element).hasClass(ClassName.ACTIVE);
                                $(this._element).trigger("change");
                            }
                            input.focus();
                        }
                    } else {
                        this._element.setAttribute("aria-pressed", !$(this._element).hasClass(ClassName.ACTIVE));
                    }
                    if (triggerChangeEvent) {
                        $(this._element).toggleClass(ClassName.ACTIVE);
                    }
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $.removeData(this._element, DATA_KEY);
                    this._element = null;
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var data = $(this).data(DATA_KEY);
                        if (!data) {
                            data = new Button(this);
                            $(this).data(DATA_KEY, data);
                        }
                        if (config === "toggle") {
                            data[config]();
                        }
                    });
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            } ]);
            return Button;
        }();
        $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE_CARROT, function(event) {
            event.preventDefault();
            var button = event.target;
            if (!$(button).hasClass(ClassName.BUTTON)) {
                button = $(button).closest(Selector.BUTTON);
            }
            Button._jQueryInterface.call($(button), "toggle");
        }).on(Event.FOCUS_BLUR_DATA_API, Selector.DATA_TOGGLE_CARROT, function(event) {
            var button = $(event.target).closest(Selector.BUTTON)[0];
            $(button).toggleClass(ClassName.FOCUS, /^focus(in)?$/.test(event.type));
        });
        $.fn[NAME] = Button._jQueryInterface;
        $.fn[NAME].Constructor = Button;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Button._jQueryInterface;
        };
        return Button;
    }(jQuery);
    var Carousel = function($) {
        var NAME = "carousel";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.carousel";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var TRANSITION_DURATION = 600;
        var ARROW_LEFT_KEYCODE = 37;
        var ARROW_RIGHT_KEYCODE = 39;
        var Default = {
            interval: 5e3,
            keyboard: true,
            slide: false,
            pause: "hover",
            wrap: true
        };
        var DefaultType = {
            interval: "(number|boolean)",
            keyboard: "boolean",
            slide: "(boolean|string)",
            pause: "(string|boolean)",
            wrap: "boolean"
        };
        var Direction = {
            NEXT: "next",
            PREVIOUS: "prev"
        };
        var Event = {
            SLIDE: "slide" + EVENT_KEY,
            SLID: "slid" + EVENT_KEY,
            KEYDOWN: "keydown" + EVENT_KEY,
            MOUSEENTER: "mouseenter" + EVENT_KEY,
            MOUSELEAVE: "mouseleave" + EVENT_KEY,
            LOAD_DATA_API: "load" + EVENT_KEY + DATA_API_KEY,
            CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY
        };
        var ClassName = {
            CAROUSEL: "carousel",
            ACTIVE: "active",
            SLIDE: "slide",
            RIGHT: "right",
            LEFT: "left",
            ITEM: "carousel-item"
        };
        var Selector = {
            ACTIVE: ".active",
            ACTIVE_ITEM: ".active.carousel-item",
            ITEM: ".carousel-item",
            NEXT_PREV: ".next, .prev",
            INDICATORS: ".carousel-indicators",
            DATA_SLIDE: "[data-slide], [data-slide-to]",
            DATA_RIDE: '[data-ride="carousel"]'
        };
        var Carousel = function() {
            function Carousel(element, config) {
                _classCallCheck(this, Carousel);
                this._items = null;
                this._interval = null;
                this._activeElement = null;
                this._isPaused = false;
                this._isSliding = false;
                this._config = this._getConfig(config);
                this._element = $(element)[0];
                this._indicatorsElement = $(this._element).find(Selector.INDICATORS)[0];
                this._addEventListeners();
            }
            _createClass(Carousel, [ {
                key: "next",
                value: function next() {
                    if (!this._isSliding) {
                        this._slide(Direction.NEXT);
                    }
                }
            }, {
                key: "nextWhenVisible",
                value: function nextWhenVisible() {
                    if (!document.hidden) {
                        this.next();
                    }
                }
            }, {
                key: "prev",
                value: function prev() {
                    if (!this._isSliding) {
                        this._slide(Direction.PREVIOUS);
                    }
                }
            }, {
                key: "pause",
                value: function pause(event) {
                    if (!event) {
                        this._isPaused = true;
                    }
                    if ($(this._element).find(Selector.NEXT_PREV)[0] && Util.supportsTransitionEnd()) {
                        Util.triggerTransitionEnd(this._element);
                        this.cycle(true);
                    }
                    clearInterval(this._interval);
                    this._interval = null;
                }
            }, {
                key: "cycle",
                value: function cycle(event) {
                    if (!event) {
                        this._isPaused = false;
                    }
                    if (this._interval) {
                        clearInterval(this._interval);
                        this._interval = null;
                    }
                    if (this._config.interval && !this._isPaused) {
                        this._interval = setInterval($.proxy(document.visibilityState ? this.nextWhenVisible : this.next, this), this._config.interval);
                    }
                }
            }, {
                key: "to",
                value: function to(index) {
                    var _this2 = this;
                    this._activeElement = $(this._element).find(Selector.ACTIVE_ITEM)[0];
                    var activeIndex = this._getItemIndex(this._activeElement);
                    if (index > this._items.length - 1 || index < 0) {
                        return;
                    }
                    if (this._isSliding) {
                        $(this._element).one(Event.SLID, function() {
                            return _this2.to(index);
                        });
                        return;
                    }
                    if (activeIndex === index) {
                        this.pause();
                        this.cycle();
                        return;
                    }
                    var direction = index > activeIndex ? Direction.NEXT : Direction.PREVIOUS;
                    this._slide(direction, this._items[index]);
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $(this._element).off(EVENT_KEY);
                    $.removeData(this._element, DATA_KEY);
                    this._items = null;
                    this._config = null;
                    this._element = null;
                    this._interval = null;
                    this._isPaused = null;
                    this._isSliding = null;
                    this._activeElement = null;
                    this._indicatorsElement = null;
                }
            }, {
                key: "_getConfig",
                value: function _getConfig(config) {
                    config = $.extend({}, Default, config);
                    Util.typeCheckConfig(NAME, config, DefaultType);
                    return config;
                }
            }, {
                key: "_addEventListeners",
                value: function _addEventListeners() {
                    if (this._config.keyboard) {
                        $(this._element).on(Event.KEYDOWN, $.proxy(this._keydown, this));
                    }
                    if (this._config.pause === "hover" && !("ontouchstart" in document.documentElement)) {
                        $(this._element).on(Event.MOUSEENTER, $.proxy(this.pause, this)).on(Event.MOUSELEAVE, $.proxy(this.cycle, this));
                    }
                }
            }, {
                key: "_keydown",
                value: function _keydown(event) {
                    event.preventDefault();
                    if (/input|textarea/i.test(event.target.tagName)) {
                        return;
                    }
                    switch (event.which) {
                      case ARROW_LEFT_KEYCODE:
                        this.prev();
                        break;

                      case ARROW_RIGHT_KEYCODE:
                        this.next();
                        break;

                      default:
                        return;
                    }
                }
            }, {
                key: "_getItemIndex",
                value: function _getItemIndex(element) {
                    this._items = $.makeArray($(element).parent().find(Selector.ITEM));
                    return this._items.indexOf(element);
                }
            }, {
                key: "_getItemByDirection",
                value: function _getItemByDirection(direction, activeElement) {
                    var isNextDirection = direction === Direction.NEXT;
                    var isPrevDirection = direction === Direction.PREVIOUS;
                    var activeIndex = this._getItemIndex(activeElement);
                    var lastItemIndex = this._items.length - 1;
                    var isGoingToWrap = isPrevDirection && activeIndex === 0 || isNextDirection && activeIndex === lastItemIndex;
                    if (isGoingToWrap && !this._config.wrap) {
                        return activeElement;
                    }
                    var delta = direction === Direction.PREVIOUS ? -1 : 1;
                    var itemIndex = (activeIndex + delta) % this._items.length;
                    return itemIndex === -1 ? this._items[this._items.length - 1] : this._items[itemIndex];
                }
            }, {
                key: "_triggerSlideEvent",
                value: function _triggerSlideEvent(relatedTarget, directionalClassname) {
                    var slideEvent = $.Event(Event.SLIDE, {
                        relatedTarget: relatedTarget,
                        direction: directionalClassname
                    });
                    $(this._element).trigger(slideEvent);
                    return slideEvent;
                }
            }, {
                key: "_setActiveIndicatorElement",
                value: function _setActiveIndicatorElement(element) {
                    if (this._indicatorsElement) {
                        $(this._indicatorsElement).find(Selector.ACTIVE).removeClass(ClassName.ACTIVE);
                        var nextIndicator = this._indicatorsElement.children[this._getItemIndex(element)];
                        if (nextIndicator) {
                            $(nextIndicator).addClass(ClassName.ACTIVE);
                        }
                    }
                }
            }, {
                key: "_slide",
                value: function _slide(direction, element) {
                    var _this3 = this;
                    var activeElement = $(this._element).find(Selector.ACTIVE_ITEM)[0];
                    var nextElement = element || activeElement && this._getItemByDirection(direction, activeElement);
                    var isCycling = Boolean(this._interval);
                    var directionalClassName = direction === Direction.NEXT ? ClassName.LEFT : ClassName.RIGHT;
                    if (nextElement && $(nextElement).hasClass(ClassName.ACTIVE)) {
                        this._isSliding = false;
                        return;
                    }
                    var slideEvent = this._triggerSlideEvent(nextElement, directionalClassName);
                    if (slideEvent.isDefaultPrevented()) {
                        return;
                    }
                    if (!activeElement || !nextElement) {
                        return;
                    }
                    this._isSliding = true;
                    if (isCycling) {
                        this.pause();
                    }
                    this._setActiveIndicatorElement(nextElement);
                    var slidEvent = $.Event(Event.SLID, {
                        relatedTarget: nextElement,
                        direction: directionalClassName
                    });
                    if (Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.SLIDE)) {
                        $(nextElement).addClass(direction);
                        Util.reflow(nextElement);
                        $(activeElement).addClass(directionalClassName);
                        $(nextElement).addClass(directionalClassName);
                        $(activeElement).one(Util.TRANSITION_END, function() {
                            $(nextElement).removeClass(directionalClassName).removeClass(direction);
                            $(nextElement).addClass(ClassName.ACTIVE);
                            $(activeElement).removeClass(ClassName.ACTIVE).removeClass(direction).removeClass(directionalClassName);
                            _this3._isSliding = false;
                            setTimeout(function() {
                                return $(_this3._element).trigger(slidEvent);
                            }, 0);
                        }).emulateTransitionEnd(TRANSITION_DURATION);
                    } else {
                        $(activeElement).removeClass(ClassName.ACTIVE);
                        $(nextElement).addClass(ClassName.ACTIVE);
                        this._isSliding = false;
                        $(this._element).trigger(slidEvent);
                    }
                    if (isCycling) {
                        this.cycle();
                    }
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var data = $(this).data(DATA_KEY);
                        var _config = $.extend({}, Default, $(this).data());
                        if (typeof config === "object") {
                            $.extend(_config, config);
                        }
                        var action = typeof config === "string" ? config : _config.slide;
                        if (!data) {
                            data = new Carousel(this, _config);
                            $(this).data(DATA_KEY, data);
                        }
                        if (typeof config === "number") {
                            data.to(config);
                        } else if (typeof action === "string") {
                            if (data[action] === undefined) {
                                throw new Error('No method named "' + action + '"');
                            }
                            data[action]();
                        } else if (_config.interval) {
                            data.pause();
                            data.cycle();
                        }
                    });
                }
            }, {
                key: "_dataApiClickHandler",
                value: function _dataApiClickHandler(event) {
                    var selector = Util.getSelectorFromElement(this);
                    if (!selector) {
                        return;
                    }
                    var target = $(selector)[0];
                    if (!target || !$(target).hasClass(ClassName.CAROUSEL)) {
                        return;
                    }
                    var config = $.extend({}, $(target).data(), $(this).data());
                    var slideIndex = this.getAttribute("data-slide-to");
                    if (slideIndex) {
                        config.interval = false;
                    }
                    Carousel._jQueryInterface.call($(target), config);
                    if (slideIndex) {
                        $(target).data(DATA_KEY).to(slideIndex);
                    }
                    event.preventDefault();
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            }, {
                key: "Default",
                get: function get() {
                    return Default;
                }
            } ]);
            return Carousel;
        }();
        $(document).on(Event.CLICK_DATA_API, Selector.DATA_SLIDE, Carousel._dataApiClickHandler);
        $(window).on(Event.LOAD_DATA_API, function() {
            $(Selector.DATA_RIDE).each(function() {
                var $carousel = $(this);
                Carousel._jQueryInterface.call($carousel, $carousel.data());
            });
        });
        $.fn[NAME] = Carousel._jQueryInterface;
        $.fn[NAME].Constructor = Carousel;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Carousel._jQueryInterface;
        };
        return Carousel;
    }(jQuery);
    var Collapse = function($) {
        var NAME = "collapse";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.collapse";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var TRANSITION_DURATION = 600;
        var Default = {
            toggle: true,
            parent: ""
        };
        var DefaultType = {
            toggle: "boolean",
            parent: "string"
        };
        var Event = {
            SHOW: "show" + EVENT_KEY,
            SHOWN: "shown" + EVENT_KEY,
            HIDE: "hide" + EVENT_KEY,
            HIDDEN: "hidden" + EVENT_KEY,
            CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY
        };
        var ClassName = {
            IN: "in",
            COLLAPSE: "collapse",
            COLLAPSING: "collapsing",
            COLLAPSED: "collapsed"
        };
        var Dimension = {
            WIDTH: "width",
            HEIGHT: "height"
        };
        var Selector = {
            ACTIVES: ".panel > .in, .panel > .collapsing",
            DATA_TOGGLE: '[data-toggle="collapse"]'
        };
        var Collapse = function() {
            function Collapse(element, config) {
                _classCallCheck(this, Collapse);
                this._isTransitioning = false;
                this._element = element;
                this._config = this._getConfig(config);
                this._triggerArray = $.makeArray($('[data-toggle="collapse"][href="#' + element.id + '"],' + ('[data-toggle="collapse"][data-target="#' + element.id + '"]')));
                this._parent = this._config.parent ? this._getParent() : null;
                if (!this._config.parent) {
                    this._addAriaAndCollapsedClass(this._element, this._triggerArray);
                }
                if (this._config.toggle) {
                    this.toggle();
                }
            }
            _createClass(Collapse, [ {
                key: "toggle",
                value: function toggle() {
                    if ($(this._element).hasClass(ClassName.IN)) {
                        this.hide();
                    } else {
                        this.show();
                    }
                }
            }, {
                key: "show",
                value: function show() {
                    var _this4 = this;
                    if (this._isTransitioning || $(this._element).hasClass(ClassName.IN)) {
                        return;
                    }
                    var actives = undefined;
                    var activesData = undefined;
                    if (this._parent) {
                        actives = $.makeArray($(Selector.ACTIVES));
                        if (!actives.length) {
                            actives = null;
                        }
                    }
                    if (actives) {
                        activesData = $(actives).data(DATA_KEY);
                        if (activesData && activesData._isTransitioning) {
                            return;
                        }
                    }
                    var startEvent = $.Event(Event.SHOW);
                    $(this._element).trigger(startEvent);
                    if (startEvent.isDefaultPrevented()) {
                        return;
                    }
                    if (actives) {
                        Collapse._jQueryInterface.call($(actives), "hide");
                        if (!activesData) {
                            $(actives).data(DATA_KEY, null);
                        }
                    }
                    var dimension = this._getDimension();
                    $(this._element).removeClass(ClassName.COLLAPSE).addClass(ClassName.COLLAPSING);
                    this._element.style[dimension] = 0;
                    this._element.setAttribute("aria-expanded", true);
                    if (this._triggerArray.length) {
                        $(this._triggerArray).removeClass(ClassName.COLLAPSED).attr("aria-expanded", true);
                    }
                    this.setTransitioning(true);
                    var complete = function complete() {
                        $(_this4._element).removeClass(ClassName.COLLAPSING).addClass(ClassName.COLLAPSE).addClass(ClassName.IN);
                        _this4._element.style[dimension] = "";
                        _this4.setTransitioning(false);
                        $(_this4._element).trigger(Event.SHOWN);
                    };
                    if (!Util.supportsTransitionEnd()) {
                        complete();
                        return;
                    }
                    var capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
                    var scrollSize = "scroll" + capitalizedDimension;
                    $(this._element).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
                    this._element.style[dimension] = this._element[scrollSize] + "px";
                }
            }, {
                key: "hide",
                value: function hide() {
                    var _this5 = this;
                    if (this._isTransitioning || !$(this._element).hasClass(ClassName.IN)) {
                        return;
                    }
                    var startEvent = $.Event(Event.HIDE);
                    $(this._element).trigger(startEvent);
                    if (startEvent.isDefaultPrevented()) {
                        return;
                    }
                    var dimension = this._getDimension();
                    var offsetDimension = dimension === Dimension.WIDTH ? "offsetWidth" : "offsetHeight";
                    this._element.style[dimension] = this._element[offsetDimension] + "px";
                    Util.reflow(this._element);
                    $(this._element).addClass(ClassName.COLLAPSING).removeClass(ClassName.COLLAPSE).removeClass(ClassName.IN);
                    this._element.setAttribute("aria-expanded", false);
                    if (this._triggerArray.length) {
                        $(this._triggerArray).addClass(ClassName.COLLAPSED).attr("aria-expanded", false);
                    }
                    this.setTransitioning(true);
                    var complete = function complete() {
                        _this5.setTransitioning(false);
                        $(_this5._element).removeClass(ClassName.COLLAPSING).addClass(ClassName.COLLAPSE).trigger(Event.HIDDEN);
                    };
                    this._element.style[dimension] = 0;
                    if (!Util.supportsTransitionEnd()) {
                        complete();
                        return;
                    }
                    $(this._element).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
                }
            }, {
                key: "setTransitioning",
                value: function setTransitioning(isTransitioning) {
                    this._isTransitioning = isTransitioning;
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $.removeData(this._element, DATA_KEY);
                    this._config = null;
                    this._parent = null;
                    this._element = null;
                    this._triggerArray = null;
                    this._isTransitioning = null;
                }
            }, {
                key: "_getConfig",
                value: function _getConfig(config) {
                    config = $.extend({}, Default, config);
                    config.toggle = Boolean(config.toggle);
                    Util.typeCheckConfig(NAME, config, DefaultType);
                    return config;
                }
            }, {
                key: "_getDimension",
                value: function _getDimension() {
                    var hasWidth = $(this._element).hasClass(Dimension.WIDTH);
                    return hasWidth ? Dimension.WIDTH : Dimension.HEIGHT;
                }
            }, {
                key: "_getParent",
                value: function _getParent() {
                    var _this6 = this;
                    var parent = $(this._config.parent)[0];
                    var selector = '[data-toggle="collapse"][data-parent="' + this._config.parent + '"]';
                    $(parent).find(selector).each(function(i, element) {
                        _this6._addAriaAndCollapsedClass(Collapse._getTargetFromElement(element), [ element ]);
                    });
                    return parent;
                }
            }, {
                key: "_addAriaAndCollapsedClass",
                value: function _addAriaAndCollapsedClass(element, triggerArray) {
                    if (element) {
                        var isOpen = $(element).hasClass(ClassName.IN);
                        element.setAttribute("aria-expanded", isOpen);
                        if (triggerArray.length) {
                            $(triggerArray).toggleClass(ClassName.COLLAPSED, !isOpen).attr("aria-expanded", isOpen);
                        }
                    }
                }
            } ], [ {
                key: "_getTargetFromElement",
                value: function _getTargetFromElement(element) {
                    var selector = Util.getSelectorFromElement(element);
                    return selector ? $(selector)[0] : null;
                }
            }, {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var $this = $(this);
                        var data = $this.data(DATA_KEY);
                        var _config = $.extend({}, Default, $this.data(), typeof config === "object" && config);
                        if (!data && _config.toggle && /show|hide/.test(config)) {
                            _config.toggle = false;
                        }
                        if (!data) {
                            data = new Collapse(this, _config);
                            $this.data(DATA_KEY, data);
                        }
                        if (typeof config === "string") {
                            if (data[config] === undefined) {
                                throw new Error('No method named "' + config + '"');
                            }
                            data[config]();
                        }
                    });
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            }, {
                key: "Default",
                get: function get() {
                    return Default;
                }
            } ]);
            return Collapse;
        }();
        $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function(event) {
            event.preventDefault();
            var target = Collapse._getTargetFromElement(this);
            var data = $(target).data(DATA_KEY);
            var config = data ? "toggle" : $(this).data();
            Collapse._jQueryInterface.call($(target), config);
        });
        $.fn[NAME] = Collapse._jQueryInterface;
        $.fn[NAME].Constructor = Collapse;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Collapse._jQueryInterface;
        };
        return Collapse;
    }(jQuery);
    var Dropdown = function($) {
        var NAME = "dropdown";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.dropdown";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var ESCAPE_KEYCODE = 27;
        var ARROW_UP_KEYCODE = 38;
        var ARROW_DOWN_KEYCODE = 40;
        var RIGHT_MOUSE_BUTTON_WHICH = 3;
        var Event = {
            HIDE: "hide" + EVENT_KEY,
            HIDDEN: "hidden" + EVENT_KEY,
            SHOW: "show" + EVENT_KEY,
            SHOWN: "shown" + EVENT_KEY,
            CLICK: "click" + EVENT_KEY,
            CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY,
            KEYDOWN_DATA_API: "keydown" + EVENT_KEY + DATA_API_KEY
        };
        var ClassName = {
            BACKDROP: "dropdown-backdrop",
            DISABLED: "disabled",
            OPEN: "open"
        };
        var Selector = {
            BACKDROP: ".dropdown-backdrop",
            DATA_TOGGLE: '[data-toggle="dropdown"]',
            FORM_CHILD: ".dropdown form",
            ROLE_MENU: '[role="menu"]',
            ROLE_LISTBOX: '[role="listbox"]',
            NAVBAR_NAV: ".navbar-nav",
            VISIBLE_ITEMS: '[role="menu"] li:not(.disabled) a, ' + '[role="listbox"] li:not(.disabled) a'
        };
        var Dropdown = function() {
            function Dropdown(element) {
                _classCallCheck(this, Dropdown);
                this._element = element;
                this._addEventListeners();
            }
            _createClass(Dropdown, [ {
                key: "toggle",
                value: function toggle() {
                    if (this.disabled || $(this).hasClass(ClassName.DISABLED)) {
                        return false;
                    }
                    var parent = Dropdown._getParentFromElement(this);
                    var isActive = $(parent).hasClass(ClassName.OPEN);
                    Dropdown._clearMenus();
                    if (isActive) {
                        return false;
                    }
                    if ("ontouchstart" in document.documentElement && !$(parent).closest(Selector.NAVBAR_NAV).length) {
                        var dropdown = document.createElement("div");
                        dropdown.className = ClassName.BACKDROP;
                        $(dropdown).insertBefore(this);
                        $(dropdown).on("click", Dropdown._clearMenus);
                    }
                    var relatedTarget = {
                        relatedTarget: this
                    };
                    var showEvent = $.Event(Event.SHOW, relatedTarget);
                    $(parent).trigger(showEvent);
                    if (showEvent.isDefaultPrevented()) {
                        return false;
                    }
                    this.focus();
                    this.setAttribute("aria-expanded", "true");
                    $(parent).toggleClass(ClassName.OPEN);
                    $(parent).trigger($.Event(Event.SHOWN, relatedTarget));
                    return false;
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $.removeData(this._element, DATA_KEY);
                    $(this._element).off(EVENT_KEY);
                    this._element = null;
                }
            }, {
                key: "_addEventListeners",
                value: function _addEventListeners() {
                    $(this._element).on(Event.CLICK, this.toggle);
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var data = $(this).data(DATA_KEY);
                        if (!data) {
                            $(this).data(DATA_KEY, data = new Dropdown(this));
                        }
                        if (typeof config === "string") {
                            if (data[config] === undefined) {
                                throw new Error('No method named "' + config + '"');
                            }
                            data[config].call(this);
                        }
                    });
                }
            }, {
                key: "_clearMenus",
                value: function _clearMenus(event) {
                    if (event && event.which === RIGHT_MOUSE_BUTTON_WHICH) {
                        return;
                    }
                    var backdrop = $(Selector.BACKDROP)[0];
                    if (backdrop) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                    var toggles = $.makeArray($(Selector.DATA_TOGGLE));
                    for (var i = 0; i < toggles.length; i++) {
                        var _parent = Dropdown._getParentFromElement(toggles[i]);
                        var relatedTarget = {
                            relatedTarget: toggles[i]
                        };
                        if (!$(_parent).hasClass(ClassName.OPEN)) {
                            continue;
                        }
                        if (event && event.type === "click" && /input|textarea/i.test(event.target.tagName) && $.contains(_parent, event.target)) {
                            continue;
                        }
                        var hideEvent = $.Event(Event.HIDE, relatedTarget);
                        $(_parent).trigger(hideEvent);
                        if (hideEvent.isDefaultPrevented()) {
                            continue;
                        }
                        toggles[i].setAttribute("aria-expanded", "false");
                        $(_parent).removeClass(ClassName.OPEN).trigger($.Event(Event.HIDDEN, relatedTarget));
                    }
                }
            }, {
                key: "_getParentFromElement",
                value: function _getParentFromElement(element) {
                    var parent = undefined;
                    var selector = Util.getSelectorFromElement(element);
                    if (selector) {
                        parent = $(selector)[0];
                    }
                    return parent || element.parentNode;
                }
            }, {
                key: "_dataApiKeydownHandler",
                value: function _dataApiKeydownHandler(event) {
                    if (!/(38|40|27|32)/.test(event.which) || /input|textarea/i.test(event.target.tagName)) {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    if (this.disabled || $(this).hasClass(ClassName.DISABLED)) {
                        return;
                    }
                    var parent = Dropdown._getParentFromElement(this);
                    var isActive = $(parent).hasClass(ClassName.OPEN);
                    if (!isActive && event.which !== ESCAPE_KEYCODE || isActive && event.which === ESCAPE_KEYCODE) {
                        if (event.which === ESCAPE_KEYCODE) {
                            var toggle = $(parent).find(Selector.DATA_TOGGLE)[0];
                            $(toggle).trigger("focus");
                        }
                        $(this).trigger("click");
                        return;
                    }
                    var items = $.makeArray($(Selector.VISIBLE_ITEMS));
                    items = items.filter(function(item) {
                        return item.offsetWidth || item.offsetHeight;
                    });
                    if (!items.length) {
                        return;
                    }
                    var index = items.indexOf(event.target);
                    if (event.which === ARROW_UP_KEYCODE && index > 0) {
                        index--;
                    }
                    if (event.which === ARROW_DOWN_KEYCODE && index < items.length - 1) {
                        index++;
                    }
                    if (index < 0) {
                        index = 0;
                    }
                    items[index].focus();
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            } ]);
            return Dropdown;
        }();
        $(document).on(Event.KEYDOWN_DATA_API, Selector.DATA_TOGGLE, Dropdown._dataApiKeydownHandler).on(Event.KEYDOWN_DATA_API, Selector.ROLE_MENU, Dropdown._dataApiKeydownHandler).on(Event.KEYDOWN_DATA_API, Selector.ROLE_LISTBOX, Dropdown._dataApiKeydownHandler).on(Event.CLICK_DATA_API, Dropdown._clearMenus).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, Dropdown.prototype.toggle).on(Event.CLICK_DATA_API, Selector.FORM_CHILD, function(e) {
            e.stopPropagation();
        });
        $.fn[NAME] = Dropdown._jQueryInterface;
        $.fn[NAME].Constructor = Dropdown;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Dropdown._jQueryInterface;
        };
        return Dropdown;
    }(jQuery);
    var Modal = function($) {
        var NAME = "modal";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.modal";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var TRANSITION_DURATION = 300;
        var BACKDROP_TRANSITION_DURATION = 150;
        var ESCAPE_KEYCODE = 27;
        var Default = {
            backdrop: true,
            keyboard: true,
            focus: true,
            show: true
        };
        var DefaultType = {
            backdrop: "(boolean|string)",
            keyboard: "boolean",
            focus: "boolean",
            show: "boolean"
        };
        var Event = {
            HIDE: "hide" + EVENT_KEY,
            HIDDEN: "hidden" + EVENT_KEY,
            SHOW: "show" + EVENT_KEY,
            SHOWN: "shown" + EVENT_KEY,
            FOCUSIN: "focusin" + EVENT_KEY,
            RESIZE: "resize" + EVENT_KEY,
            CLICK_DISMISS: "click.dismiss" + EVENT_KEY,
            KEYDOWN_DISMISS: "keydown.dismiss" + EVENT_KEY,
            MOUSEUP_DISMISS: "mouseup.dismiss" + EVENT_KEY,
            MOUSEDOWN_DISMISS: "mousedown.dismiss" + EVENT_KEY,
            CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY
        };
        var ClassName = {
            SCROLLBAR_MEASURER: "modal-scrollbar-measure",
            BACKDROP: "modal-backdrop",
            OPEN: "modal-open",
            FADE: "fade",
            IN: "in"
        };
        var Selector = {
            DIALOG: ".modal-dialog",
            DATA_TOGGLE: '[data-toggle="modal"]',
            DATA_DISMISS: '[data-dismiss="modal"]',
            FIXED_CONTENT: ".navbar-fixed-top, .navbar-fixed-bottom, .is-fixed"
        };
        var Modal = function() {
            function Modal(element, config) {
                _classCallCheck(this, Modal);
                this._config = this._getConfig(config);
                this._element = element;
                this._dialog = $(element).find(Selector.DIALOG)[0];
                this._backdrop = null;
                this._isShown = false;
                this._isBodyOverflowing = false;
                this._ignoreBackdropClick = false;
                this._originalBodyPadding = 0;
                this._scrollbarWidth = 0;
            }
            _createClass(Modal, [ {
                key: "toggle",
                value: function toggle(relatedTarget) {
                    return this._isShown ? this.hide() : this.show(relatedTarget);
                }
            }, {
                key: "show",
                value: function show(relatedTarget) {
                    var _this7 = this;
                    var showEvent = $.Event(Event.SHOW, {
                        relatedTarget: relatedTarget
                    });
                    $(this._element).trigger(showEvent);
                    if (this._isShown || showEvent.isDefaultPrevented()) {
                        return;
                    }
                    this._isShown = true;
                    this._checkScrollbar();
                    this._setScrollbar();
                    $(document.body).addClass(ClassName.OPEN);
                    this._setEscapeEvent();
                    this._setResizeEvent();
                    $(this._element).on(Event.CLICK_DISMISS, Selector.DATA_DISMISS, $.proxy(this.hide, this));
                    $(this._dialog).on(Event.MOUSEDOWN_DISMISS, function() {
                        $(_this7._element).one(Event.MOUSEUP_DISMISS, function(event) {
                            if ($(event.target).is(_this7._element)) {
                                _this7._ignoreBackdropClick = true;
                            }
                        });
                    });
                    this._showBackdrop($.proxy(this._showElement, this, relatedTarget));
                }
            }, {
                key: "hide",
                value: function hide(event) {
                    if (event) {
                        event.preventDefault();
                    }
                    var hideEvent = $.Event(Event.HIDE);
                    $(this._element).trigger(hideEvent);
                    if (!this._isShown || hideEvent.isDefaultPrevented()) {
                        return;
                    }
                    this._isShown = false;
                    this._setEscapeEvent();
                    this._setResizeEvent();
                    $(document).off(Event.FOCUSIN);
                    $(this._element).removeClass(ClassName.IN);
                    $(this._element).off(Event.CLICK_DISMISS);
                    $(this._dialog).off(Event.MOUSEDOWN_DISMISS);
                    if (Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.FADE)) {
                        $(this._element).one(Util.TRANSITION_END, $.proxy(this._hideModal, this)).emulateTransitionEnd(TRANSITION_DURATION);
                    } else {
                        this._hideModal();
                    }
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $.removeData(this._element, DATA_KEY);
                    $(window).off(EVENT_KEY);
                    $(document).off(EVENT_KEY);
                    $(this._element).off(EVENT_KEY);
                    $(this._backdrop).off(EVENT_KEY);
                    this._config = null;
                    this._element = null;
                    this._dialog = null;
                    this._backdrop = null;
                    this._isShown = null;
                    this._isBodyOverflowing = null;
                    this._ignoreBackdropClick = null;
                    this._originalBodyPadding = null;
                    this._scrollbarWidth = null;
                }
            }, {
                key: "_getConfig",
                value: function _getConfig(config) {
                    config = $.extend({}, Default, config);
                    Util.typeCheckConfig(NAME, config, DefaultType);
                    return config;
                }
            }, {
                key: "_showElement",
                value: function _showElement(relatedTarget) {
                    var _this8 = this;
                    var transition = Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.FADE);
                    if (!this._element.parentNode || this._element.parentNode.nodeType !== Node.ELEMENT_NODE) {
                        document.body.appendChild(this._element);
                    }
                    this._element.style.display = "block";
                    this._element.removeAttribute("aria-hidden");
                    this._element.scrollTop = 0;
                    if (transition) {
                        Util.reflow(this._element);
                    }
                    $(this._element).addClass(ClassName.IN);
                    if (this._config.focus) {
                        this._enforceFocus();
                    }
                    var shownEvent = $.Event(Event.SHOWN, {
                        relatedTarget: relatedTarget
                    });
                    var transitionComplete = function transitionComplete() {
                        if (_this8._config.focus) {
                            _this8._element.focus();
                        }
                        $(_this8._element).trigger(shownEvent);
                    };
                    if (transition) {
                        $(this._dialog).one(Util.TRANSITION_END, transitionComplete).emulateTransitionEnd(TRANSITION_DURATION);
                    } else {
                        transitionComplete();
                    }
                }
            }, {
                key: "_enforceFocus",
                value: function _enforceFocus() {
                    var _this9 = this;
                    $(document).off(Event.FOCUSIN).on(Event.FOCUSIN, function(event) {
                        if (document !== event.target && _this9._element !== event.target && !$(_this9._element).has(event.target).length) {
                            _this9._element.focus();
                        }
                    });
                }
            }, {
                key: "_setEscapeEvent",
                value: function _setEscapeEvent() {
                    var _this10 = this;
                    if (this._isShown && this._config.keyboard) {
                        $(this._element).on(Event.KEYDOWN_DISMISS, function(event) {
                            if (event.which === ESCAPE_KEYCODE) {
                                _this10.hide();
                            }
                        });
                    } else if (!this._isShown) {
                        $(this._element).off(Event.KEYDOWN_DISMISS);
                    }
                }
            }, {
                key: "_setResizeEvent",
                value: function _setResizeEvent() {
                    if (this._isShown) {
                        $(window).on(Event.RESIZE, $.proxy(this._handleUpdate, this));
                    } else {
                        $(window).off(Event.RESIZE);
                    }
                }
            }, {
                key: "_hideModal",
                value: function _hideModal() {
                    var _this11 = this;
                    this._element.style.display = "none";
                    this._element.setAttribute("aria-hidden", "true");
                    this._showBackdrop(function() {
                        $(document.body).removeClass(ClassName.OPEN);
                        _this11._resetAdjustments();
                        _this11._resetScrollbar();
                        $(_this11._element).trigger(Event.HIDDEN);
                    });
                }
            }, {
                key: "_removeBackdrop",
                value: function _removeBackdrop() {
                    if (this._backdrop) {
                        $(this._backdrop).remove();
                        this._backdrop = null;
                    }
                }
            }, {
                key: "_showBackdrop",
                value: function _showBackdrop(callback) {
                    var _this12 = this;
                    var animate = $(this._element).hasClass(ClassName.FADE) ? ClassName.FADE : "";
                    if (this._isShown && this._config.backdrop) {
                        var doAnimate = Util.supportsTransitionEnd() && animate;
                        this._backdrop = document.createElement("div");
                        this._backdrop.className = ClassName.BACKDROP;
                        if (animate) {
                            $(this._backdrop).addClass(animate);
                        }
                        $(this._backdrop).appendTo(document.body);
                        $(this._element).on(Event.CLICK_DISMISS, function(event) {
                            if (_this12._ignoreBackdropClick) {
                                _this12._ignoreBackdropClick = false;
                                return;
                            }
                            if (event.target !== event.currentTarget) {
                                return;
                            }
                            if (_this12._config.backdrop === "static") {
                                _this12._element.focus();
                            } else {
                                _this12.hide();
                            }
                        });
                        if (doAnimate) {
                            Util.reflow(this._backdrop);
                        }
                        $(this._backdrop).addClass(ClassName.IN);
                        if (!callback) {
                            return;
                        }
                        if (!doAnimate) {
                            callback();
                            return;
                        }
                        $(this._backdrop).one(Util.TRANSITION_END, callback).emulateTransitionEnd(BACKDROP_TRANSITION_DURATION);
                    } else if (!this._isShown && this._backdrop) {
                        $(this._backdrop).removeClass(ClassName.IN);
                        var callbackRemove = function callbackRemove() {
                            _this12._removeBackdrop();
                            if (callback) {
                                callback();
                            }
                        };
                        if (Util.supportsTransitionEnd() && $(this._element).hasClass(ClassName.FADE)) {
                            $(this._backdrop).one(Util.TRANSITION_END, callbackRemove).emulateTransitionEnd(BACKDROP_TRANSITION_DURATION);
                        } else {
                            callbackRemove();
                        }
                    } else if (callback) {
                        callback();
                    }
                }
            }, {
                key: "_handleUpdate",
                value: function _handleUpdate() {
                    this._adjustDialog();
                }
            }, {
                key: "_adjustDialog",
                value: function _adjustDialog() {
                    var isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
                    if (!this._isBodyOverflowing && isModalOverflowing) {
                        this._element.style.paddingLeft = this._scrollbarWidth + "px";
                    }
                    if (this._isBodyOverflowing && !isModalOverflowing) {
                        this._element.style.paddingRight = this._scrollbarWidth + "px";
                    }
                }
            }, {
                key: "_resetAdjustments",
                value: function _resetAdjustments() {
                    this._element.style.paddingLeft = "";
                    this._element.style.paddingRight = "";
                }
            }, {
                key: "_checkScrollbar",
                value: function _checkScrollbar() {
                    this._isBodyOverflowing = document.body.clientWidth < window.innerWidth;
                    this._scrollbarWidth = this._getScrollbarWidth();
                }
            }, {
                key: "_setScrollbar",
                value: function _setScrollbar() {
                    var bodyPadding = parseInt($(Selector.FIXED_CONTENT).css("padding-right") || 0, 10);
                    this._originalBodyPadding = document.body.style.paddingRight || "";
                    if (this._isBodyOverflowing) {
                        document.body.style.paddingRight = bodyPadding + this._scrollbarWidth + "px";
                    }
                }
            }, {
                key: "_resetScrollbar",
                value: function _resetScrollbar() {
                    document.body.style.paddingRight = this._originalBodyPadding;
                }
            }, {
                key: "_getScrollbarWidth",
                value: function _getScrollbarWidth() {
                    var scrollDiv = document.createElement("div");
                    scrollDiv.className = ClassName.SCROLLBAR_MEASURER;
                    document.body.appendChild(scrollDiv);
                    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
                    document.body.removeChild(scrollDiv);
                    return scrollbarWidth;
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config, relatedTarget) {
                    return this.each(function() {
                        var data = $(this).data(DATA_KEY);
                        var _config = $.extend({}, Modal.Default, $(this).data(), typeof config === "object" && config);
                        if (!data) {
                            data = new Modal(this, _config);
                            $(this).data(DATA_KEY, data);
                        }
                        if (typeof config === "string") {
                            if (data[config] === undefined) {
                                throw new Error('No method named "' + config + '"');
                            }
                            data[config](relatedTarget);
                        } else if (_config.show) {
                            data.show(relatedTarget);
                        }
                    });
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            }, {
                key: "Default",
                get: function get() {
                    return Default;
                }
            } ]);
            return Modal;
        }();
        $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function(event) {
            var _this13 = this;
            var target = undefined;
            var selector = Util.getSelectorFromElement(this);
            if (selector) {
                target = $(selector)[0];
            }
            var config = $(target).data(DATA_KEY) ? "toggle" : $.extend({}, $(target).data(), $(this).data());
            if (this.tagName === "A") {
                event.preventDefault();
            }
            var $target = $(target).one(Event.SHOW, function(showEvent) {
                if (showEvent.isDefaultPrevented()) {
                    return;
                }
                $target.one(Event.HIDDEN, function() {
                    if ($(_this13).is(":visible")) {
                        _this13.focus();
                    }
                });
            });
            Modal._jQueryInterface.call($(target), config, this);
        });
        $.fn[NAME] = Modal._jQueryInterface;
        $.fn[NAME].Constructor = Modal;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Modal._jQueryInterface;
        };
        return Modal;
    }(jQuery);
    var ScrollSpy = function($) {
        var NAME = "scrollspy";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.scrollspy";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var Default = {
            offset: 10,
            method: "auto",
            target: ""
        };
        var DefaultType = {
            offset: "number",
            method: "string",
            target: "(string|element)"
        };
        var Event = {
            ACTIVATE: "activate" + EVENT_KEY,
            SCROLL: "scroll" + EVENT_KEY,
            LOAD_DATA_API: "load" + EVENT_KEY + DATA_API_KEY
        };
        var ClassName = {
            DROPDOWN_ITEM: "dropdown-item",
            DROPDOWN_MENU: "dropdown-menu",
            NAV_LINK: "nav-link",
            NAV: "nav",
            ACTIVE: "active"
        };
        var Selector = {
            DATA_SPY: '[data-spy="scroll"]',
            ACTIVE: ".active",
            LIST_ITEM: ".list-item",
            LI: "li",
            LI_DROPDOWN: "li.dropdown",
            NAV_LINKS: ".nav-link",
            DROPDOWN: ".dropdown",
            DROPDOWN_ITEMS: ".dropdown-item",
            DROPDOWN_TOGGLE: ".dropdown-toggle"
        };
        var OffsetMethod = {
            OFFSET: "offset",
            POSITION: "position"
        };
        var ScrollSpy = function() {
            function ScrollSpy(element, config) {
                _classCallCheck(this, ScrollSpy);
                this._element = element;
                this._scrollElement = element.tagName === "BODY" ? window : element;
                this._config = this._getConfig(config);
                this._selector = this._config.target + " " + Selector.NAV_LINKS + "," + (this._config.target + " " + Selector.DROPDOWN_ITEMS);
                this._offsets = [];
                this._targets = [];
                this._activeTarget = null;
                this._scrollHeight = 0;
                $(this._scrollElement).on(Event.SCROLL, $.proxy(this._process, this));
                this.refresh();
                this._process();
            }
            _createClass(ScrollSpy, [ {
                key: "refresh",
                value: function refresh() {
                    var _this14 = this;
                    var autoMethod = this._scrollElement !== this._scrollElement.window ? OffsetMethod.POSITION : OffsetMethod.OFFSET;
                    var offsetMethod = this._config.method === "auto" ? autoMethod : this._config.method;
                    var offsetBase = offsetMethod === OffsetMethod.POSITION ? this._getScrollTop() : 0;
                    this._offsets = [];
                    this._targets = [];
                    this._scrollHeight = this._getScrollHeight();
                    var targets = $.makeArray($(this._selector));
                    targets.map(function(element) {
                        var target = undefined;
                        var targetSelector = Util.getSelectorFromElement(element);
                        if (targetSelector) {
                            target = $(targetSelector)[0];
                        }
                        if (target && (target.offsetWidth || target.offsetHeight)) {
                            return [ $(target)[offsetMethod]().top + offsetBase, targetSelector ];
                        }
                        return null;
                    }).filter(function(item) {
                        return item;
                    }).sort(function(a, b) {
                        return a[0] - b[0];
                    }).forEach(function(item) {
                        _this14._offsets.push(item[0]);
                        _this14._targets.push(item[1]);
                    });
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $.removeData(this._element, DATA_KEY);
                    $(this._scrollElement).off(EVENT_KEY);
                    this._element = null;
                    this._scrollElement = null;
                    this._config = null;
                    this._selector = null;
                    this._offsets = null;
                    this._targets = null;
                    this._activeTarget = null;
                    this._scrollHeight = null;
                }
            }, {
                key: "_getConfig",
                value: function _getConfig(config) {
                    config = $.extend({}, Default, config);
                    if (typeof config.target !== "string") {
                        var id = $(config.target).attr("id");
                        if (!id) {
                            id = Util.getUID(NAME);
                            $(config.target).attr("id", id);
                        }
                        config.target = "#" + id;
                    }
                    Util.typeCheckConfig(NAME, config, DefaultType);
                    return config;
                }
            }, {
                key: "_getScrollTop",
                value: function _getScrollTop() {
                    return this._scrollElement === window ? this._scrollElement.scrollY : this._scrollElement.scrollTop;
                }
            }, {
                key: "_getScrollHeight",
                value: function _getScrollHeight() {
                    return this._scrollElement.scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                }
            }, {
                key: "_process",
                value: function _process() {
                    var scrollTop = this._getScrollTop() + this._config.offset;
                    var scrollHeight = this._getScrollHeight();
                    var maxScroll = this._config.offset + scrollHeight - this._scrollElement.offsetHeight;
                    if (this._scrollHeight !== scrollHeight) {
                        this.refresh();
                    }
                    if (scrollTop >= maxScroll) {
                        var target = this._targets[this._targets.length - 1];
                        if (this._activeTarget !== target) {
                            this._activate(target);
                        }
                    }
                    if (this._activeTarget && scrollTop < this._offsets[0]) {
                        this._activeTarget = null;
                        this._clear();
                        return;
                    }
                    for (var i = this._offsets.length; i--; ) {
                        var isActiveTarget = this._activeTarget !== this._targets[i] && scrollTop >= this._offsets[i] && (this._offsets[i + 1] === undefined || scrollTop < this._offsets[i + 1]);
                        if (isActiveTarget) {
                            this._activate(this._targets[i]);
                        }
                    }
                }
            }, {
                key: "_activate",
                value: function _activate(target) {
                    this._activeTarget = target;
                    this._clear();
                    var queries = this._selector.split(",");
                    queries = queries.map(function(selector) {
                        return selector + '[data-target="' + target + '"],' + (selector + '[href="' + target + '"]');
                    });
                    var $link = $(queries.join(","));
                    if ($link.hasClass(ClassName.DROPDOWN_ITEM)) {
                        $link.closest(Selector.DROPDOWN).find(Selector.DROPDOWN_TOGGLE).addClass(ClassName.ACTIVE);
                        $link.addClass(ClassName.ACTIVE);
                    } else {
                        $link.parents(Selector.LI).find(Selector.NAV_LINKS).addClass(ClassName.ACTIVE);
                    }
                    $(this._scrollElement).trigger(Event.ACTIVATE, {
                        relatedTarget: target
                    });
                }
            }, {
                key: "_clear",
                value: function _clear() {
                    $(this._selector).filter(Selector.ACTIVE).removeClass(ClassName.ACTIVE);
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var data = $(this).data(DATA_KEY);
                        var _config = typeof config === "object" && config || null;
                        if (!data) {
                            data = new ScrollSpy(this, _config);
                            $(this).data(DATA_KEY, data);
                        }
                        if (typeof config === "string") {
                            if (data[config] === undefined) {
                                throw new Error('No method named "' + config + '"');
                            }
                            data[config]();
                        }
                    });
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            }, {
                key: "Default",
                get: function get() {
                    return Default;
                }
            } ]);
            return ScrollSpy;
        }();
        $(window).on(Event.LOAD_DATA_API, function() {
            var scrollSpys = $.makeArray($(Selector.DATA_SPY));
            for (var i = scrollSpys.length; i--; ) {
                var $spy = $(scrollSpys[i]);
                ScrollSpy._jQueryInterface.call($spy, $spy.data());
            }
        });
        $.fn[NAME] = ScrollSpy._jQueryInterface;
        $.fn[NAME].Constructor = ScrollSpy;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return ScrollSpy._jQueryInterface;
        };
        return ScrollSpy;
    }(jQuery);
    var Tab = function($) {
        var NAME = "tab";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.tab";
        var EVENT_KEY = "." + DATA_KEY;
        var DATA_API_KEY = ".data-api";
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var TRANSITION_DURATION = 150;
        var Event = {
            HIDE: "hide" + EVENT_KEY,
            HIDDEN: "hidden" + EVENT_KEY,
            SHOW: "show" + EVENT_KEY,
            SHOWN: "shown" + EVENT_KEY,
            CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY
        };
        var ClassName = {
            DROPDOWN_MENU: "dropdown-menu",
            ACTIVE: "active",
            FADE: "fade",
            IN: "in"
        };
        var Selector = {
            A: "a",
            LI: "li",
            DROPDOWN: ".dropdown",
            UL: "ul:not(.dropdown-menu)",
            FADE_CHILD: "> .nav-item .fade, > .fade",
            ACTIVE: ".active",
            ACTIVE_CHILD: "> .nav-item > .active, > .active",
            DATA_TOGGLE: '[data-toggle="tab"], [data-toggle="pill"]',
            DROPDOWN_TOGGLE: ".dropdown-toggle",
            DROPDOWN_ACTIVE_CHILD: "> .dropdown-menu .active"
        };
        var Tab = function() {
            function Tab(element) {
                _classCallCheck(this, Tab);
                this._element = element;
            }
            _createClass(Tab, [ {
                key: "show",
                value: function show() {
                    var _this15 = this;
                    if (this._element.parentNode && this._element.parentNode.nodeType === Node.ELEMENT_NODE && $(this._element).hasClass(ClassName.ACTIVE)) {
                        return;
                    }
                    var target = undefined;
                    var previous = undefined;
                    var ulElement = $(this._element).closest(Selector.UL)[0];
                    var selector = Util.getSelectorFromElement(this._element);
                    if (ulElement) {
                        previous = $.makeArray($(ulElement).find(Selector.ACTIVE));
                        previous = previous[previous.length - 1];
                    }
                    var hideEvent = $.Event(Event.HIDE, {
                        relatedTarget: this._element
                    });
                    var showEvent = $.Event(Event.SHOW, {
                        relatedTarget: previous
                    });
                    if (previous) {
                        $(previous).trigger(hideEvent);
                    }
                    $(this._element).trigger(showEvent);
                    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) {
                        return;
                    }
                    if (selector) {
                        target = $(selector)[0];
                    }
                    this._activate(this._element, ulElement);
                    var complete = function complete() {
                        var hiddenEvent = $.Event(Event.HIDDEN, {
                            relatedTarget: _this15._element
                        });
                        var shownEvent = $.Event(Event.SHOWN, {
                            relatedTarget: previous
                        });
                        $(previous).trigger(hiddenEvent);
                        $(_this15._element).trigger(shownEvent);
                    };
                    if (target) {
                        this._activate(target, target.parentNode, complete);
                    } else {
                        complete();
                    }
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    $.removeClass(this._element, DATA_KEY);
                    this._element = null;
                }
            }, {
                key: "_activate",
                value: function _activate(element, container, callback) {
                    var active = $(container).find(Selector.ACTIVE_CHILD)[0];
                    var isTransitioning = callback && Util.supportsTransitionEnd() && (active && $(active).hasClass(ClassName.FADE) || Boolean($(container).find(Selector.FADE_CHILD)[0]));
                    var complete = $.proxy(this._transitionComplete, this, element, active, isTransitioning, callback);
                    if (active && isTransitioning) {
                        $(active).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
                    } else {
                        complete();
                    }
                    if (active) {
                        $(active).removeClass(ClassName.IN);
                    }
                }
            }, {
                key: "_transitionComplete",
                value: function _transitionComplete(element, active, isTransitioning, callback) {
                    if (active) {
                        $(active).removeClass(ClassName.ACTIVE);
                        var dropdownChild = $(active).find(Selector.DROPDOWN_ACTIVE_CHILD)[0];
                        if (dropdownChild) {
                            $(dropdownChild).removeClass(ClassName.ACTIVE);
                        }
                        active.setAttribute("aria-expanded", false);
                    }
                    $(element).addClass(ClassName.ACTIVE);
                    element.setAttribute("aria-expanded", true);
                    if (isTransitioning) {
                        Util.reflow(element);
                        $(element).addClass(ClassName.IN);
                    } else {
                        $(element).removeClass(ClassName.FADE);
                    }
                    if (element.parentNode && $(element.parentNode).hasClass(ClassName.DROPDOWN_MENU)) {
                        var dropdownElement = $(element).closest(Selector.DROPDOWN)[0];
                        if (dropdownElement) {
                            $(dropdownElement).find(Selector.DROPDOWN_TOGGLE).addClass(ClassName.ACTIVE);
                        }
                        element.setAttribute("aria-expanded", true);
                    }
                    if (callback) {
                        callback();
                    }
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var $this = $(this);
                        var data = $this.data(DATA_KEY);
                        if (!data) {
                            data = data = new Tab(this);
                            $this.data(DATA_KEY, data);
                        }
                        if (typeof config === "string") {
                            if (data[config] === undefined) {
                                throw new Error('No method named "' + config + '"');
                            }
                            data[config]();
                        }
                    });
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            } ]);
            return Tab;
        }();
        $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function(event) {
            event.preventDefault();
            Tab._jQueryInterface.call($(this), "show");
        });
        $.fn[NAME] = Tab._jQueryInterface;
        $.fn[NAME].Constructor = Tab;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Tab._jQueryInterface;
        };
        return Tab;
    }(jQuery);
    var Tooltip = function($) {
        if (window.Tether === undefined) {
            throw new Error("Bootstrap tooltips require Tether (http://github.hubspot.com/tether/)");
        }
        var NAME = "tooltip";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.tooltip";
        var EVENT_KEY = "." + DATA_KEY;
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var TRANSITION_DURATION = 150;
        var CLASS_PREFIX = "bs-tether";
        var Default = {
            animation: true,
            template: '<div class="tooltip" role="tooltip">' + '<div class="tooltip-arrow"></div>' + '<div class="tooltip-inner"></div></div>',
            trigger: "hover focus",
            title: "",
            delay: 0,
            html: false,
            selector: false,
            placement: "top",
            offset: "0 0",
            constraints: []
        };
        var DefaultType = {
            animation: "boolean",
            template: "string",
            title: "(string|element|function)",
            trigger: "string",
            delay: "(number|object)",
            html: "boolean",
            selector: "(string|boolean)",
            placement: "(string|function)",
            offset: "string",
            constraints: "array"
        };
        var AttachmentMap = {
            TOP: "bottom center",
            RIGHT: "middle left",
            BOTTOM: "top center",
            LEFT: "middle right"
        };
        var HoverState = {
            IN: "in",
            OUT: "out"
        };
        var Event = {
            HIDE: "hide" + EVENT_KEY,
            HIDDEN: "hidden" + EVENT_KEY,
            SHOW: "show" + EVENT_KEY,
            SHOWN: "shown" + EVENT_KEY,
            INSERTED: "inserted" + EVENT_KEY,
            CLICK: "click" + EVENT_KEY,
            FOCUSIN: "focusin" + EVENT_KEY,
            FOCUSOUT: "focusout" + EVENT_KEY,
            MOUSEENTER: "mouseenter" + EVENT_KEY,
            MOUSELEAVE: "mouseleave" + EVENT_KEY
        };
        var ClassName = {
            FADE: "fade",
            IN: "in"
        };
        var Selector = {
            TOOLTIP: ".tooltip",
            TOOLTIP_INNER: ".tooltip-inner"
        };
        var TetherClass = {
            element: false,
            enabled: false
        };
        var Trigger = {
            HOVER: "hover",
            FOCUS: "focus",
            CLICK: "click",
            MANUAL: "manual"
        };
        var Tooltip = function() {
            function Tooltip(element, config) {
                _classCallCheck(this, Tooltip);
                this._isEnabled = true;
                this._timeout = 0;
                this._hoverState = "";
                this._activeTrigger = {};
                this._tether = null;
                this.element = element;
                this.config = this._getConfig(config);
                this.tip = null;
                this._setListeners();
            }
            _createClass(Tooltip, [ {
                key: "enable",
                value: function enable() {
                    this._isEnabled = true;
                }
            }, {
                key: "disable",
                value: function disable() {
                    this._isEnabled = false;
                }
            }, {
                key: "toggleEnabled",
                value: function toggleEnabled() {
                    this._isEnabled = !this._isEnabled;
                }
            }, {
                key: "toggle",
                value: function toggle(event) {
                    if (event) {
                        var dataKey = this.constructor.DATA_KEY;
                        var context = $(event.currentTarget).data(dataKey);
                        if (!context) {
                            context = new this.constructor(event.currentTarget, this._getDelegateConfig());
                            $(event.currentTarget).data(dataKey, context);
                        }
                        context._activeTrigger.click = !context._activeTrigger.click;
                        if (context._isWithActiveTrigger()) {
                            context._enter(null, context);
                        } else {
                            context._leave(null, context);
                        }
                    } else {
                        if ($(this.getTipElement()).hasClass(ClassName.IN)) {
                            this._leave(null, this);
                            return;
                        }
                        this._enter(null, this);
                    }
                }
            }, {
                key: "dispose",
                value: function dispose() {
                    clearTimeout(this._timeout);
                    this.cleanupTether();
                    $.removeData(this.element, this.constructor.DATA_KEY);
                    $(this.element).off(this.constructor.EVENT_KEY);
                    if (this.tip) {
                        $(this.tip).remove();
                    }
                    this._isEnabled = null;
                    this._timeout = null;
                    this._hoverState = null;
                    this._activeTrigger = null;
                    this._tether = null;
                    this.element = null;
                    this.config = null;
                    this.tip = null;
                }
            }, {
                key: "show",
                value: function show() {
                    var _this16 = this;
                    var showEvent = $.Event(this.constructor.Event.SHOW);
                    if (this.isWithContent() && this._isEnabled) {
                        $(this.element).trigger(showEvent);
                        var isInTheDom = $.contains(this.element.ownerDocument.documentElement, this.element);
                        if (showEvent.isDefaultPrevented() || !isInTheDom) {
                            return;
                        }
                        var tip = this.getTipElement();
                        var tipId = Util.getUID(this.constructor.NAME);
                        tip.setAttribute("id", tipId);
                        this.element.setAttribute("aria-describedby", tipId);
                        this.setContent();
                        if (this.config.animation) {
                            $(tip).addClass(ClassName.FADE);
                        }
                        var placement = typeof this.config.placement === "function" ? this.config.placement.call(this, tip, this.element) : this.config.placement;
                        var attachment = this._getAttachment(placement);
                        $(tip).data(this.constructor.DATA_KEY, this).appendTo(document.body);
                        $(this.element).trigger(this.constructor.Event.INSERTED);
                        this._tether = new Tether({
                            attachment: attachment,
                            element: tip,
                            target: this.element,
                            classes: TetherClass,
                            classPrefix: CLASS_PREFIX,
                            offset: this.config.offset,
                            constraints: this.config.constraints,
                            addTargetClasses: false
                        });
                        Util.reflow(tip);
                        this._tether.position();
                        $(tip).addClass(ClassName.IN);
                        var complete = function complete() {
                            var prevHoverState = _this16._hoverState;
                            _this16._hoverState = null;
                            $(_this16.element).trigger(_this16.constructor.Event.SHOWN);
                            if (prevHoverState === HoverState.OUT) {
                                _this16._leave(null, _this16);
                            }
                        };
                        if (Util.supportsTransitionEnd() && $(this.tip).hasClass(ClassName.FADE)) {
                            $(this.tip).one(Util.TRANSITION_END, complete).emulateTransitionEnd(Tooltip._TRANSITION_DURATION);
                            return;
                        }
                        complete();
                    }
                }
            }, {
                key: "hide",
                value: function hide(callback) {
                    var _this17 = this;
                    var tip = this.getTipElement();
                    var hideEvent = $.Event(this.constructor.Event.HIDE);
                    var complete = function complete() {
                        if (_this17._hoverState !== HoverState.IN && tip.parentNode) {
                            tip.parentNode.removeChild(tip);
                        }
                        _this17.element.removeAttribute("aria-describedby");
                        $(_this17.element).trigger(_this17.constructor.Event.HIDDEN);
                        _this17.cleanupTether();
                        if (callback) {
                            callback();
                        }
                    };
                    $(this.element).trigger(hideEvent);
                    if (hideEvent.isDefaultPrevented()) {
                        return;
                    }
                    $(tip).removeClass(ClassName.IN);
                    if (Util.supportsTransitionEnd() && $(this.tip).hasClass(ClassName.FADE)) {
                        $(tip).one(Util.TRANSITION_END, complete).emulateTransitionEnd(TRANSITION_DURATION);
                    } else {
                        complete();
                    }
                    this._hoverState = "";
                }
            }, {
                key: "isWithContent",
                value: function isWithContent() {
                    return Boolean(this.getTitle());
                }
            }, {
                key: "getTipElement",
                value: function getTipElement() {
                    return this.tip = this.tip || $(this.config.template)[0];
                }
            }, {
                key: "setContent",
                value: function setContent() {
                    var $tip = $(this.getTipElement());
                    this.setElementContent($tip.find(Selector.TOOLTIP_INNER), this.getTitle());
                    $tip.removeClass(ClassName.FADE).removeClass(ClassName.IN);
                    this.cleanupTether();
                }
            }, {
                key: "setElementContent",
                value: function setElementContent($element, content) {
                    var html = this.config.html;
                    if (typeof content === "object" && (content.nodeType || content.jquery)) {
                        if (html) {
                            if (!$(content).parent().is($element)) {
                                $element.empty().append(content);
                            }
                        } else {
                            $element.text($(content).text());
                        }
                    } else {
                        $element[html ? "html" : "text"](content);
                    }
                }
            }, {
                key: "getTitle",
                value: function getTitle() {
                    var title = this.element.getAttribute("data-original-title");
                    if (!title) {
                        title = typeof this.config.title === "function" ? this.config.title.call(this.element) : this.config.title;
                    }
                    return title;
                }
            }, {
                key: "cleanupTether",
                value: function cleanupTether() {
                    if (this._tether) {
                        this._tether.destroy();
                    }
                }
            }, {
                key: "_getAttachment",
                value: function _getAttachment(placement) {
                    return AttachmentMap[placement.toUpperCase()];
                }
            }, {
                key: "_setListeners",
                value: function _setListeners() {
                    var _this18 = this;
                    var triggers = this.config.trigger.split(" ");
                    triggers.forEach(function(trigger) {
                        if (trigger === "click") {
                            $(_this18.element).on(_this18.constructor.Event.CLICK, _this18.config.selector, $.proxy(_this18.toggle, _this18));
                        } else if (trigger !== Trigger.MANUAL) {
                            var eventIn = trigger === Trigger.HOVER ? _this18.constructor.Event.MOUSEENTER : _this18.constructor.Event.FOCUSIN;
                            var eventOut = trigger === Trigger.HOVER ? _this18.constructor.Event.MOUSELEAVE : _this18.constructor.Event.FOCUSOUT;
                            $(_this18.element).on(eventIn, _this18.config.selector, $.proxy(_this18._enter, _this18)).on(eventOut, _this18.config.selector, $.proxy(_this18._leave, _this18));
                        }
                    });
                    if (this.config.selector) {
                        this.config = $.extend({}, this.config, {
                            trigger: "manual",
                            selector: ""
                        });
                    } else {
                        this._fixTitle();
                    }
                }
            }, {
                key: "_fixTitle",
                value: function _fixTitle() {
                    var titleType = typeof this.element.getAttribute("data-original-title");
                    if (this.element.getAttribute("title") || titleType !== "string") {
                        this.element.setAttribute("data-original-title", this.element.getAttribute("title") || "");
                        this.element.setAttribute("title", "");
                    }
                }
            }, {
                key: "_enter",
                value: function _enter(event, context) {
                    var dataKey = this.constructor.DATA_KEY;
                    context = context || $(event.currentTarget).data(dataKey);
                    if (!context) {
                        context = new this.constructor(event.currentTarget, this._getDelegateConfig());
                        $(event.currentTarget).data(dataKey, context);
                    }
                    if (event) {
                        context._activeTrigger[event.type === "focusin" ? Trigger.FOCUS : Trigger.HOVER] = true;
                    }
                    if ($(context.getTipElement()).hasClass(ClassName.IN) || context._hoverState === HoverState.IN) {
                        context._hoverState = HoverState.IN;
                        return;
                    }
                    clearTimeout(context._timeout);
                    context._hoverState = HoverState.IN;
                    if (!context.config.delay || !context.config.delay.show) {
                        context.show();
                        return;
                    }
                    context._timeout = setTimeout(function() {
                        if (context._hoverState === HoverState.IN) {
                            context.show();
                        }
                    }, context.config.delay.show);
                }
            }, {
                key: "_leave",
                value: function _leave(event, context) {
                    var dataKey = this.constructor.DATA_KEY;
                    context = context || $(event.currentTarget).data(dataKey);
                    if (!context) {
                        context = new this.constructor(event.currentTarget, this._getDelegateConfig());
                        $(event.currentTarget).data(dataKey, context);
                    }
                    if (event) {
                        context._activeTrigger[event.type === "focusout" ? Trigger.FOCUS : Trigger.HOVER] = false;
                    }
                    if (context._isWithActiveTrigger()) {
                        return;
                    }
                    clearTimeout(context._timeout);
                    context._hoverState = HoverState.OUT;
                    if (!context.config.delay || !context.config.delay.hide) {
                        context.hide();
                        return;
                    }
                    context._timeout = setTimeout(function() {
                        if (context._hoverState === HoverState.OUT) {
                            context.hide();
                        }
                    }, context.config.delay.hide);
                }
            }, {
                key: "_isWithActiveTrigger",
                value: function _isWithActiveTrigger() {
                    for (var trigger in this._activeTrigger) {
                        if (this._activeTrigger[trigger]) {
                            return true;
                        }
                    }
                    return false;
                }
            }, {
                key: "_getConfig",
                value: function _getConfig(config) {
                    config = $.extend({}, this.constructor.Default, $(this.element).data(), config);
                    if (config.delay && typeof config.delay === "number") {
                        config.delay = {
                            show: config.delay,
                            hide: config.delay
                        };
                    }
                    Util.typeCheckConfig(NAME, config, this.constructor.DefaultType);
                    return config;
                }
            }, {
                key: "_getDelegateConfig",
                value: function _getDelegateConfig() {
                    var config = {};
                    if (this.config) {
                        for (var key in this.config) {
                            if (this.constructor.Default[key] !== this.config[key]) {
                                config[key] = this.config[key];
                            }
                        }
                    }
                    return config;
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var data = $(this).data(DATA_KEY);
                        var _config = typeof config === "object" ? config : null;
                        if (!data && /destroy|hide/.test(config)) {
                            return;
                        }
                        if (!data) {
                            data = new Tooltip(this, _config);
                            $(this).data(DATA_KEY, data);
                        }
                        if (typeof config === "string") {
                            if (data[config] === undefined) {
                                throw new Error('No method named "' + config + '"');
                            }
                            data[config]();
                        }
                    });
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            }, {
                key: "Default",
                get: function get() {
                    return Default;
                }
            }, {
                key: "NAME",
                get: function get() {
                    return NAME;
                }
            }, {
                key: "DATA_KEY",
                get: function get() {
                    return DATA_KEY;
                }
            }, {
                key: "Event",
                get: function get() {
                    return Event;
                }
            }, {
                key: "EVENT_KEY",
                get: function get() {
                    return EVENT_KEY;
                }
            }, {
                key: "DefaultType",
                get: function get() {
                    return DefaultType;
                }
            } ]);
            return Tooltip;
        }();
        $.fn[NAME] = Tooltip._jQueryInterface;
        $.fn[NAME].Constructor = Tooltip;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Tooltip._jQueryInterface;
        };
        return Tooltip;
    }(jQuery);
    var Popover = function($) {
        var NAME = "popover";
        var VERSION = "4.0.0-alpha.3";
        var DATA_KEY = "bs.popover";
        var EVENT_KEY = "." + DATA_KEY;
        var JQUERY_NO_CONFLICT = $.fn[NAME];
        var Default = $.extend({}, Tooltip.Default, {
            placement: "right",
            trigger: "click",
            content: "",
            template: '<div class="popover" role="tooltip">' + '<div class="popover-arrow"></div>' + '<h3 class="popover-title"></h3>' + '<div class="popover-content"></div></div>'
        });
        var DefaultType = $.extend({}, Tooltip.DefaultType, {
            content: "(string|element|function)"
        });
        var ClassName = {
            FADE: "fade",
            IN: "in"
        };
        var Selector = {
            TITLE: ".popover-title",
            CONTENT: ".popover-content",
            ARROW: ".popover-arrow"
        };
        var Event = {
            HIDE: "hide" + EVENT_KEY,
            HIDDEN: "hidden" + EVENT_KEY,
            SHOW: "show" + EVENT_KEY,
            SHOWN: "shown" + EVENT_KEY,
            INSERTED: "inserted" + EVENT_KEY,
            CLICK: "click" + EVENT_KEY,
            FOCUSIN: "focusin" + EVENT_KEY,
            FOCUSOUT: "focusout" + EVENT_KEY,
            MOUSEENTER: "mouseenter" + EVENT_KEY,
            MOUSELEAVE: "mouseleave" + EVENT_KEY
        };
        var Popover = function(_Tooltip) {
            _inherits(Popover, _Tooltip);
            function Popover() {
                _classCallCheck(this, Popover);
                _get(Object.getPrototypeOf(Popover.prototype), "constructor", this).apply(this, arguments);
            }
            _createClass(Popover, [ {
                key: "isWithContent",
                value: function isWithContent() {
                    return this.getTitle() || this._getContent();
                }
            }, {
                key: "getTipElement",
                value: function getTipElement() {
                    return this.tip = this.tip || $(this.config.template)[0];
                }
            }, {
                key: "setContent",
                value: function setContent() {
                    var $tip = $(this.getTipElement());
                    this.setElementContent($tip.find(Selector.TITLE), this.getTitle());
                    this.setElementContent($tip.find(Selector.CONTENT), this._getContent());
                    $tip.removeClass(ClassName.FADE).removeClass(ClassName.IN);
                    this.cleanupTether();
                }
            }, {
                key: "_getContent",
                value: function _getContent() {
                    return this.element.getAttribute("data-content") || (typeof this.config.content === "function" ? this.config.content.call(this.element) : this.config.content);
                }
            } ], [ {
                key: "_jQueryInterface",
                value: function _jQueryInterface(config) {
                    return this.each(function() {
                        var data = $(this).data(DATA_KEY);
                        var _config = typeof config === "object" ? config : null;
                        if (!data && /destroy|hide/.test(config)) {
                            return;
                        }
                        if (!data) {
                            data = new Popover(this, _config);
                            $(this).data(DATA_KEY, data);
                        }
                        if (typeof config === "string") {
                            if (data[config] === undefined) {
                                throw new Error('No method named "' + config + '"');
                            }
                            data[config]();
                        }
                    });
                }
            }, {
                key: "VERSION",
                get: function get() {
                    return VERSION;
                }
            }, {
                key: "Default",
                get: function get() {
                    return Default;
                }
            }, {
                key: "NAME",
                get: function get() {
                    return NAME;
                }
            }, {
                key: "DATA_KEY",
                get: function get() {
                    return DATA_KEY;
                }
            }, {
                key: "Event",
                get: function get() {
                    return Event;
                }
            }, {
                key: "EVENT_KEY",
                get: function get() {
                    return EVENT_KEY;
                }
            }, {
                key: "DefaultType",
                get: function get() {
                    return DefaultType;
                }
            } ]);
            return Popover;
        }(Tooltip);
        $.fn[NAME] = Popover._jQueryInterface;
        $.fn[NAME].Constructor = Popover;
        $.fn[NAME].noConflict = function() {
            $.fn[NAME] = JQUERY_NO_CONFLICT;
            return Popover._jQueryInterface;
        };
        return Popover;
    }(jQuery);
}(jQuery);

(function(glob) {
    var version = "0.4.2", has = "hasOwnProperty", separator = /[\.\/]/, comaseparator = /\s*,\s*/, wildcard = "*", fun = function() {}, numsort = function(a, b) {
        return a - b;
    }, current_event, stop, events = {
        n: {}
    }, firstDefined = function() {
        for (var i = 0, ii = this.length; i < ii; i++) {
            if (typeof this[i] != "undefined") {
                return this[i];
            }
        }
    }, lastDefined = function() {
        var i = this.length;
        while (--i) {
            if (typeof this[i] != "undefined") {
                return this[i];
            }
        }
    }, eve = function(name, scope) {
        name = String(name);
        var e = events, oldstop = stop, args = Array.prototype.slice.call(arguments, 2), listeners = eve.listeners(name), z = 0, f = false, l, indexed = [], queue = {}, out = [], ce = current_event, errors = [];
        out.firstDefined = firstDefined;
        out.lastDefined = lastDefined;
        current_event = name;
        stop = 0;
        for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
            indexed.push(listeners[i].zIndex);
            if (listeners[i].zIndex < 0) {
                queue[listeners[i].zIndex] = listeners[i];
            }
        }
        indexed.sort(numsort);
        while (indexed[z] < 0) {
            l = queue[indexed[z++]];
            out.push(l.apply(scope, args));
            if (stop) {
                stop = oldstop;
                return out;
            }
        }
        for (i = 0; i < ii; i++) {
            l = listeners[i];
            if ("zIndex" in l) {
                if (l.zIndex == indexed[z]) {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                    do {
                        z++;
                        l = queue[indexed[z]];
                        l && out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                    } while (l);
                } else {
                    queue[l.zIndex] = l;
                }
            } else {
                out.push(l.apply(scope, args));
                if (stop) {
                    break;
                }
            }
        }
        stop = oldstop;
        current_event = ce;
        return out;
    };
    eve._events = events;
    eve.listeners = function(name) {
        var names = name.split(separator), e = events, item, items, k, i, ii, j, jj, nes, es = [ e ], out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [ e[names[i]], e[wildcard] ];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    eve.on = function(name, f) {
        name = String(name);
        if (typeof f != "function") {
            return function() {};
        }
        var names = name.split(comaseparator);
        for (var i = 0, ii = names.length; i < ii; i++) {
            (function(name) {
                var names = name.split(separator), e = events, exist;
                for (var i = 0, ii = names.length; i < ii; i++) {
                    e = e.n;
                    e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {
                        n: {}
                    });
                }
                e.f = e.f || [];
                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                    exist = true;
                    break;
                }
                !exist && e.f.push(f);
            })(names[i]);
        }
        return function(zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    eve.f = function(event) {
        var attrs = [].slice.call(arguments, 1);
        return function() {
            eve.apply(null, [ event, null ].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    eve.stop = function() {
        stop = 1;
    };
    eve.nt = function(subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    eve.nts = function() {
        return current_event.split(separator);
    };
    eve.off = eve.unbind = function(name, f) {
        if (!name) {
            eve._events = events = {
                n: {}
            };
            return;
        }
        var names = name.split(comaseparator);
        if (names.length > 1) {
            for (var i = 0, ii = names.length; i < ii; i++) {
                eve.off(names[i], f);
            }
            return;
        }
        names = name.split(separator);
        var e, key, splice, i, ii, j, jj, cur = [ events ];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [ j, 1 ];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    eve.once = function(name, f) {
        var f2 = function() {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    eve.version = version;
    eve.toString = function() {
        return "You are running Eve " + version;
    };
    typeof module != "undefined" && module.exports ? module.exports = eve : typeof define === "function" && define.amd ? define("eve", [], function() {
        return eve;
    }) : glob.eve = eve;
})(this);

(function(glob, factory) {
    if (typeof define == "function" && define.amd) {
        define([ "eve" ], function(eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != "undefined") {
        var eve = require("eve");
        module.exports = factory(glob, eve);
    } else {
        factory(glob, glob.eve);
    }
})(window || this, function(window, eve) {
    var mina = function(eve) {
        var animations = {}, requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
            setTimeout(callback, 16);
        }, isArray = Array.isArray || function(a) {
            return a instanceof Array || Object.prototype.toString.call(a) == "[object Array]";
        }, idgen = 0, idprefix = "M" + (+new Date()).toString(36), ID = function() {
            return idprefix + (idgen++).toString(36);
        }, diff = function(a, b, A, B) {
            if (isArray(a)) {
                res = [];
                for (var i = 0, ii = a.length; i < ii; i++) {
                    res[i] = diff(a[i], b, A[i], B);
                }
                return res;
            }
            var dif = (A - a) / (B - b);
            return function(bb) {
                return a + dif * (bb - b);
            };
        }, timer = Date.now || function() {
            return +new Date();
        }, sta = function(val) {
            var a = this;
            if (val == null) {
                return a.s;
            }
            var ds = a.s - val;
            a.b += a.dur * ds;
            a.B += a.dur * ds;
            a.s = val;
        }, speed = function(val) {
            var a = this;
            if (val == null) {
                return a.spd;
            }
            a.spd = val;
        }, duration = function(val) {
            var a = this;
            if (val == null) {
                return a.dur;
            }
            a.s = a.s * val / a.dur;
            a.dur = val;
        }, stopit = function() {
            var a = this;
            delete animations[a.id];
            a.update();
            eve("mina.stop." + a.id, a);
        }, pause = function() {
            var a = this;
            if (a.pdif) {
                return;
            }
            delete animations[a.id];
            a.update();
            a.pdif = a.get() - a.b;
        }, resume = function() {
            var a = this;
            if (!a.pdif) {
                return;
            }
            a.b = a.get() - a.pdif;
            delete a.pdif;
            animations[a.id] = a;
        }, update = function() {
            var a = this, res;
            if (isArray(a.start)) {
                res = [];
                for (var j = 0, jj = a.start.length; j < jj; j++) {
                    res[j] = +a.start[j] + (a.end[j] - a.start[j]) * a.easing(a.s);
                }
            } else {
                res = +a.start + (a.end - a.start) * a.easing(a.s);
            }
            a.set(res);
        }, frame = function() {
            var len = 0;
            for (var i in animations) if (animations.hasOwnProperty(i)) {
                var a = animations[i], b = a.get(), res;
                len++;
                a.s = (b - a.b) / (a.dur / a.spd);
                if (a.s >= 1) {
                    delete animations[i];
                    a.s = 1;
                    len--;
                    (function(a) {
                        setTimeout(function() {
                            eve("mina.finish." + a.id, a);
                        });
                    })(a);
                }
                a.update();
            }
            len && requestAnimFrame(frame);
        }, mina = function(a, A, b, B, get, set, easing) {
            var anim = {
                id: ID(),
                start: a,
                end: A,
                b: b,
                s: 0,
                dur: B - b,
                spd: 1,
                get: get,
                set: set,
                easing: easing || mina.linear,
                status: sta,
                speed: speed,
                duration: duration,
                stop: stopit,
                pause: pause,
                resume: resume,
                update: update
            };
            animations[anim.id] = anim;
            var len = 0, i;
            for (i in animations) if (animations.hasOwnProperty(i)) {
                len++;
                if (len == 2) {
                    break;
                }
            }
            len == 1 && requestAnimFrame(frame);
            return anim;
        };
        mina.time = timer;
        mina.getById = function(id) {
            return animations[id] || null;
        };
        mina.linear = function(n) {
            return n;
        };
        mina.easeout = function(n) {
            return Math.pow(n, 1.7);
        };
        mina.easein = function(n) {
            return Math.pow(n, .48);
        };
        mina.easeinout = function(n) {
            if (n == 1) {
                return 1;
            }
            if (n == 0) {
                return 0;
            }
            var q = .48 - n / 1.04, Q = Math.sqrt(.1734 + q * q), x = Q - q, X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1), y = -Q - q, Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1), t = X + Y + .5;
            return (1 - t) * 3 * t * t + t * t * t;
        };
        mina.backin = function(n) {
            if (n == 1) {
                return 1;
            }
            var s = 1.70158;
            return n * n * ((s + 1) * n - s);
        };
        mina.backout = function(n) {
            if (n == 0) {
                return 0;
            }
            n = n - 1;
            var s = 1.70158;
            return n * n * ((s + 1) * n + s) + 1;
        };
        mina.elastic = function(n) {
            if (n == !!n) {
                return n;
            }
            return Math.pow(2, -10 * n) * Math.sin((n - .075) * (2 * Math.PI) / .3) + 1;
        };
        mina.bounce = function(n) {
            var s = 7.5625, p = 2.75, l;
            if (n < 1 / p) {
                l = s * n * n;
            } else {
                if (n < 2 / p) {
                    n -= 1.5 / p;
                    l = s * n * n + .75;
                } else {
                    if (n < 2.5 / p) {
                        n -= 2.25 / p;
                        l = s * n * n + .9375;
                    } else {
                        n -= 2.625 / p;
                        l = s * n * n + .984375;
                    }
                }
            }
            return l;
        };
        window.mina = mina;
        return mina;
    }(typeof eve == "undefined" ? function() {} : eve);
    var Snap = function(root) {
        Snap.version = "0.4.0";
        function Snap(w, h) {
            if (w) {
                if (w.nodeType) {
                    return wrap(w);
                }
                if (is(w, "array") && Snap.set) {
                    return Snap.set.apply(Snap, w);
                }
                if (w instanceof Element) {
                    return w;
                }
                if (h == null) {
                    w = glob.doc.querySelector(String(w));
                    return wrap(w);
                }
            }
            w = w == null ? "100%" : w;
            h = h == null ? "100%" : h;
            return new Paper(w, h);
        }
        Snap.toString = function() {
            return "Snap v" + this.version;
        };
        Snap._ = {};
        var glob = {
            win: root.window,
            doc: root.window.document
        };
        Snap._.glob = glob;
        var has = "hasOwnProperty", Str = String, toFloat = parseFloat, toInt = parseInt, math = Math, mmax = math.max, mmin = math.min, abs = math.abs, pow = math.pow, PI = math.PI, round = math.round, E = "", S = " ", objectToString = Object.prototype.toString, ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i, colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i, bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/, reURLValue = /^url\(#?([^)]+)\)$/, separator = Snap._.separator = /[,\s]+/, whitespace = /[\s]/g, commaSpaces = /[\s]*,[\s]*/, hsrg = {
            hs: 1,
            rg: 1
        }, pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/gi, tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/gi, pathValues = /(-?\d*\.?\d*(?:e[\-+]?\\d+)?)[\s]*,?[\s]*/gi, idgen = 0, idprefix = "S" + (+new Date()).toString(36), ID = function(el) {
            return (el && el.type ? el.type : E) + idprefix + (idgen++).toString(36);
        }, xlink = "http://www.w3.org/1999/xlink", xmlns = "http://www.w3.org/2000/svg", hub = {}, URL = Snap.url = function(url) {
            return "url('#" + url + "')";
        };
        function $(el, attr) {
            if (attr) {
                if (el == "#text") {
                    el = glob.doc.createTextNode(attr.text || attr["#text"] || "");
                }
                if (el == "#comment") {
                    el = glob.doc.createComment(attr.text || attr["#text"] || "");
                }
                if (typeof el == "string") {
                    el = $(el);
                }
                if (typeof attr == "string") {
                    if (el.nodeType == 1) {
                        if (attr.substring(0, 6) == "xlink:") {
                            return el.getAttributeNS(xlink, attr.substring(6));
                        }
                        if (attr.substring(0, 4) == "xml:") {
                            return el.getAttributeNS(xmlns, attr.substring(4));
                        }
                        return el.getAttribute(attr);
                    } else if (attr == "text") {
                        return el.nodeValue;
                    } else {
                        return null;
                    }
                }
                if (el.nodeType == 1) {
                    for (var key in attr) if (attr[has](key)) {
                        var val = Str(attr[key]);
                        if (val) {
                            if (key.substring(0, 6) == "xlink:") {
                                el.setAttributeNS(xlink, key.substring(6), val);
                            } else if (key.substring(0, 4) == "xml:") {
                                el.setAttributeNS(xmlns, key.substring(4), val);
                            } else {
                                el.setAttribute(key, val);
                            }
                        } else {
                            el.removeAttribute(key);
                        }
                    }
                } else if ("text" in attr) {
                    el.nodeValue = attr.text;
                }
            } else {
                el = glob.doc.createElementNS(xmlns, el);
            }
            return el;
        }
        Snap._.$ = $;
        Snap._.id = ID;
        function getAttrs(el) {
            var attrs = el.attributes, name, out = {};
            for (var i = 0; i < attrs.length; i++) {
                if (attrs[i].namespaceURI == xlink) {
                    name = "xlink:";
                } else {
                    name = "";
                }
                name += attrs[i].name;
                out[name] = attrs[i].textContent;
            }
            return out;
        }
        function is(o, type) {
            type = Str.prototype.toLowerCase.call(type);
            if (type == "finite") {
                return isFinite(o);
            }
            if (type == "array" && (o instanceof Array || Array.isArray && Array.isArray(o))) {
                return true;
            }
            return type == "null" && o === null || type == typeof o && o !== null || type == "object" && o === Object(o) || objectToString.call(o).slice(8, -1).toLowerCase() == type;
        }
        Snap.format = function() {
            var tokenRegex = /\{([^\}]+)\}/g, objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, replacer = function(all, key, obj) {
                var res = obj;
                key.replace(objNotationRegex, function(all, name, quote, quotedName, isFunc) {
                    name = name || quotedName;
                    if (res) {
                        if (name in res) {
                            res = res[name];
                        }
                        typeof res == "function" && isFunc && (res = res());
                    }
                });
                res = (res == null || res == obj ? all : res) + "";
                return res;
            };
            return function(str, obj) {
                return Str(str).replace(tokenRegex, function(all, key) {
                    return replacer(all, key, obj);
                });
            };
        }();
        function clone(obj) {
            if (typeof obj == "function" || Object(obj) !== obj) {
                return obj;
            }
            var res = new obj.constructor();
            for (var key in obj) if (obj[has](key)) {
                res[key] = clone(obj[key]);
            }
            return res;
        }
        Snap._.clone = clone;
        function repush(array, item) {
            for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
                return array.push(array.splice(i, 1)[0]);
            }
        }
        function cacher(f, scope, postprocessor) {
            function newf() {
                var arg = Array.prototype.slice.call(arguments, 0), args = arg.join("␀"), cache = newf.cache = newf.cache || {}, count = newf.count = newf.count || [];
                if (cache[has](args)) {
                    repush(count, args);
                    return postprocessor ? postprocessor(cache[args]) : cache[args];
                }
                count.length >= 1e3 && delete cache[count.shift()];
                count.push(args);
                cache[args] = f.apply(scope, arg);
                return postprocessor ? postprocessor(cache[args]) : cache[args];
            }
            return newf;
        }
        Snap._.cacher = cacher;
        function angle(x1, y1, x2, y2, x3, y3) {
            if (x3 == null) {
                var x = x1 - x2, y = y1 - y2;
                if (!x && !y) {
                    return 0;
                }
                return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
            } else {
                return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
            }
        }
        function rad(deg) {
            return deg % 360 * PI / 180;
        }
        function deg(rad) {
            return rad * 180 / PI % 360;
        }
        function x_y() {
            return this.x + S + this.y;
        }
        function x_y_w_h() {
            return this.x + S + this.y + S + this.width + " × " + this.height;
        }
        Snap.rad = rad;
        Snap.deg = deg;
        Snap.sin = function(angle) {
            return math.sin(Snap.rad(angle));
        };
        Snap.tan = function(angle) {
            return math.tan(Snap.rad(angle));
        };
        Snap.cos = function(angle) {
            return math.cos(Snap.rad(angle));
        };
        Snap.asin = function(num) {
            return Snap.deg(math.asin(num));
        };
        Snap.acos = function(num) {
            return Snap.deg(math.acos(num));
        };
        Snap.atan = function(num) {
            return Snap.deg(math.atan(num));
        };
        Snap.atan2 = function(num) {
            return Snap.deg(math.atan2(num));
        };
        Snap.angle = angle;
        Snap.len = function(x1, y1, x2, y2) {
            return Math.sqrt(Snap.len2(x1, y1, x2, y2));
        };
        Snap.len2 = function(x1, y1, x2, y2) {
            return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
        };
        Snap.closestPoint = function(path, x, y) {
            function distance2(p) {
                var dx = p.x - x, dy = p.y - y;
                return dx * dx + dy * dy;
            }
            var pathNode = path.node, pathLength = pathNode.getTotalLength(), precision = pathLength / pathNode.pathSegList.numberOfItems * .125, best, bestLength, bestDistance = Infinity;
            for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
                if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
                    best = scan, bestLength = scanLength, bestDistance = scanDistance;
                }
            }
            precision *= .5;
            while (precision > .5) {
                var before, after, beforeLength, afterLength, beforeDistance, afterDistance;
                if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
                    best = before, bestLength = beforeLength, bestDistance = beforeDistance;
                } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
                    best = after, bestLength = afterLength, bestDistance = afterDistance;
                } else {
                    precision *= .5;
                }
            }
            best = {
                x: best.x,
                y: best.y,
                length: bestLength,
                distance: Math.sqrt(bestDistance)
            };
            return best;
        };
        Snap.is = is;
        Snap.snapTo = function(values, value, tolerance) {
            tolerance = is(tolerance, "finite") ? tolerance : 10;
            if (is(values, "array")) {
                var i = values.length;
                while (i--) if (abs(values[i] - value) <= tolerance) {
                    return values[i];
                }
            } else {
                values = +values;
                var rem = value % values;
                if (rem < tolerance) {
                    return value - rem;
                }
                if (rem > values - tolerance) {
                    return value - rem + values;
                }
            }
            return value;
        };
        Snap.getRGB = cacher(function(colour) {
            if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    error: 1,
                    toString: rgbtoString
                };
            }
            if (colour == "none") {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    toString: rgbtoString
                };
            }
            !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
            if (!colour) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    error: 1,
                    toString: rgbtoString
                };
            }
            var res, red, green, blue, opacity, t, values, rgb = colour.match(colourRegExp);
            if (rgb) {
                if (rgb[2]) {
                    blue = toInt(rgb[2].substring(5), 16);
                    green = toInt(rgb[2].substring(3, 5), 16);
                    red = toInt(rgb[2].substring(1, 3), 16);
                }
                if (rgb[3]) {
                    blue = toInt((t = rgb[3].charAt(3)) + t, 16);
                    green = toInt((t = rgb[3].charAt(2)) + t, 16);
                    red = toInt((t = rgb[3].charAt(1)) + t, 16);
                }
                if (rgb[4]) {
                    values = rgb[4].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) == "%" && (red *= 2.55);
                    green = toFloat(values[1]);
                    values[1].slice(-1) == "%" && (green *= 2.55);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) == "%" && (blue *= 2.55);
                    rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                }
                if (rgb[5]) {
                    values = rgb[5].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) == "%" && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) == "%" && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) == "%" && (blue /= 100);
                    (values[0].slice(-3) == "deg" || values[0].slice(-1) == "°") && (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                    return Snap.hsb2rgb(red, green, blue, opacity);
                }
                if (rgb[6]) {
                    values = rgb[6].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) == "%" && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) == "%" && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) == "%" && (blue /= 100);
                    (values[0].slice(-3) == "deg" || values[0].slice(-1) == "°") && (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                    return Snap.hsl2rgb(red, green, blue, opacity);
                }
                red = mmin(math.round(red), 255);
                green = mmin(math.round(green), 255);
                blue = mmin(math.round(blue), 255);
                opacity = mmin(mmax(opacity, 0), 1);
                rgb = {
                    r: red,
                    g: green,
                    b: blue,
                    toString: rgbtoString
                };
                rgb.hex = "#" + (16777216 | blue | green << 8 | red << 16).toString(16).slice(1);
                rgb.opacity = is(opacity, "finite") ? opacity : 1;
                return rgb;
            }
            return {
                r: -1,
                g: -1,
                b: -1,
                hex: "none",
                error: 1,
                toString: rgbtoString
            };
        }, Snap);
        Snap.hsb = cacher(function(h, s, b) {
            return Snap.hsb2rgb(h, s, b).hex;
        });
        Snap.hsl = cacher(function(h, s, l) {
            return Snap.hsl2rgb(h, s, l).hex;
        });
        Snap.rgb = cacher(function(r, g, b, o) {
            if (is(o, "finite")) {
                var round = math.round;
                return "rgba(" + [ round(r), round(g), round(b), +o.toFixed(2) ] + ")";
            }
            return "#" + (16777216 | b | g << 8 | r << 16).toString(16).slice(1);
        });
        var toHex = function(color) {
            var i = glob.doc.getElementsByTagName("head")[0] || glob.doc.getElementsByTagName("svg")[0], red = "rgb(255, 0, 0)";
            toHex = cacher(function(color) {
                if (color.toLowerCase() == "red") {
                    return red;
                }
                i.style.color = red;
                i.style.color = color;
                var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
                return out == red ? null : out;
            });
            return toHex(color);
        }, hsbtoString = function() {
            return "hsb(" + [ this.h, this.s, this.b ] + ")";
        }, hsltoString = function() {
            return "hsl(" + [ this.h, this.s, this.l ] + ")";
        }, rgbtoString = function() {
            return this.opacity == 1 || this.opacity == null ? this.hex : "rgba(" + [ this.r, this.g, this.b, this.opacity ] + ")";
        }, prepareRGB = function(r, g, b) {
            if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
                b = r.b;
                g = r.g;
                r = r.r;
            }
            if (g == null && is(r, string)) {
                var clr = Snap.getRGB(r);
                r = clr.r;
                g = clr.g;
                b = clr.b;
            }
            if (r > 1 || g > 1 || b > 1) {
                r /= 255;
                g /= 255;
                b /= 255;
            }
            return [ r, g, b ];
        }, packageRGB = function(r, g, b, o) {
            r = math.round(r * 255);
            g = math.round(g * 255);
            b = math.round(b * 255);
            var rgb = {
                r: r,
                g: g,
                b: b,
                opacity: is(o, "finite") ? o : 1,
                hex: Snap.rgb(r, g, b),
                toString: rgbtoString
            };
            is(o, "finite") && (rgb.opacity = o);
            return rgb;
        };
        Snap.color = function(clr) {
            var rgb;
            if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
                rgb = Snap.hsb2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
                rgb = Snap.hsl2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else {
                if (is(clr, "string")) {
                    clr = Snap.getRGB(clr);
                }
                if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr && !("error" in clr)) {
                    rgb = Snap.rgb2hsl(clr);
                    clr.h = rgb.h;
                    clr.s = rgb.s;
                    clr.l = rgb.l;
                    rgb = Snap.rgb2hsb(clr);
                    clr.v = rgb.b;
                } else {
                    clr = {
                        hex: "none"
                    };
                    clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
                    clr.error = 1;
                }
            }
            clr.toString = rgbtoString;
            return clr;
        };
        Snap.hsb2rgb = function(h, s, v, o) {
            if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
                v = h.b;
                s = h.s;
                o = h.o;
                h = h.h;
            }
            h *= 360;
            var R, G, B, X, C;
            h = h % 360 / 60;
            C = v * s;
            X = C * (1 - abs(h % 2 - 1));
            R = G = B = v - C;
            h = ~~h;
            R += [ C, X, 0, 0, X, C ][h];
            G += [ X, C, C, X, 0, 0 ][h];
            B += [ 0, 0, X, C, C, X ][h];
            return packageRGB(R, G, B, o);
        };
        Snap.hsl2rgb = function(h, s, l, o) {
            if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
                l = h.l;
                s = h.s;
                h = h.h;
            }
            if (h > 1 || s > 1 || l > 1) {
                h /= 360;
                s /= 100;
                l /= 100;
            }
            h *= 360;
            var R, G, B, X, C;
            h = h % 360 / 60;
            C = 2 * s * (l < .5 ? l : 1 - l);
            X = C * (1 - abs(h % 2 - 1));
            R = G = B = l - C / 2;
            h = ~~h;
            R += [ C, X, 0, 0, X, C ][h];
            G += [ X, C, C, X, 0, 0 ][h];
            B += [ 0, 0, X, C, C, X ][h];
            return packageRGB(R, G, B, o);
        };
        Snap.rgb2hsb = function(r, g, b) {
            b = prepareRGB(r, g, b);
            r = b[0];
            g = b[1];
            b = b[2];
            var H, S, V, C;
            V = mmax(r, g, b);
            C = V - mmin(r, g, b);
            H = C == 0 ? null : V == r ? (g - b) / C : V == g ? (b - r) / C + 2 : (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            S = C == 0 ? 0 : C / V;
            return {
                h: H,
                s: S,
                b: V,
                toString: hsbtoString
            };
        };
        Snap.rgb2hsl = function(r, g, b) {
            b = prepareRGB(r, g, b);
            r = b[0];
            g = b[1];
            b = b[2];
            var H, S, L, M, m, C;
            M = mmax(r, g, b);
            m = mmin(r, g, b);
            C = M - m;
            H = C == 0 ? null : M == r ? (g - b) / C : M == g ? (b - r) / C + 2 : (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            L = (M + m) / 2;
            S = C == 0 ? 0 : L < .5 ? C / (2 * L) : C / (2 - 2 * L);
            return {
                h: H,
                s: S,
                l: L,
                toString: hsltoString
            };
        };
        Snap.parsePathString = function(pathString) {
            if (!pathString) {
                return null;
            }
            var pth = Snap.path(pathString);
            if (pth.arr) {
                return Snap.path.clone(pth.arr);
            }
            var paramCounts = {
                a: 7,
                c: 6,
                o: 2,
                h: 1,
                l: 2,
                m: 2,
                r: 4,
                q: 4,
                s: 4,
                t: 2,
                v: 1,
                u: 3,
                z: 0
            }, data = [];
            if (is(pathString, "array") && is(pathString[0], "array")) {
                data = Snap.path.clone(pathString);
            }
            if (!data.length) {
                Str(pathString).replace(pathCommand, function(a, b, c) {
                    var params = [], name = b.toLowerCase();
                    c.replace(pathValues, function(a, b) {
                        b && params.push(+b);
                    });
                    if (name == "m" && params.length > 2) {
                        data.push([ b ].concat(params.splice(0, 2)));
                        name = "l";
                        b = b == "m" ? "l" : "L";
                    }
                    if (name == "o" && params.length == 1) {
                        data.push([ b, params[0] ]);
                    }
                    if (name == "r") {
                        data.push([ b ].concat(params));
                    } else while (params.length >= paramCounts[name]) {
                        data.push([ b ].concat(params.splice(0, paramCounts[name])));
                        if (!paramCounts[name]) {
                            break;
                        }
                    }
                });
            }
            data.toString = Snap.path.toString;
            pth.arr = Snap.path.clone(data);
            return data;
        };
        var parseTransformString = Snap.parseTransformString = function(TString) {
            if (!TString) {
                return null;
            }
            var paramCounts = {
                r: 3,
                s: 4,
                t: 2,
                m: 6
            }, data = [];
            if (is(TString, "array") && is(TString[0], "array")) {
                data = Snap.path.clone(TString);
            }
            if (!data.length) {
                Str(TString).replace(tCommand, function(a, b, c) {
                    var params = [], name = b.toLowerCase();
                    c.replace(pathValues, function(a, b) {
                        b && params.push(+b);
                    });
                    data.push([ b ].concat(params));
                });
            }
            data.toString = Snap.path.toString;
            return data;
        };
        function svgTransform2string(tstr) {
            var res = [];
            tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function(all, name, params) {
                params = params.split(/\s*,\s*|\s+/);
                if (name == "rotate" && params.length == 1) {
                    params.push(0, 0);
                }
                if (name == "scale") {
                    if (params.length > 2) {
                        params = params.slice(0, 2);
                    } else if (params.length == 2) {
                        params.push(0, 0);
                    }
                    if (params.length == 1) {
                        params.push(params[0], 0, 0);
                    }
                }
                if (name == "skewX") {
                    res.push([ "m", 1, 0, math.tan(rad(params[0])), 1, 0, 0 ]);
                } else if (name == "skewY") {
                    res.push([ "m", 1, math.tan(rad(params[0])), 0, 1, 0, 0 ]);
                } else {
                    res.push([ name.charAt(0) ].concat(params));
                }
                return all;
            });
            return res;
        }
        Snap._.svgTransform2string = svgTransform2string;
        Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;
        function transform2matrix(tstr, bbox) {
            var tdata = parseTransformString(tstr), m = new Snap.Matrix();
            if (tdata) {
                for (var i = 0, ii = tdata.length; i < ii; i++) {
                    var t = tdata[i], tlen = t.length, command = Str(t[0]).toLowerCase(), absolute = t[0] != command, inver = absolute ? m.invert() : 0, x1, y1, x2, y2, bb;
                    if (command == "t" && tlen == 2) {
                        m.translate(t[1], 0);
                    } else if (command == "t" && tlen == 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command == "r") {
                        if (tlen == 2) {
                            bb = bb || bbox;
                            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.rotate(t[1], x2, y2);
                            } else {
                                m.rotate(t[1], t[2], t[3]);
                            }
                        }
                    } else if (command == "s") {
                        if (tlen == 2 || tlen == 3) {
                            bb = bb || bbox;
                            m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.scale(t[1], t[1], x2, y2);
                            } else {
                                m.scale(t[1], t[1], t[2], t[3]);
                            }
                        } else if (tlen == 5) {
                            if (absolute) {
                                x2 = inver.x(t[3], t[4]);
                                y2 = inver.y(t[3], t[4]);
                                m.scale(t[1], t[2], x2, y2);
                            } else {
                                m.scale(t[1], t[2], t[3], t[4]);
                            }
                        }
                    } else if (command == "m" && tlen == 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                }
            }
            return m;
        }
        Snap._.transform2matrix = transform2matrix;
        Snap._unit2px = unit2px;
        var contains = glob.doc.contains || glob.doc.compareDocumentPosition ? function(a, b) {
            var adown = a.nodeType == 9 ? a.documentElement : a, bup = b && b.parentNode;
            return a == bup || !!(bup && bup.nodeType == 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
        } : function(a, b) {
            if (b) {
                while (b) {
                    b = b.parentNode;
                    if (b == a) {
                        return true;
                    }
                }
            }
            return false;
        };
        function getSomeDefs(el) {
            var p = el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) || el.node.parentNode && wrap(el.node.parentNode) || Snap.select("svg") || Snap(0, 0), pdefs = p.select("defs"), defs = pdefs == null ? false : pdefs.node;
            if (!defs) {
                defs = make("defs", p.node).node;
            }
            return defs;
        }
        function getSomeSVG(el) {
            return el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) || Snap.select("svg");
        }
        Snap._.getSomeDefs = getSomeDefs;
        Snap._.getSomeSVG = getSomeSVG;
        function unit2px(el, name, value) {
            var svg = getSomeSVG(el).node, out = {}, mgr = svg.querySelector(".svg---mgr");
            if (!mgr) {
                mgr = $("rect");
                $(mgr, {
                    x: -9e9,
                    y: -9e9,
                    width: 10,
                    height: 10,
                    class: "svg---mgr",
                    fill: "none"
                });
                svg.appendChild(mgr);
            }
            function getW(val) {
                if (val == null) {
                    return E;
                }
                if (val == +val) {
                    return val;
                }
                $(mgr, {
                    width: val
                });
                try {
                    return mgr.getBBox().width;
                } catch (e) {
                    return 0;
                }
            }
            function getH(val) {
                if (val == null) {
                    return E;
                }
                if (val == +val) {
                    return val;
                }
                $(mgr, {
                    height: val
                });
                try {
                    return mgr.getBBox().height;
                } catch (e) {
                    return 0;
                }
            }
            function set(nam, f) {
                if (name == null) {
                    out[nam] = f(el.attr(nam) || 0);
                } else if (nam == name) {
                    out = f(value == null ? el.attr(nam) || 0 : value);
                }
            }
            switch (el.type) {
              case "rect":
                set("rx", getW);
                set("ry", getH);

              case "image":
                set("width", getW);
                set("height", getH);

              case "text":
                set("x", getW);
                set("y", getH);
                break;

              case "circle":
                set("cx", getW);
                set("cy", getH);
                set("r", getW);
                break;

              case "ellipse":
                set("cx", getW);
                set("cy", getH);
                set("rx", getW);
                set("ry", getH);
                break;

              case "line":
                set("x1", getW);
                set("x2", getW);
                set("y1", getH);
                set("y2", getH);
                break;

              case "marker":
                set("refX", getW);
                set("markerWidth", getW);
                set("refY", getH);
                set("markerHeight", getH);
                break;

              case "radialGradient":
                set("fx", getW);
                set("fy", getH);
                break;

              case "tspan":
                set("dx", getW);
                set("dy", getH);
                break;

              default:
                set(name, getW);
            }
            svg.removeChild(mgr);
            return out;
        }
        Snap.select = function(query) {
            query = Str(query).replace(/([^\\]):/g, "$1\\:");
            return wrap(glob.doc.querySelector(query));
        };
        Snap.selectAll = function(query) {
            var nodelist = glob.doc.querySelectorAll(query), set = (Snap.set || Array)();
            for (var i = 0; i < nodelist.length; i++) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };
        function add2group(list) {
            if (!is(list, "array")) {
                list = Array.prototype.slice.call(arguments, 0);
            }
            var i = 0, j = 0, node = this.node;
            while (this[i]) delete this[i++];
            for (i = 0; i < list.length; i++) {
                if (list[i].type == "set") {
                    list[i].forEach(function(el) {
                        node.appendChild(el.node);
                    });
                } else {
                    node.appendChild(list[i].node);
                }
            }
            var children = node.childNodes;
            for (i = 0; i < children.length; i++) {
                this[j++] = wrap(children[i]);
            }
            return this;
        }
        setInterval(function() {
            for (var key in hub) if (hub[has](key)) {
                var el = hub[key], node = el.node;
                if (el.type != "svg" && !node.ownerSVGElement || el.type == "svg" && (!node.parentNode || "ownerSVGElement" in node.parentNode && !node.ownerSVGElement)) {
                    delete hub[key];
                }
            }
        }, 1e4);
        function Element(el) {
            if (el.snap in hub) {
                return hub[el.snap];
            }
            var svg;
            try {
                svg = el.ownerSVGElement;
            } catch (e) {}
            this.node = el;
            if (svg) {
                this.paper = new Paper(svg);
            }
            this.type = el.tagName || el.nodeName;
            var id = this.id = ID(this);
            this.anims = {};
            this._ = {
                transform: []
            };
            el.snap = id;
            hub[id] = this;
            if (this.type == "g") {
                this.add = add2group;
            }
            if (this.type in {
                g: 1,
                mask: 1,
                pattern: 1,
                symbol: 1
            }) {
                for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
                    this[method] = Paper.prototype[method];
                }
            }
        }
        Element.prototype.attr = function(params, value) {
            var el = this, node = el.node;
            if (!params) {
                if (node.nodeType != 1) {
                    return {
                        text: node.nodeValue
                    };
                }
                var attr = node.attributes, out = {};
                for (var i = 0, ii = attr.length; i < ii; i++) {
                    out[attr[i].nodeName] = attr[i].nodeValue;
                }
                return out;
            }
            if (is(params, "string")) {
                if (arguments.length > 1) {
                    var json = {};
                    json[params] = value;
                    params = json;
                } else {
                    return eve("snap.util.getattr." + params, el).firstDefined();
                }
            }
            for (var att in params) {
                if (params[has](att)) {
                    eve("snap.util.attr." + att, el, params[att]);
                }
            }
            return el;
        };
        Snap.parse = function(svg) {
            var f = glob.doc.createDocumentFragment(), full = true, div = glob.doc.createElement("div");
            svg = Str(svg);
            if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
                svg = "<svg>" + svg + "</svg>";
                full = false;
            }
            div.innerHTML = svg;
            svg = div.getElementsByTagName("svg")[0];
            if (svg) {
                if (full) {
                    f = svg;
                } else {
                    while (svg.firstChild) {
                        f.appendChild(svg.firstChild);
                    }
                }
            }
            return new Fragment(f);
        };
        function Fragment(frag) {
            this.node = frag;
        }
        Snap.fragment = function() {
            var args = Array.prototype.slice.call(arguments, 0), f = glob.doc.createDocumentFragment();
            for (var i = 0, ii = args.length; i < ii; i++) {
                var item = args[i];
                if (item.node && item.node.nodeType) {
                    f.appendChild(item.node);
                }
                if (item.nodeType) {
                    f.appendChild(item);
                }
                if (typeof item == "string") {
                    f.appendChild(Snap.parse(item).node);
                }
            }
            return new Fragment(f);
        };
        function make(name, parent) {
            var res = $(name);
            parent.appendChild(res);
            var el = wrap(res);
            return el;
        }
        function Paper(w, h) {
            var res, desc, defs, proto = Paper.prototype;
            if (w && w.tagName == "svg") {
                if (w.snap in hub) {
                    return hub[w.snap];
                }
                var doc = w.ownerDocument;
                res = new Element(w);
                desc = w.getElementsByTagName("desc")[0];
                defs = w.getElementsByTagName("defs")[0];
                if (!desc) {
                    desc = $("desc");
                    desc.appendChild(doc.createTextNode("Created with Snap"));
                    res.node.appendChild(desc);
                }
                if (!defs) {
                    defs = $("defs");
                    res.node.appendChild(defs);
                }
                res.defs = defs;
                for (var key in proto) if (proto[has](key)) {
                    res[key] = proto[key];
                }
                res.paper = res.root = res;
            } else {
                res = make("svg", glob.doc.body);
                $(res.node, {
                    height: h,
                    version: 1.1,
                    width: w,
                    xmlns: xmlns
                });
            }
            return res;
        }
        function wrap(dom) {
            if (!dom) {
                return dom;
            }
            if (dom instanceof Element || dom instanceof Fragment) {
                return dom;
            }
            if (dom.tagName && dom.tagName.toLowerCase() == "svg") {
                return new Paper(dom);
            }
            if (dom.tagName && dom.tagName.toLowerCase() == "object" && dom.type == "image/svg+xml") {
                return new Paper(dom.contentDocument.getElementsByTagName("svg")[0]);
            }
            return new Element(dom);
        }
        Snap._.make = make;
        Snap._.wrap = wrap;
        Paper.prototype.el = function(name, attr) {
            var el = make(name, this.node);
            attr && el.attr(attr);
            return el;
        };
        Element.prototype.children = function() {
            var out = [], ch = this.node.childNodes;
            for (var i = 0, ii = ch.length; i < ii; i++) {
                out[i] = Snap(ch[i]);
            }
            return out;
        };
        function jsonFiller(root, o) {
            for (var i = 0, ii = root.length; i < ii; i++) {
                var item = {
                    type: root[i].type,
                    attr: root[i].attr()
                }, children = root[i].children();
                o.push(item);
                if (children.length) {
                    jsonFiller(children, item.childNodes = []);
                }
            }
        }
        Element.prototype.toJSON = function() {
            var out = [];
            jsonFiller([ this ], out);
            return out[0];
        };
        eve.on("snap.util.getattr", function() {
            var att = eve.nt();
            att = att.substring(att.lastIndexOf(".") + 1);
            var css = att.replace(/[A-Z]/g, function(letter) {
                return "-" + letter.toLowerCase();
            });
            if (cssAttr[has](css)) {
                return this.node.ownerDocument.defaultView.getComputedStyle(this.node, null).getPropertyValue(css);
            } else {
                return $(this.node, att);
            }
        });
        var cssAttr = {
            "alignment-baseline": 0,
            "baseline-shift": 0,
            clip: 0,
            "clip-path": 0,
            "clip-rule": 0,
            color: 0,
            "color-interpolation": 0,
            "color-interpolation-filters": 0,
            "color-profile": 0,
            "color-rendering": 0,
            cursor: 0,
            direction: 0,
            display: 0,
            "dominant-baseline": 0,
            "enable-background": 0,
            fill: 0,
            "fill-opacity": 0,
            "fill-rule": 0,
            filter: 0,
            "flood-color": 0,
            "flood-opacity": 0,
            font: 0,
            "font-family": 0,
            "font-size": 0,
            "font-size-adjust": 0,
            "font-stretch": 0,
            "font-style": 0,
            "font-variant": 0,
            "font-weight": 0,
            "glyph-orientation-horizontal": 0,
            "glyph-orientation-vertical": 0,
            "image-rendering": 0,
            kerning: 0,
            "letter-spacing": 0,
            "lighting-color": 0,
            marker: 0,
            "marker-end": 0,
            "marker-mid": 0,
            "marker-start": 0,
            mask: 0,
            opacity: 0,
            overflow: 0,
            "pointer-events": 0,
            "shape-rendering": 0,
            "stop-color": 0,
            "stop-opacity": 0,
            stroke: 0,
            "stroke-dasharray": 0,
            "stroke-dashoffset": 0,
            "stroke-linecap": 0,
            "stroke-linejoin": 0,
            "stroke-miterlimit": 0,
            "stroke-opacity": 0,
            "stroke-width": 0,
            "text-anchor": 0,
            "text-decoration": 0,
            "text-rendering": 0,
            "unicode-bidi": 0,
            visibility: 0,
            "word-spacing": 0,
            "writing-mode": 0
        };
        eve.on("snap.util.attr", function(value) {
            var att = eve.nt(), attr = {};
            att = att.substring(att.lastIndexOf(".") + 1);
            attr[att] = value;
            var style = att.replace(/-(\w)/gi, function(all, letter) {
                return letter.toUpperCase();
            }), css = att.replace(/[A-Z]/g, function(letter) {
                return "-" + letter.toLowerCase();
            });
            if (cssAttr[has](css)) {
                this.node.style[style] = value == null ? E : value;
            } else {
                $(this.node, attr);
            }
        });
        (function(proto) {})(Paper.prototype);
        Snap.ajax = function(url, postData, callback, scope) {
            var req = new XMLHttpRequest(), id = ID();
            if (req) {
                if (is(postData, "function")) {
                    scope = callback;
                    callback = postData;
                    postData = null;
                } else if (is(postData, "object")) {
                    var pd = [];
                    for (var key in postData) if (postData.hasOwnProperty(key)) {
                        pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
                    }
                    postData = pd.join("&");
                }
                req.open(postData ? "POST" : "GET", url, true);
                if (postData) {
                    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                }
                if (callback) {
                    eve.once("snap.ajax." + id + ".0", callback);
                    eve.once("snap.ajax." + id + ".200", callback);
                    eve.once("snap.ajax." + id + ".304", callback);
                }
                req.onreadystatechange = function() {
                    if (req.readyState != 4) return;
                    eve("snap.ajax." + id + "." + req.status, scope, req);
                };
                if (req.readyState == 4) {
                    return req;
                }
                req.send(postData);
                return req;
            }
        };
        Snap.load = function(url, callback, scope) {
            Snap.ajax(url, function(req) {
                var f = Snap.parse(req.responseText);
                scope ? callback.call(scope, f) : callback(f);
            });
        };
        var getOffset = function(elem) {
            var box = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body, docElem = doc.documentElement, clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0, top = box.top + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop) - clientTop, left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
            return {
                y: top,
                x: left
            };
        };
        Snap.getElementByPoint = function(x, y) {
            var paper = this, svg = paper.canvas, target = glob.doc.elementFromPoint(x, y);
            if (glob.win.opera && target.tagName == "svg") {
                var so = getOffset(target), sr = target.createSVGRect();
                sr.x = x - so.x;
                sr.y = y - so.y;
                sr.width = sr.height = 1;
                var hits = target.getIntersectionList(sr, null);
                if (hits.length) {
                    target = hits[hits.length - 1];
                }
            }
            if (!target) {
                return null;
            }
            return wrap(target);
        };
        Snap.plugin = function(f) {
            f(Snap, Element, Paper, glob, Fragment);
        };
        glob.win.Snap = Snap;
        return Snap;
    }(window || this);
    Snap.plugin(function(Snap, Element, Paper, glob, Fragment) {
        var elproto = Element.prototype, is = Snap.is, Str = String, unit2px = Snap._unit2px, $ = Snap._.$, make = Snap._.make, getSomeDefs = Snap._.getSomeDefs, has = "hasOwnProperty", wrap = Snap._.wrap;
        elproto.getBBox = function(isWithoutTransform) {
            if (!Snap.Matrix || !Snap.path) {
                return this.node.getBBox();
            }
            var el = this, m = new Snap.Matrix();
            if (el.removed) {
                return Snap._.box();
            }
            while (el.type == "use") {
                if (!isWithoutTransform) {
                    m = m.add(el.transform().localMatrix.translate(el.attr("x") || 0, el.attr("y") || 0));
                }
                if (el.original) {
                    el = el.original;
                } else {
                    var href = el.attr("xlink:href");
                    el = el.original = el.node.ownerDocument.getElementById(href.substring(href.indexOf("#") + 1));
                }
            }
            var _ = el._, pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
            try {
                if (isWithoutTransform) {
                    _.bboxwt = pathfinder ? Snap.path.getBBox(el.realPath = pathfinder(el)) : Snap._.box(el.node.getBBox());
                    return Snap._.box(_.bboxwt);
                } else {
                    el.realPath = pathfinder(el);
                    el.matrix = el.transform().localMatrix;
                    _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, m.add(el.matrix)));
                    return Snap._.box(_.bbox);
                }
            } catch (e) {
                return Snap._.box();
            }
        };
        var propString = function() {
            return this.string;
        };
        function extractTransform(el, tstr) {
            if (tstr == null) {
                var doReturn = true;
                if (el.type == "linearGradient" || el.type == "radialGradient") {
                    tstr = el.node.getAttribute("gradientTransform");
                } else if (el.type == "pattern") {
                    tstr = el.node.getAttribute("patternTransform");
                } else {
                    tstr = el.node.getAttribute("transform");
                }
                if (!tstr) {
                    return new Snap.Matrix();
                }
                tstr = Snap._.svgTransform2string(tstr);
            } else {
                if (!Snap._.rgTransform.test(tstr)) {
                    tstr = Snap._.svgTransform2string(tstr);
                } else {
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
                }
                if (is(tstr, "array")) {
                    tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
                }
                el._.transform = tstr;
            }
            var m = Snap._.transform2matrix(tstr, el.getBBox(1));
            if (doReturn) {
                return m;
            } else {
                el.matrix = m;
            }
        }
        elproto.transform = function(tstr) {
            var _ = this._;
            if (tstr == null) {
                var papa = this, global = new Snap.Matrix(this.node.getCTM()), local = extractTransform(this), ms = [ local ], m = new Snap.Matrix(), i, localString = local.toTransformString(), string = Str(local) == Str(this.matrix) ? Str(_.transform) : localString;
                while (papa.type != "svg" && (papa = papa.parent())) {
                    ms.push(extractTransform(papa));
                }
                i = ms.length;
                while (i--) {
                    m.add(ms[i]);
                }
                return {
                    string: string,
                    globalMatrix: global,
                    totalMatrix: m,
                    localMatrix: local,
                    diffMatrix: global.clone().add(local.invert()),
                    global: global.toTransformString(),
                    total: m.toTransformString(),
                    local: localString,
                    toString: propString
                };
            }
            if (tstr instanceof Snap.Matrix) {
                this.matrix = tstr;
                this._.transform = tstr.toTransformString();
            } else {
                extractTransform(this, tstr);
            }
            if (this.node) {
                if (this.type == "linearGradient" || this.type == "radialGradient") {
                    $(this.node, {
                        gradientTransform: this.matrix
                    });
                } else if (this.type == "pattern") {
                    $(this.node, {
                        patternTransform: this.matrix
                    });
                } else {
                    $(this.node, {
                        transform: this.matrix
                    });
                }
            }
            return this;
        };
        elproto.parent = function() {
            return wrap(this.node.parentNode);
        };
        elproto.append = elproto.add = function(el) {
            if (el) {
                if (el.type == "set") {
                    var it = this;
                    el.forEach(function(el) {
                        it.add(el);
                    });
                    return this;
                }
                el = wrap(el);
                this.node.appendChild(el.node);
                el.paper = this.paper;
            }
            return this;
        };
        elproto.appendTo = function(el) {
            if (el) {
                el = wrap(el);
                el.append(this);
            }
            return this;
        };
        elproto.prepend = function(el) {
            if (el) {
                if (el.type == "set") {
                    var it = this, first;
                    el.forEach(function(el) {
                        if (first) {
                            first.after(el);
                        } else {
                            it.prepend(el);
                        }
                        first = el;
                    });
                    return this;
                }
                el = wrap(el);
                var parent = el.parent();
                this.node.insertBefore(el.node, this.node.firstChild);
                this.add && this.add();
                el.paper = this.paper;
                this.parent() && this.parent().add();
                parent && parent.add();
            }
            return this;
        };
        elproto.prependTo = function(el) {
            el = wrap(el);
            el.prepend(this);
            return this;
        };
        elproto.before = function(el) {
            if (el.type == "set") {
                var it = this;
                el.forEach(function(el) {
                    var parent = el.parent();
                    it.node.parentNode.insertBefore(el.node, it.node);
                    parent && parent.add();
                });
                this.parent().add();
                return this;
            }
            el = wrap(el);
            var parent = el.parent();
            this.node.parentNode.insertBefore(el.node, this.node);
            this.parent() && this.parent().add();
            parent && parent.add();
            el.paper = this.paper;
            return this;
        };
        elproto.after = function(el) {
            el = wrap(el);
            var parent = el.parent();
            if (this.node.nextSibling) {
                this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
            } else {
                this.node.parentNode.appendChild(el.node);
            }
            this.parent() && this.parent().add();
            parent && parent.add();
            el.paper = this.paper;
            return this;
        };
        elproto.insertBefore = function(el) {
            el = wrap(el);
            var parent = this.parent();
            el.node.parentNode.insertBefore(this.node, el.node);
            this.paper = el.paper;
            parent && parent.add();
            el.parent() && el.parent().add();
            return this;
        };
        elproto.insertAfter = function(el) {
            el = wrap(el);
            var parent = this.parent();
            el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
            this.paper = el.paper;
            parent && parent.add();
            el.parent() && el.parent().add();
            return this;
        };
        elproto.remove = function() {
            var parent = this.parent();
            this.node.parentNode && this.node.parentNode.removeChild(this.node);
            delete this.paper;
            this.removed = true;
            parent && parent.add();
            return this;
        };
        elproto.select = function(query) {
            query = Str(query).replace(/([^\\]):/g, "$1\\:");
            return wrap(this.node.querySelector(query));
        };
        elproto.selectAll = function(query) {
            var nodelist = this.node.querySelectorAll(query), set = (Snap.set || Array)();
            for (var i = 0; i < nodelist.length; i++) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };
        elproto.asPX = function(attr, value) {
            if (value == null) {
                value = this.attr(attr);
            }
            return +unit2px(this, attr, value);
        };
        elproto.use = function() {
            var use, id = this.node.id;
            if (!id) {
                id = this.id;
                $(this.node, {
                    id: id
                });
            }
            if (this.type == "linearGradient" || this.type == "radialGradient" || this.type == "pattern") {
                use = make(this.type, this.node.parentNode);
            } else {
                use = make("use", this.node.parentNode);
            }
            $(use.node, {
                "xlink:href": "#" + id
            });
            use.original = this;
            return use;
        };
        function fixids(el) {
            var els = el.selectAll("*"), it, url = /^\s*url\(("|'|)(.*)\1\)\s*$/, ids = [], uses = {};
            function urltest(it, name) {
                var val = $(it.node, name);
                val = val && val.match(url);
                val = val && val[2];
                if (val && val.charAt() == "#") {
                    val = val.substring(1);
                } else {
                    return;
                }
                if (val) {
                    uses[val] = (uses[val] || []).concat(function(id) {
                        var attr = {};
                        attr[name] = URL(id);
                        $(it.node, attr);
                    });
                }
            }
            function linktest(it) {
                var val = $(it.node, "xlink:href");
                if (val && val.charAt() == "#") {
                    val = val.substring(1);
                } else {
                    return;
                }
                if (val) {
                    uses[val] = (uses[val] || []).concat(function(id) {
                        it.attr("xlink:href", "#" + id);
                    });
                }
            }
            for (var i = 0, ii = els.length; i < ii; i++) {
                it = els[i];
                urltest(it, "fill");
                urltest(it, "stroke");
                urltest(it, "filter");
                urltest(it, "mask");
                urltest(it, "clip-path");
                linktest(it);
                var oldid = $(it.node, "id");
                if (oldid) {
                    $(it.node, {
                        id: it.id
                    });
                    ids.push({
                        old: oldid,
                        id: it.id
                    });
                }
            }
            for (i = 0, ii = ids.length; i < ii; i++) {
                var fs = uses[ids[i].old];
                if (fs) {
                    for (var j = 0, jj = fs.length; j < jj; j++) {
                        fs[j](ids[i].id);
                    }
                }
            }
        }
        elproto.clone = function() {
            var clone = wrap(this.node.cloneNode(true));
            if ($(clone.node, "id")) {
                $(clone.node, {
                    id: clone.id
                });
            }
            fixids(clone);
            clone.insertAfter(this);
            return clone;
        };
        elproto.toDefs = function() {
            var defs = getSomeDefs(this);
            defs.appendChild(this.node);
            return this;
        };
        elproto.pattern = elproto.toPattern = function(x, y, width, height) {
            var p = make("pattern", getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, "object") && "x" in x) {
                y = x.y;
                width = x.width;
                height = x.height;
                x = x.x;
            }
            $(p.node, {
                x: x,
                y: y,
                width: width,
                height: height,
                patternUnits: "userSpaceOnUse",
                id: p.id,
                viewBox: [ x, y, width, height ].join(" ")
            });
            p.node.appendChild(this.node);
            return p;
        };
        elproto.marker = function(x, y, width, height, refX, refY) {
            var p = make("marker", getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, "object") && "x" in x) {
                y = x.y;
                width = x.width;
                height = x.height;
                refX = x.refX || x.cx;
                refY = x.refY || x.cy;
                x = x.x;
            }
            $(p.node, {
                viewBox: [ x, y, width, height ].join(" "),
                markerWidth: width,
                markerHeight: height,
                orient: "auto",
                refX: refX || 0,
                refY: refY || 0,
                id: p.id
            });
            p.node.appendChild(this.node);
            return p;
        };
        function slice(from, to, f) {
            return function(arr) {
                var res = arr.slice(from, to);
                if (res.length == 1) {
                    res = res[0];
                }
                return f ? f(res) : res;
            };
        }
        var Animation = function(attr, ms, easing, callback) {
            if (typeof easing == "function" && !easing.length) {
                callback = easing;
                easing = mina.linear;
            }
            this.attr = attr;
            this.dur = ms;
            easing && (this.easing = easing);
            callback && (this.callback = callback);
        };
        Snap._.Animation = Animation;
        Snap.animation = function(attr, ms, easing, callback) {
            return new Animation(attr, ms, easing, callback);
        };
        elproto.inAnim = function() {
            var el = this, res = [];
            for (var id in el.anims) if (el.anims[has](id)) {
                (function(a) {
                    res.push({
                        anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
                        mina: a,
                        curStatus: a.status(),
                        status: function(val) {
                            return a.status(val);
                        },
                        stop: function() {
                            a.stop();
                        }
                    });
                })(el.anims[id]);
            }
            return res;
        };
        Snap.animate = function(from, to, setter, ms, easing, callback) {
            if (typeof easing == "function" && !easing.length) {
                callback = easing;
                easing = mina.linear;
            }
            var now = mina.time(), anim = mina(from, to, now, now + ms, mina.time, setter, easing);
            callback && eve.once("mina.finish." + anim.id, callback);
            return anim;
        };
        elproto.stop = function() {
            var anims = this.inAnim();
            for (var i = 0, ii = anims.length; i < ii; i++) {
                anims[i].stop();
            }
            return this;
        };
        elproto.animate = function(attrs, ms, easing, callback) {
            if (typeof easing == "function" && !easing.length) {
                callback = easing;
                easing = mina.linear;
            }
            if (attrs instanceof Animation) {
                callback = attrs.callback;
                easing = attrs.easing;
                ms = easing.dur;
                attrs = attrs.attr;
            }
            var fkeys = [], tkeys = [], keys = {}, from, to, f, eq, el = this;
            for (var key in attrs) if (attrs[has](key)) {
                if (el.equal) {
                    eq = el.equal(key, Str(attrs[key]));
                    from = eq.from;
                    to = eq.to;
                    f = eq.f;
                } else {
                    from = +el.attr(key);
                    to = +attrs[key];
                }
                var len = is(from, "array") ? from.length : 1;
                keys[key] = slice(fkeys.length, fkeys.length + len, f);
                fkeys = fkeys.concat(from);
                tkeys = tkeys.concat(to);
            }
            var now = mina.time(), anim = mina(fkeys, tkeys, now, now + ms, mina.time, function(val) {
                var attr = {};
                for (var key in keys) if (keys[has](key)) {
                    attr[key] = keys[key](val);
                }
                el.attr(attr);
            }, easing);
            el.anims[anim.id] = anim;
            anim._attrs = attrs;
            anim._callback = callback;
            eve("snap.animcreated." + el.id, anim);
            eve.once("mina.finish." + anim.id, function() {
                delete el.anims[anim.id];
                callback && callback.call(el);
            });
            eve.once("mina.stop." + anim.id, function() {
                delete el.anims[anim.id];
            });
            return el;
        };
        var eldata = {};
        elproto.data = function(key, value) {
            var data = eldata[this.id] = eldata[this.id] || {};
            if (arguments.length == 0) {
                eve("snap.data.get." + this.id, this, data, null);
                return data;
            }
            if (arguments.length == 1) {
                if (Snap.is(key, "object")) {
                    for (var i in key) if (key[has](i)) {
                        this.data(i, key[i]);
                    }
                    return this;
                }
                eve("snap.data.get." + this.id, this, data[key], key);
                return data[key];
            }
            data[key] = value;
            eve("snap.data.set." + this.id, this, value, key);
            return this;
        };
        elproto.removeData = function(key) {
            if (key == null) {
                eldata[this.id] = {};
            } else {
                eldata[this.id] && delete eldata[this.id][key];
            }
            return this;
        };
        elproto.outerSVG = elproto.toString = toString(1);
        elproto.innerSVG = toString();
        function toString(type) {
            return function() {
                var res = type ? "<" + this.type : "", attr = this.node.attributes, chld = this.node.childNodes;
                if (type) {
                    for (var i = 0, ii = attr.length; i < ii; i++) {
                        res += " " + attr[i].name + '="' + attr[i].value.replace(/"/g, '\\"') + '"';
                    }
                }
                if (chld.length) {
                    type && (res += ">");
                    for (i = 0, ii = chld.length; i < ii; i++) {
                        if (chld[i].nodeType == 3) {
                            res += chld[i].nodeValue;
                        } else if (chld[i].nodeType == 1) {
                            res += wrap(chld[i]).toString();
                        }
                    }
                    type && (res += "</" + this.type + ">");
                } else {
                    type && (res += "/>");
                }
                return res;
            };
        }
        elproto.toDataURL = function() {
            if (window && window.btoa) {
                var bb = this.getBBox(), svg = Snap.format('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>', {
                    x: +bb.x.toFixed(3),
                    y: +bb.y.toFixed(3),
                    width: +bb.width.toFixed(3),
                    height: +bb.height.toFixed(3),
                    contents: this.outerSVG()
                });
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
            }
        };
        Fragment.prototype.select = elproto.select;
        Fragment.prototype.selectAll = elproto.selectAll;
    });
    Snap.plugin(function(Snap, Element, Paper, glob, Fragment) {
        var objectToString = Object.prototype.toString, Str = String, math = Math, E = "";
        function Matrix(a, b, c, d, e, f) {
            if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
                this.a = a.a;
                this.b = a.b;
                this.c = a.c;
                this.d = a.d;
                this.e = a.e;
                this.f = a.f;
                return;
            }
            if (a != null) {
                this.a = +a;
                this.b = +b;
                this.c = +c;
                this.d = +d;
                this.e = +e;
                this.f = +f;
            } else {
                this.a = 1;
                this.b = 0;
                this.c = 0;
                this.d = 1;
                this.e = 0;
                this.f = 0;
            }
        }
        (function(matrixproto) {
            matrixproto.add = function(a, b, c, d, e, f) {
                var out = [ [], [], [] ], m = [ [ this.a, this.c, this.e ], [ this.b, this.d, this.f ], [ 0, 0, 1 ] ], matrix = [ [ a, c, e ], [ b, d, f ], [ 0, 0, 1 ] ], x, y, z, res;
                if (a && a instanceof Matrix) {
                    matrix = [ [ a.a, a.c, a.e ], [ a.b, a.d, a.f ], [ 0, 0, 1 ] ];
                }
                for (x = 0; x < 3; x++) {
                    for (y = 0; y < 3; y++) {
                        res = 0;
                        for (z = 0; z < 3; z++) {
                            res += m[x][z] * matrix[z][y];
                        }
                        out[x][y] = res;
                    }
                }
                this.a = out[0][0];
                this.b = out[1][0];
                this.c = out[0][1];
                this.d = out[1][1];
                this.e = out[0][2];
                this.f = out[1][2];
                return this;
            };
            matrixproto.invert = function() {
                var me = this, x = me.a * me.d - me.b * me.c;
                return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
            };
            matrixproto.clone = function() {
                return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
            };
            matrixproto.translate = function(x, y) {
                return this.add(1, 0, 0, 1, x, y);
            };
            matrixproto.scale = function(x, y, cx, cy) {
                y == null && (y = x);
                (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
                this.add(x, 0, 0, y, 0, 0);
                (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
                return this;
            };
            matrixproto.rotate = function(a, x, y) {
                a = Snap.rad(a);
                x = x || 0;
                y = y || 0;
                var cos = +math.cos(a).toFixed(9), sin = +math.sin(a).toFixed(9);
                this.add(cos, sin, -sin, cos, x, y);
                return this.add(1, 0, 0, 1, -x, -y);
            };
            matrixproto.x = function(x, y) {
                return x * this.a + y * this.c + this.e;
            };
            matrixproto.y = function(x, y) {
                return x * this.b + y * this.d + this.f;
            };
            matrixproto.get = function(i) {
                return +this[Str.fromCharCode(97 + i)].toFixed(4);
            };
            matrixproto.toString = function() {
                return "matrix(" + [ this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5) ].join() + ")";
            };
            matrixproto.offset = function() {
                return [ this.e.toFixed(4), this.f.toFixed(4) ];
            };
            function norm(a) {
                return a[0] * a[0] + a[1] * a[1];
            }
            function normalize(a) {
                var mag = math.sqrt(norm(a));
                a[0] && (a[0] /= mag);
                a[1] && (a[1] /= mag);
            }
            matrixproto.determinant = function() {
                return this.a * this.d - this.b * this.c;
            };
            matrixproto.split = function() {
                var out = {};
                out.dx = this.e;
                out.dy = this.f;
                var row = [ [ this.a, this.c ], [ this.b, this.d ] ];
                out.scalex = math.sqrt(norm(row[0]));
                normalize(row[0]);
                out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
                row[1] = [ row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear ];
                out.scaley = math.sqrt(norm(row[1]));
                normalize(row[1]);
                out.shear /= out.scaley;
                if (this.determinant() < 0) {
                    out.scalex = -out.scalex;
                }
                var sin = -row[0][1], cos = row[1][1];
                if (cos < 0) {
                    out.rotate = Snap.deg(math.acos(cos));
                    if (sin < 0) {
                        out.rotate = 360 - out.rotate;
                    }
                } else {
                    out.rotate = Snap.deg(math.asin(sin));
                }
                out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
                out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
                out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
                return out;
            };
            matrixproto.toTransformString = function(shorter) {
                var s = shorter || this.split();
                if (!+s.shear.toFixed(9)) {
                    s.scalex = +s.scalex.toFixed(4);
                    s.scaley = +s.scaley.toFixed(4);
                    s.rotate = +s.rotate.toFixed(4);
                    return (s.dx || s.dy ? "t" + [ +s.dx.toFixed(4), +s.dy.toFixed(4) ] : E) + (s.scalex != 1 || s.scaley != 1 ? "s" + [ s.scalex, s.scaley, 0, 0 ] : E) + (s.rotate ? "r" + [ +s.rotate.toFixed(4), 0, 0 ] : E);
                } else {
                    return "m" + [ this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5) ];
                }
            };
        })(Matrix.prototype);
        Snap.Matrix = Matrix;
        Snap.matrix = function(a, b, c, d, e, f) {
            return new Matrix(a, b, c, d, e, f);
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob, Fragment) {
        var has = "hasOwnProperty", make = Snap._.make, wrap = Snap._.wrap, is = Snap.is, getSomeDefs = Snap._.getSomeDefs, reURLValue = /^url\(#?([^)]+)\)$/, $ = Snap._.$, URL = Snap.url, Str = String, separator = Snap._.separator, E = "";
        eve.on("snap.util.attr.mask", function(value) {
            if (value instanceof Element || value instanceof Fragment) {
                eve.stop();
                if (value instanceof Fragment && value.node.childNodes.length == 1) {
                    value = value.node.firstChild;
                    getSomeDefs(this).appendChild(value);
                    value = wrap(value);
                }
                if (value.type == "mask") {
                    var mask = value;
                } else {
                    mask = make("mask", getSomeDefs(this));
                    mask.node.appendChild(value.node);
                }
                !mask.node.id && $(mask.node, {
                    id: mask.id
                });
                $(this.node, {
                    mask: URL(mask.id)
                });
            }
        });
        (function(clipIt) {
            eve.on("snap.util.attr.clip", clipIt);
            eve.on("snap.util.attr.clip-path", clipIt);
            eve.on("snap.util.attr.clipPath", clipIt);
        })(function(value) {
            if (value instanceof Element || value instanceof Fragment) {
                eve.stop();
                if (value.type == "clipPath") {
                    var clip = value;
                } else {
                    clip = make("clipPath", getSomeDefs(this));
                    clip.node.appendChild(value.node);
                    !clip.node.id && $(clip.node, {
                        id: clip.id
                    });
                }
                $(this.node, {
                    "clip-path": URL(clip.node.id || clip.id)
                });
            }
        });
        function fillStroke(name) {
            return function(value) {
                eve.stop();
                if (value instanceof Fragment && value.node.childNodes.length == 1 && (value.node.firstChild.tagName == "radialGradient" || value.node.firstChild.tagName == "linearGradient" || value.node.firstChild.tagName == "pattern")) {
                    value = value.node.firstChild;
                    getSomeDefs(this).appendChild(value);
                    value = wrap(value);
                }
                if (value instanceof Element) {
                    if (value.type == "radialGradient" || value.type == "linearGradient" || value.type == "pattern") {
                        if (!value.node.id) {
                            $(value.node, {
                                id: value.id
                            });
                        }
                        var fill = URL(value.node.id);
                    } else {
                        fill = value.attr(name);
                    }
                } else {
                    fill = Snap.color(value);
                    if (fill.error) {
                        var grad = Snap(getSomeDefs(this).ownerSVGElement).gradient(value);
                        if (grad) {
                            if (!grad.node.id) {
                                $(grad.node, {
                                    id: grad.id
                                });
                            }
                            fill = URL(grad.node.id);
                        } else {
                            fill = value;
                        }
                    } else {
                        fill = Str(fill);
                    }
                }
                var attrs = {};
                attrs[name] = fill;
                $(this.node, attrs);
                this.node.style[name] = E;
            };
        }
        eve.on("snap.util.attr.fill", fillStroke("fill"));
        eve.on("snap.util.attr.stroke", fillStroke("stroke"));
        var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
        eve.on("snap.util.grad.parse", function parseGrad(string) {
            string = Str(string);
            var tokens = string.match(gradrg);
            if (!tokens) {
                return null;
            }
            var type = tokens[1], params = tokens[2], stops = tokens[3];
            params = params.split(/\s*,\s*/).map(function(el) {
                return +el == el ? +el : el;
            });
            if (params.length == 1 && params[0] == 0) {
                params = [];
            }
            stops = stops.split("-");
            stops = stops.map(function(el) {
                el = el.split(":");
                var out = {
                    color: el[0]
                };
                if (el[1]) {
                    out.offset = parseFloat(el[1]);
                }
                return out;
            });
            return {
                type: type,
                params: params,
                stops: stops
            };
        });
        eve.on("snap.util.attr.d", function(value) {
            eve.stop();
            if (is(value, "array") && is(value[0], "array")) {
                value = Snap.path.toString.call(value);
            }
            value = Str(value);
            if (value.match(/[ruo]/i)) {
                value = Snap.path.toAbsolute(value);
            }
            $(this.node, {
                d: value
            });
        })(-1);
        eve.on("snap.util.attr.#text", function(value) {
            eve.stop();
            value = Str(value);
            var txt = glob.doc.createTextNode(value);
            while (this.node.firstChild) {
                this.node.removeChild(this.node.firstChild);
            }
            this.node.appendChild(txt);
        })(-1);
        eve.on("snap.util.attr.path", function(value) {
            eve.stop();
            this.attr({
                d: value
            });
        })(-1);
        eve.on("snap.util.attr.class", function(value) {
            eve.stop();
            this.node.className.baseVal = value;
        })(-1);
        eve.on("snap.util.attr.viewBox", function(value) {
            var vb;
            if (is(value, "object") && "x" in value) {
                vb = [ value.x, value.y, value.width, value.height ].join(" ");
            } else if (is(value, "array")) {
                vb = value.join(" ");
            } else {
                vb = value;
            }
            $(this.node, {
                viewBox: vb
            });
            eve.stop();
        })(-1);
        eve.on("snap.util.attr.transform", function(value) {
            this.transform(value);
            eve.stop();
        })(-1);
        eve.on("snap.util.attr.r", function(value) {
            if (this.type == "rect") {
                eve.stop();
                $(this.node, {
                    rx: value,
                    ry: value
                });
            }
        })(-1);
        eve.on("snap.util.attr.textpath", function(value) {
            eve.stop();
            if (this.type == "text") {
                var id, tp, node;
                if (!value && this.textPath) {
                    tp = this.textPath;
                    while (tp.node.firstChild) {
                        this.node.appendChild(tp.node.firstChild);
                    }
                    tp.remove();
                    delete this.textPath;
                    return;
                }
                if (is(value, "string")) {
                    var defs = getSomeDefs(this), path = wrap(defs.parentNode).path(value);
                    defs.appendChild(path.node);
                    id = path.id;
                    path.attr({
                        id: id
                    });
                } else {
                    value = wrap(value);
                    if (value instanceof Element) {
                        id = value.attr("id");
                        if (!id) {
                            id = value.id;
                            value.attr({
                                id: id
                            });
                        }
                    }
                }
                if (id) {
                    tp = this.textPath;
                    node = this.node;
                    if (tp) {
                        tp.attr({
                            "xlink:href": "#" + id
                        });
                    } else {
                        tp = $("textPath", {
                            "xlink:href": "#" + id
                        });
                        while (node.firstChild) {
                            tp.appendChild(node.firstChild);
                        }
                        node.appendChild(tp);
                        this.textPath = wrap(tp);
                    }
                }
            }
        })(-1);
        eve.on("snap.util.attr.text", function(value) {
            if (this.type == "text") {
                var i = 0, node = this.node, tuner = function(chunk) {
                    var out = $("tspan");
                    if (is(chunk, "array")) {
                        for (var i = 0; i < chunk.length; i++) {
                            out.appendChild(tuner(chunk[i]));
                        }
                    } else {
                        out.appendChild(glob.doc.createTextNode(chunk));
                    }
                    out.normalize && out.normalize();
                    return out;
                };
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }
                var tuned = tuner(value);
                while (tuned.firstChild) {
                    node.appendChild(tuned.firstChild);
                }
            }
            eve.stop();
        })(-1);
        function setFontSize(value) {
            eve.stop();
            if (value == +value) {
                value += "px";
            }
            this.node.style.fontSize = value;
        }
        eve.on("snap.util.attr.fontSize", setFontSize)(-1);
        eve.on("snap.util.attr.font-size", setFontSize)(-1);
        eve.on("snap.util.getattr.transform", function() {
            eve.stop();
            return this.transform();
        })(-1);
        eve.on("snap.util.getattr.textpath", function() {
            eve.stop();
            return this.textPath;
        })(-1);
        (function() {
            function getter(end) {
                return function() {
                    eve.stop();
                    var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
                    if (style == "none") {
                        return style;
                    } else {
                        return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
                    }
                };
            }
            function setter(end) {
                return function(value) {
                    eve.stop();
                    var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
                    if (value == "" || !value) {
                        this.node.style[name] = "none";
                        return;
                    }
                    if (value.type == "marker") {
                        var id = value.node.id;
                        if (!id) {
                            $(value.node, {
                                id: value.id
                            });
                        }
                        this.node.style[name] = URL(id);
                        return;
                    }
                };
            }
            eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
            eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
            eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
            eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
            eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
            eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
            eve.on("snap.util.attr.marker-end", setter("end"))(-1);
            eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
            eve.on("snap.util.attr.marker-start", setter("start"))(-1);
            eve.on("snap.util.attr.markerStart", setter("start"))(-1);
            eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
            eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
        })();
        eve.on("snap.util.getattr.r", function() {
            if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
                eve.stop();
                return $(this.node, "rx");
            }
        })(-1);
        function textExtract(node) {
            var out = [];
            var children = node.childNodes;
            for (var i = 0, ii = children.length; i < ii; i++) {
                var chi = children[i];
                if (chi.nodeType == 3) {
                    out.push(chi.nodeValue);
                }
                if (chi.tagName == "tspan") {
                    if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
                        out.push(chi.firstChild.nodeValue);
                    } else {
                        out.push(textExtract(chi));
                    }
                }
            }
            return out;
        }
        eve.on("snap.util.getattr.text", function() {
            if (this.type == "text" || this.type == "tspan") {
                eve.stop();
                var out = textExtract(this.node);
                return out.length == 1 ? out[0] : out;
            }
        })(-1);
        eve.on("snap.util.getattr.#text", function() {
            return this.node.textContent;
        })(-1);
        eve.on("snap.util.getattr.viewBox", function() {
            eve.stop();
            var vb = $(this.node, "viewBox");
            if (vb) {
                vb = vb.split(separator);
                return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
            } else {
                return;
            }
        })(-1);
        eve.on("snap.util.getattr.points", function() {
            var p = $(this.node, "points");
            eve.stop();
            if (p) {
                return p.split(separator);
            } else {
                return;
            }
        })(-1);
        eve.on("snap.util.getattr.path", function() {
            var p = $(this.node, "d");
            eve.stop();
            return p;
        })(-1);
        eve.on("snap.util.getattr.class", function() {
            return this.node.className.baseVal;
        })(-1);
        function getFontSize() {
            eve.stop();
            return this.node.style.fontSize;
        }
        eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
        eve.on("snap.util.getattr.font-size", getFontSize)(-1);
    });
    Snap.plugin(function(Snap, Element, Paper, glob, Fragment) {
        var rgNotSpace = /\S+/g, rgBadSpace = /[\t\r\n\f]/g, rgTrim = /(^\s+|\s+$)/g, Str = String, elproto = Element.prototype;
        elproto.addClass = function(value) {
            var classes = Str(value || "").match(rgNotSpace) || [], elem = this.node, className = elem.className.baseVal, curClasses = className.match(rgNotSpace) || [], j, pos, clazz, finalValue;
            if (classes.length) {
                j = 0;
                while (clazz = classes[j++]) {
                    pos = curClasses.indexOf(clazz);
                    if (!~pos) {
                        curClasses.push(clazz);
                    }
                }
                finalValue = curClasses.join(" ");
                if (className != finalValue) {
                    elem.className.baseVal = finalValue;
                }
            }
            return this;
        };
        elproto.removeClass = function(value) {
            var classes = Str(value || "").match(rgNotSpace) || [], elem = this.node, className = elem.className.baseVal, curClasses = className.match(rgNotSpace) || [], j, pos, clazz, finalValue;
            if (curClasses.length) {
                j = 0;
                while (clazz = classes[j++]) {
                    pos = curClasses.indexOf(clazz);
                    if (~pos) {
                        curClasses.splice(pos, 1);
                    }
                }
                finalValue = curClasses.join(" ");
                if (className != finalValue) {
                    elem.className.baseVal = finalValue;
                }
            }
            return this;
        };
        elproto.hasClass = function(value) {
            var elem = this.node, className = elem.className.baseVal, curClasses = className.match(rgNotSpace) || [];
            return !!~curClasses.indexOf(value);
        };
        elproto.toggleClass = function(value, flag) {
            if (flag != null) {
                if (flag) {
                    return this.addClass(value);
                } else {
                    return this.removeClass(value);
                }
            }
            var classes = (value || "").match(rgNotSpace) || [], elem = this.node, className = elem.className.baseVal, curClasses = className.match(rgNotSpace) || [], j, pos, clazz, finalValue;
            j = 0;
            while (clazz = classes[j++]) {
                pos = curClasses.indexOf(clazz);
                if (~pos) {
                    curClasses.splice(pos, 1);
                } else {
                    curClasses.push(clazz);
                }
            }
            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                elem.className.baseVal = finalValue;
            }
            return this;
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob, Fragment) {
        var operators = {
            "+": function(x, y) {
                return x + y;
            },
            "-": function(x, y) {
                return x - y;
            },
            "/": function(x, y) {
                return x / y;
            },
            "*": function(x, y) {
                return x * y;
            }
        }, Str = String, reUnit = /[a-z]+$/i, reAddon = /^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;
        function getNumber(val) {
            return val;
        }
        function getUnit(unit) {
            return function(val) {
                return +val.toFixed(3) + unit;
            };
        }
        eve.on("snap.util.attr", function(val) {
            var plus = Str(val).match(reAddon);
            if (plus) {
                var evnt = eve.nt(), name = evnt.substring(evnt.lastIndexOf(".") + 1), a = this.attr(name), atr = {};
                eve.stop();
                var unit = plus[3] || "", aUnit = a.match(reUnit), op = operators[plus[1]];
                if (aUnit && aUnit == unit) {
                    val = op(parseFloat(a), +plus[2]);
                } else {
                    a = this.asPX(name);
                    val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
                }
                if (isNaN(a) || isNaN(val)) {
                    return;
                }
                atr[name] = val;
                this.attr(atr);
            }
        })(-10);
        eve.on("snap.util.equal", function(name, b) {
            var A, B, a = Str(this.attr(name) || ""), el = this, bplus = Str(b).match(reAddon);
            if (bplus) {
                eve.stop();
                var unit = bplus[3] || "", aUnit = a.match(reUnit), op = operators[bplus[1]];
                if (aUnit && aUnit == unit) {
                    return {
                        from: parseFloat(a),
                        to: op(parseFloat(a), +bplus[2]),
                        f: getUnit(aUnit)
                    };
                } else {
                    a = this.asPX(name);
                    return {
                        from: a,
                        to: op(a, this.asPX(name, bplus[2] + unit)),
                        f: getNumber
                    };
                }
            }
        })(-10);
    });
    Snap.plugin(function(Snap, Element, Paper, glob, Fragment) {
        var proto = Paper.prototype, is = Snap.is;
        proto.rect = function(x, y, w, h, rx, ry) {
            var attr;
            if (ry == null) {
                ry = rx;
            }
            if (is(x, "object") && x == "[object Object]") {
                attr = x;
            } else if (x != null) {
                attr = {
                    x: x,
                    y: y,
                    width: w,
                    height: h
                };
                if (rx != null) {
                    attr.rx = rx;
                    attr.ry = ry;
                }
            }
            return this.el("rect", attr);
        };
        proto.circle = function(cx, cy, r) {
            var attr;
            if (is(cx, "object") && cx == "[object Object]") {
                attr = cx;
            } else if (cx != null) {
                attr = {
                    cx: cx,
                    cy: cy,
                    r: r
                };
            }
            return this.el("circle", attr);
        };
        var preload = function() {
            function onerror() {
                this.parentNode.removeChild(this);
            }
            return function(src, f) {
                var img = glob.doc.createElement("img"), body = glob.doc.body;
                img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
                img.onload = function() {
                    f.call(img);
                    img.onload = img.onerror = null;
                    body.removeChild(img);
                };
                img.onerror = onerror;
                body.appendChild(img);
                img.src = src;
            };
        }();
        proto.image = function(src, x, y, width, height) {
            var el = this.el("image");
            if (is(src, "object") && "src" in src) {
                el.attr(src);
            } else if (src != null) {
                var set = {
                    "xlink:href": src,
                    preserveAspectRatio: "none"
                };
                if (x != null && y != null) {
                    set.x = x;
                    set.y = y;
                }
                if (width != null && height != null) {
                    set.width = width;
                    set.height = height;
                } else {
                    preload(src, function() {
                        Snap._.$(el.node, {
                            width: this.offsetWidth,
                            height: this.offsetHeight
                        });
                    });
                }
                Snap._.$(el.node, set);
            }
            return el;
        };
        proto.ellipse = function(cx, cy, rx, ry) {
            var attr;
            if (is(cx, "object") && cx == "[object Object]") {
                attr = cx;
            } else if (cx != null) {
                attr = {
                    cx: cx,
                    cy: cy,
                    rx: rx,
                    ry: ry
                };
            }
            return this.el("ellipse", attr);
        };
        proto.path = function(d) {
            var attr;
            if (is(d, "object") && !is(d, "array")) {
                attr = d;
            } else if (d) {
                attr = {
                    d: d
                };
            }
            return this.el("path", attr);
        };
        proto.group = proto.g = function(first) {
            var attr, el = this.el("g");
            if (arguments.length == 1 && first && !first.type) {
                el.attr(first);
            } else if (arguments.length) {
                el.add(Array.prototype.slice.call(arguments, 0));
            }
            return el;
        };
        proto.svg = function(x, y, width, height, vbx, vby, vbw, vbh) {
            var attrs = {};
            if (is(x, "object") && y == null) {
                attrs = x;
            } else {
                if (x != null) {
                    attrs.x = x;
                }
                if (y != null) {
                    attrs.y = y;
                }
                if (width != null) {
                    attrs.width = width;
                }
                if (height != null) {
                    attrs.height = height;
                }
                if (vbx != null && vby != null && vbw != null && vbh != null) {
                    attrs.viewBox = [ vbx, vby, vbw, vbh ];
                }
            }
            return this.el("svg", attrs);
        };
        proto.mask = function(first) {
            var attr, el = this.el("mask");
            if (arguments.length == 1 && first && !first.type) {
                el.attr(first);
            } else if (arguments.length) {
                el.add(Array.prototype.slice.call(arguments, 0));
            }
            return el;
        };
        proto.ptrn = function(x, y, width, height, vx, vy, vw, vh) {
            if (is(x, "object")) {
                var attr = x;
            } else {
                attr = {
                    patternUnits: "userSpaceOnUse"
                };
                if (x) {
                    attr.x = x;
                }
                if (y) {
                    attr.y = y;
                }
                if (width != null) {
                    attr.width = width;
                }
                if (height != null) {
                    attr.height = height;
                }
                if (vx != null && vy != null && vw != null && vh != null) {
                    attr.viewBox = [ vx, vy, vw, vh ];
                } else {
                    attr.viewBox = [ x || 0, y || 0, width || 0, height || 0 ];
                }
            }
            return this.el("pattern", attr);
        };
        proto.use = function(id) {
            if (id != null) {
                if (id instanceof Element) {
                    if (!id.attr("id")) {
                        id.attr({
                            id: Snap._.id(id)
                        });
                    }
                    id = id.attr("id");
                }
                if (String(id).charAt() == "#") {
                    id = id.substring(1);
                }
                return this.el("use", {
                    "xlink:href": "#" + id
                });
            } else {
                return Element.prototype.use.call(this);
            }
        };
        proto.symbol = function(vx, vy, vw, vh) {
            var attr = {};
            if (vx != null && vy != null && vw != null && vh != null) {
                attr.viewBox = [ vx, vy, vw, vh ];
            }
            return this.el("symbol", attr);
        };
        proto.text = function(x, y, text) {
            var attr = {};
            if (is(x, "object")) {
                attr = x;
            } else if (x != null) {
                attr = {
                    x: x,
                    y: y,
                    text: text || ""
                };
            }
            return this.el("text", attr);
        };
        proto.line = function(x1, y1, x2, y2) {
            var attr = {};
            if (is(x1, "object")) {
                attr = x1;
            } else if (x1 != null) {
                attr = {
                    x1: x1,
                    x2: x2,
                    y1: y1,
                    y2: y2
                };
            }
            return this.el("line", attr);
        };
        proto.polyline = function(points) {
            if (arguments.length > 1) {
                points = Array.prototype.slice.call(arguments, 0);
            }
            var attr = {};
            if (is(points, "object") && !is(points, "array")) {
                attr = points;
            } else if (points != null) {
                attr = {
                    points: points
                };
            }
            return this.el("polyline", attr);
        };
        proto.polygon = function(points) {
            if (arguments.length > 1) {
                points = Array.prototype.slice.call(arguments, 0);
            }
            var attr = {};
            if (is(points, "object") && !is(points, "array")) {
                attr = points;
            } else if (points != null) {
                attr = {
                    points: points
                };
            }
            return this.el("polygon", attr);
        };
        (function() {
            var $ = Snap._.$;
            function Gstops() {
                return this.selectAll("stop");
            }
            function GaddStop(color, offset) {
                var stop = $("stop"), attr = {
                    offset: +offset + "%"
                };
                color = Snap.color(color);
                attr["stop-color"] = color.hex;
                if (color.opacity < 1) {
                    attr["stop-opacity"] = color.opacity;
                }
                $(stop, attr);
                this.node.appendChild(stop);
                return this;
            }
            function GgetBBox() {
                if (this.type == "linearGradient") {
                    var x1 = $(this.node, "x1") || 0, x2 = $(this.node, "x2") || 1, y1 = $(this.node, "y1") || 0, y2 = $(this.node, "y2") || 0;
                    return Snap._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
                } else {
                    var cx = this.node.cx || .5, cy = this.node.cy || .5, r = this.node.r || 0;
                    return Snap._.box(cx - r, cy - r, r * 2, r * 2);
                }
            }
            function gradient(defs, str) {
                var grad = eve("snap.util.grad.parse", null, str).firstDefined(), el;
                if (!grad) {
                    return null;
                }
                grad.params.unshift(defs);
                if (grad.type.toLowerCase() == "l") {
                    el = gradientLinear.apply(0, grad.params);
                } else {
                    el = gradientRadial.apply(0, grad.params);
                }
                if (grad.type != grad.type.toLowerCase()) {
                    $(el.node, {
                        gradientUnits: "userSpaceOnUse"
                    });
                }
                var stops = grad.stops, len = stops.length, start = 0, j = 0;
                function seed(i, end) {
                    var step = (end - start) / (i - j);
                    for (var k = j; k < i; k++) {
                        stops[k].offset = +(+start + step * (k - j)).toFixed(2);
                    }
                    j = i;
                    start = end;
                }
                len--;
                for (var i = 0; i < len; i++) if ("offset" in stops[i]) {
                    seed(i, stops[i].offset);
                }
                stops[len].offset = stops[len].offset || 100;
                seed(len, stops[len].offset);
                for (i = 0; i <= len; i++) {
                    var stop = stops[i];
                    el.addStop(stop.color, stop.offset);
                }
                return el;
            }
            function gradientLinear(defs, x1, y1, x2, y2) {
                var el = Snap._.make("linearGradient", defs);
                el.stops = Gstops;
                el.addStop = GaddStop;
                el.getBBox = GgetBBox;
                if (x1 != null) {
                    $(el.node, {
                        x1: x1,
                        y1: y1,
                        x2: x2,
                        y2: y2
                    });
                }
                return el;
            }
            function gradientRadial(defs, cx, cy, r, fx, fy) {
                var el = Snap._.make("radialGradient", defs);
                el.stops = Gstops;
                el.addStop = GaddStop;
                el.getBBox = GgetBBox;
                if (cx != null) {
                    $(el.node, {
                        cx: cx,
                        cy: cy,
                        r: r
                    });
                }
                if (fx != null && fy != null) {
                    $(el.node, {
                        fx: fx,
                        fy: fy
                    });
                }
                return el;
            }
            proto.gradient = function(str) {
                return gradient(this.defs, str);
            };
            proto.gradientLinear = function(x1, y1, x2, y2) {
                return gradientLinear(this.defs, x1, y1, x2, y2);
            };
            proto.gradientRadial = function(cx, cy, r, fx, fy) {
                return gradientRadial(this.defs, cx, cy, r, fx, fy);
            };
            proto.toString = function() {
                var doc = this.node.ownerDocument, f = doc.createDocumentFragment(), d = doc.createElement("div"), svg = this.node.cloneNode(true), res;
                f.appendChild(d);
                d.appendChild(svg);
                Snap._.$(svg, {
                    xmlns: "http://www.w3.org/2000/svg"
                });
                res = d.innerHTML;
                f.removeChild(f.firstChild);
                return res;
            };
            proto.toDataURL = function() {
                if (window && window.btoa) {
                    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this)));
                }
            };
            proto.clear = function() {
                var node = this.node.firstChild, next;
                while (node) {
                    next = node.nextSibling;
                    if (node.tagName != "defs") {
                        node.parentNode.removeChild(node);
                    } else {
                        proto.clear.call({
                            node: node
                        });
                    }
                    node = next;
                }
            };
        })();
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var elproto = Element.prototype, is = Snap.is, clone = Snap._.clone, has = "hasOwnProperty", p2s = /,?([a-z]),?/gi, toFloat = parseFloat, math = Math, PI = math.PI, mmin = math.min, mmax = math.max, pow = math.pow, abs = math.abs;
        function paths(ps) {
            var p = paths.ps = paths.ps || {};
            if (p[ps]) {
                p[ps].sleep = 100;
            } else {
                p[ps] = {
                    sleep: 100
                };
            }
            setTimeout(function() {
                for (var key in p) if (p[has](key) && key != ps) {
                    p[key].sleep--;
                    !p[key].sleep && delete p[key];
                }
            });
            return p[ps];
        }
        function box(x, y, width, height) {
            if (x == null) {
                x = y = width = height = 0;
            }
            if (y == null) {
                y = x.y;
                width = x.width;
                height = x.height;
                x = x.x;
            }
            return {
                x: x,
                y: y,
                width: width,
                w: width,
                height: height,
                h: height,
                x2: x + width,
                y2: y + height,
                cx: x + width / 2,
                cy: y + height / 2,
                r1: math.min(width, height) / 2,
                r2: math.max(width, height) / 2,
                r0: math.sqrt(width * width + height * height) / 2,
                path: rectPath(x, y, width, height),
                vb: [ x, y, width, height ].join(" ")
            };
        }
        function toString() {
            return this.join(",").replace(p2s, "$1");
        }
        function pathClone(pathArray) {
            var res = clone(pathArray);
            res.toString = toString;
            return res;
        }
        function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
            if (length == null) {
                return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
            } else {
                return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
            }
        }
        function getLengthFactory(istotal, subpath) {
            function O(val) {
                return +(+val).toFixed(3);
            }
            return Snap._.cacher(function(path, length, onlystart) {
                if (path instanceof Element) {
                    path = path.attr("d");
                }
                path = path2curve(path);
                var x, y, p, l, sp = "", subpaths = {}, point, len = 0;
                for (var i = 0, ii = path.length; i < ii; i++) {
                    p = path[i];
                    if (p[0] == "M") {
                        x = +p[1];
                        y = +p[2];
                    } else {
                        l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                        if (len + l > length) {
                            if (subpath && !subpaths.start) {
                                point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                                sp += [ "C" + O(point.start.x), O(point.start.y), O(point.m.x), O(point.m.y), O(point.x), O(point.y) ];
                                if (onlystart) {
                                    return sp;
                                }
                                subpaths.start = sp;
                                sp = [ "M" + O(point.x), O(point.y) + "C" + O(point.n.x), O(point.n.y), O(point.end.x), O(point.end.y), O(p[5]), O(p[6]) ].join();
                                len += l;
                                x = +p[5];
                                y = +p[6];
                                continue;
                            }
                            if (!istotal && !subpath) {
                                point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                                return point;
                            }
                        }
                        len += l;
                        x = +p[5];
                        y = +p[6];
                    }
                    sp += p.shift() + p;
                }
                subpaths.end = sp;
                point = istotal ? len : subpath ? subpaths : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
                return point;
            }, null, Snap._.clone);
        }
        var getTotalLength = getLengthFactory(1), getPointAtLength = getLengthFactory(), getSubpathsAtLength = getLengthFactory(0, 1);
        function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t, t13 = pow(t1, 3), t12 = pow(t1, 2), t2 = t * t, t3 = t2 * t, x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x, y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y, mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x), my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y), nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x), ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y), ax = t1 * p1x + t * c1x, ay = t1 * p1y + t * c1y, cx = t1 * c2x + t * p2x, cy = t1 * c2y + t * p2y, alpha = 90 - math.atan2(mx - nx, my - ny) * 180 / PI;
            return {
                x: x,
                y: y,
                m: {
                    x: mx,
                    y: my
                },
                n: {
                    x: nx,
                    y: ny
                },
                start: {
                    x: ax,
                    y: ay
                },
                end: {
                    x: cx,
                    y: cy
                },
                alpha: alpha
            };
        }
        function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
            if (!Snap.is(p1x, "array")) {
                p1x = [ p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y ];
            }
            var bbox = curveDim.apply(null, p1x);
            return box(bbox.min.x, bbox.min.y, bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
        }
        function isPointInsideBBox(bbox, x, y) {
            return x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height;
        }
        function isBBoxIntersect(bbox1, bbox2) {
            bbox1 = box(bbox1);
            bbox2 = box(bbox2);
            return isPointInsideBBox(bbox2, bbox1.x, bbox1.y) || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y) || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2) || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2) || isPointInsideBBox(bbox1, bbox2.x, bbox2.y) || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y) || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2) || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2) || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x) && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
        }
        function base3(t, p1, p2, p3, p4) {
            var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4, t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
            return t * t2 - 3 * p1 + 3 * p2;
        }
        function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
            if (z == null) {
                z = 1;
            }
            z = z > 1 ? 1 : z < 0 ? 0 : z;
            var z2 = z / 2, n = 12, Tvalues = [ -.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816 ], Cvalues = [ .2491, .2491, .2335, .2335, .2032, .2032, .1601, .1601, .1069, .1069, .0472, .0472 ], sum = 0;
            for (var i = 0; i < n; i++) {
                var ct = z2 * Tvalues[i] + z2, xbase = base3(ct, x1, x2, x3, x4), ybase = base3(ct, y1, y2, y3, y4), comb = xbase * xbase + ybase * ybase;
                sum += Cvalues[i] * math.sqrt(comb);
            }
            return z2 * sum;
        }
        function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
            if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
                return;
            }
            var t = 1, step = t / 2, t2 = t - step, l, e = .01;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
            while (abs(l - ll) > e) {
                step /= 2;
                t2 += (l < ll ? 1 : -1) * step;
                l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
            }
            return t2;
        }
        function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
            if (mmax(x1, x2) < mmin(x3, x4) || mmin(x1, x2) > mmax(x3, x4) || mmax(y1, y2) < mmin(y3, y4) || mmin(y1, y2) > mmax(y3, y4)) {
                return;
            }
            var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4), ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4), denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (!denominator) {
                return;
            }
            var px = nx / denominator, py = ny / denominator, px2 = +px.toFixed(2), py2 = +py.toFixed(2);
            if (px2 < +mmin(x1, x2).toFixed(2) || px2 > +mmax(x1, x2).toFixed(2) || px2 < +mmin(x3, x4).toFixed(2) || px2 > +mmax(x3, x4).toFixed(2) || py2 < +mmin(y1, y2).toFixed(2) || py2 > +mmax(y1, y2).toFixed(2) || py2 < +mmin(y3, y4).toFixed(2) || py2 > +mmax(y3, y4).toFixed(2)) {
                return;
            }
            return {
                x: px,
                y: py
            };
        }
        function inter(bez1, bez2) {
            return interHelper(bez1, bez2);
        }
        function interCount(bez1, bez2) {
            return interHelper(bez1, bez2, 1);
        }
        function interHelper(bez1, bez2, justCount) {
            var bbox1 = bezierBBox(bez1), bbox2 = bezierBBox(bez2);
            if (!isBBoxIntersect(bbox1, bbox2)) {
                return justCount ? 0 : [];
            }
            var l1 = bezlen.apply(0, bez1), l2 = bezlen.apply(0, bez2), n1 = ~~(l1 / 8), n2 = ~~(l2 / 8), dots1 = [], dots2 = [], xy = {}, res = justCount ? 0 : [];
            for (var i = 0; i < n1 + 1; i++) {
                var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
                dots1.push({
                    x: p.x,
                    y: p.y,
                    t: i / n1
                });
            }
            for (i = 0; i < n2 + 1; i++) {
                p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
                dots2.push({
                    x: p.x,
                    y: p.y,
                    t: i / n2
                });
            }
            for (i = 0; i < n1; i++) {
                for (var j = 0; j < n2; j++) {
                    var di = dots1[i], di1 = dots1[i + 1], dj = dots2[j], dj1 = dots2[j + 1], ci = abs(di1.x - di.x) < .001 ? "y" : "x", cj = abs(dj1.x - dj.x) < .001 ? "y" : "x", is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                    if (is) {
                        if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                            continue;
                        }
                        xy[is.x.toFixed(4)] = is.y.toFixed(4);
                        var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t), t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                            if (justCount) {
                                res++;
                            } else {
                                res.push({
                                    x: is.x,
                                    y: is.y,
                                    t1: t1,
                                    t2: t2
                                });
                            }
                        }
                    }
                }
            }
            return res;
        }
        function pathIntersection(path1, path2) {
            return interPathHelper(path1, path2);
        }
        function pathIntersectionNumber(path1, path2) {
            return interPathHelper(path1, path2, 1);
        }
        function interPathHelper(path1, path2, justCount) {
            path1 = path2curve(path1);
            path2 = path2curve(path2);
            var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2, res = justCount ? 0 : [];
            for (var i = 0, ii = path1.length; i < ii; i++) {
                var pi = path1[i];
                if (pi[0] == "M") {
                    x1 = x1m = pi[1];
                    y1 = y1m = pi[2];
                } else {
                    if (pi[0] == "C") {
                        bez1 = [ x1, y1 ].concat(pi.slice(1));
                        x1 = bez1[6];
                        y1 = bez1[7];
                    } else {
                        bez1 = [ x1, y1, x1, y1, x1m, y1m, x1m, y1m ];
                        x1 = x1m;
                        y1 = y1m;
                    }
                    for (var j = 0, jj = path2.length; j < jj; j++) {
                        var pj = path2[j];
                        if (pj[0] == "M") {
                            x2 = x2m = pj[1];
                            y2 = y2m = pj[2];
                        } else {
                            if (pj[0] == "C") {
                                bez2 = [ x2, y2 ].concat(pj.slice(1));
                                x2 = bez2[6];
                                y2 = bez2[7];
                            } else {
                                bez2 = [ x2, y2, x2, y2, x2m, y2m, x2m, y2m ];
                                x2 = x2m;
                                y2 = y2m;
                            }
                            var intr = interHelper(bez1, bez2, justCount);
                            if (justCount) {
                                res += intr;
                            } else {
                                for (var k = 0, kk = intr.length; k < kk; k++) {
                                    intr[k].segment1 = i;
                                    intr[k].segment2 = j;
                                    intr[k].bez1 = bez1;
                                    intr[k].bez2 = bez2;
                                }
                                res = res.concat(intr);
                            }
                        }
                    }
                }
            }
            return res;
        }
        function isPointInsidePath(path, x, y) {
            var bbox = pathBBox(path);
            return isPointInsideBBox(bbox, x, y) && interPathHelper(path, [ [ "M", x, y ], [ "H", bbox.x2 + 10 ] ], 1) % 2 == 1;
        }
        function pathBBox(path) {
            var pth = paths(path);
            if (pth.bbox) {
                return clone(pth.bbox);
            }
            if (!path) {
                return box();
            }
            path = path2curve(path);
            var x = 0, y = 0, X = [], Y = [], p;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = p[1];
                    y = p[2];
                    X.push(x);
                    Y.push(y);
                } else {
                    var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    X = X.concat(dim.min.x, dim.max.x);
                    Y = Y.concat(dim.min.y, dim.max.y);
                    x = p[5];
                    y = p[6];
                }
            }
            var xmin = mmin.apply(0, X), ymin = mmin.apply(0, Y), xmax = mmax.apply(0, X), ymax = mmax.apply(0, Y), bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
            pth.bbox = clone(bb);
            return bb;
        }
        function rectPath(x, y, w, h, r) {
            if (r) {
                return [ [ "M", +x + +r, y ], [ "l", w - r * 2, 0 ], [ "a", r, r, 0, 0, 1, r, r ], [ "l", 0, h - r * 2 ], [ "a", r, r, 0, 0, 1, -r, r ], [ "l", r * 2 - w, 0 ], [ "a", r, r, 0, 0, 1, -r, -r ], [ "l", 0, r * 2 - h ], [ "a", r, r, 0, 0, 1, r, -r ], [ "z" ] ];
            }
            var res = [ [ "M", x, y ], [ "l", w, 0 ], [ "l", 0, h ], [ "l", -w, 0 ], [ "z" ] ];
            res.toString = toString;
            return res;
        }
        function ellipsePath(x, y, rx, ry, a) {
            if (a == null && ry == null) {
                ry = rx;
            }
            x = +x;
            y = +y;
            rx = +rx;
            ry = +ry;
            if (a != null) {
                var rad = Math.PI / 180, x1 = x + rx * Math.cos(-ry * rad), x2 = x + rx * Math.cos(-a * rad), y1 = y + rx * Math.sin(-ry * rad), y2 = y + rx * Math.sin(-a * rad), res = [ [ "M", x1, y1 ], [ "A", rx, rx, 0, +(a - ry > 180), 0, x2, y2 ] ];
            } else {
                res = [ [ "M", x, y ], [ "m", 0, -ry ], [ "a", rx, ry, 0, 1, 1, 0, 2 * ry ], [ "a", rx, ry, 0, 1, 1, 0, -2 * ry ], [ "z" ] ];
            }
            res.toString = toString;
            return res;
        }
        var unit2px = Snap._unit2px, getPath = {
            path: function(el) {
                return el.attr("path");
            },
            circle: function(el) {
                var attr = unit2px(el);
                return ellipsePath(attr.cx, attr.cy, attr.r);
            },
            ellipse: function(el) {
                var attr = unit2px(el);
                return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
            },
            rect: function(el) {
                var attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height, attr.rx, attr.ry);
            },
            image: function(el) {
                var attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
            },
            line: function(el) {
                return "M" + [ el.attr("x1") || 0, el.attr("y1") || 0, el.attr("x2"), el.attr("y2") ];
            },
            polyline: function(el) {
                return "M" + el.attr("points");
            },
            polygon: function(el) {
                return "M" + el.attr("points") + "z";
            },
            deflt: function(el) {
                var bbox = el.node.getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            }
        };
        function pathToRelative(pathArray) {
            var pth = paths(pathArray), lowerCase = String.prototype.toLowerCase;
            if (pth.rel) {
                return pathClone(pth.rel);
            }
            if (!Snap.is(pathArray, "array") || !Snap.is(pathArray && pathArray[0], "array")) {
                pathArray = Snap.parsePathString(pathArray);
            }
            var res = [], x = 0, y = 0, mx = 0, my = 0, start = 0;
            if (pathArray[0][0] == "M") {
                x = pathArray[0][1];
                y = pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res.push([ "M", x, y ]);
            }
            for (var i = start, ii = pathArray.length; i < ii; i++) {
                var r = res[i] = [], pa = pathArray[i];
                if (pa[0] != lowerCase.call(pa[0])) {
                    r[0] = lowerCase.call(pa[0]);
                    switch (r[0]) {
                      case "a":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;

                      case "v":
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;

                      case "m":
                        mx = pa[1];
                        my = pa[2];

                      default:
                        for (var j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +(pa[j] - (j % 2 ? x : y)).toFixed(3);
                        }
                    }
                } else {
                    r = res[i] = [];
                    if (pa[0] == "m") {
                        mx = pa[1] + x;
                        my = pa[2] + y;
                    }
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        res[i][k] = pa[k];
                    }
                }
                var len = res[i].length;
                switch (res[i][0]) {
                  case "z":
                    x = mx;
                    y = my;
                    break;

                  case "h":
                    x += +res[i][len - 1];
                    break;

                  case "v":
                    y += +res[i][len - 1];
                    break;

                  default:
                    x += +res[i][len - 2];
                    y += +res[i][len - 1];
                }
            }
            res.toString = toString;
            pth.rel = pathClone(res);
            return res;
        }
        function pathToAbsolute(pathArray) {
            var pth = paths(pathArray);
            if (pth.abs) {
                return pathClone(pth.abs);
            }
            if (!is(pathArray, "array") || !is(pathArray && pathArray[0], "array")) {
                pathArray = Snap.parsePathString(pathArray);
            }
            if (!pathArray || !pathArray.length) {
                return [ [ "M", 0, 0 ] ];
            }
            var res = [], x = 0, y = 0, mx = 0, my = 0, start = 0, pa0;
            if (pathArray[0][0] == "M") {
                x = +pathArray[0][1];
                y = +pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res[0] = [ "M", x, y ];
            }
            var crz = pathArray.length == 3 && pathArray[0][0] == "M" && pathArray[1][0].toUpperCase() == "R" && pathArray[2][0].toUpperCase() == "Z";
            for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
                res.push(r = []);
                pa = pathArray[i];
                pa0 = pa[0];
                if (pa0 != pa0.toUpperCase()) {
                    r[0] = pa0.toUpperCase();
                    switch (r[0]) {
                      case "A":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +pa[6] + x;
                        r[7] = +pa[7] + y;
                        break;

                      case "V":
                        r[1] = +pa[1] + y;
                        break;

                      case "H":
                        r[1] = +pa[1] + x;
                        break;

                      case "R":
                        var dots = [ x, y ].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;

                      case "O":
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;

                      case "U":
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = [ "U" ].concat(res[res.length - 1].slice(-2));
                        break;

                      case "M":
                        mx = +pa[1] + x;
                        my = +pa[2] + y;

                      default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + (j % 2 ? x : y);
                        }
                    }
                } else if (pa0 == "R") {
                    dots = [ x, y ].concat(pa.slice(1));
                    res.pop();
                    res = res.concat(catmullRom2bezier(dots, crz));
                    r = [ "R" ].concat(pa.slice(-2));
                } else if (pa0 == "O") {
                    res.pop();
                    dots = ellipsePath(x, y, pa[1], pa[2]);
                    dots.push(dots[0]);
                    res = res.concat(dots);
                } else if (pa0 == "U") {
                    res.pop();
                    res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                    r = [ "U" ].concat(res[res.length - 1].slice(-2));
                } else {
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        r[k] = pa[k];
                    }
                }
                pa0 = pa0.toUpperCase();
                if (pa0 != "O") {
                    switch (r[0]) {
                      case "Z":
                        x = +mx;
                        y = +my;
                        break;

                      case "H":
                        x = r[1];
                        break;

                      case "V":
                        y = r[1];
                        break;

                      case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];

                      default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                    }
                }
            }
            res.toString = toString;
            pth.abs = pathClone(res);
            return res;
        }
        function l2c(x1, y1, x2, y2) {
            return [ x1, y1, x2, y2, x2, y2 ];
        }
        function q2c(x1, y1, ax, ay, x2, y2) {
            var _13 = 1 / 3, _23 = 2 / 3;
            return [ _13 * x1 + _23 * ax, _13 * y1 + _23 * ay, _13 * x2 + _23 * ax, _13 * y2 + _23 * ay, x2, y2 ];
        }
        function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
            var _120 = PI * 120 / 180, rad = PI / 180 * (+angle || 0), res = [], xy, rotate = Snap._.cacher(function(x, y, rad) {
                var X = x * math.cos(rad) - y * math.sin(rad), Y = x * math.sin(rad) + y * math.cos(rad);
                return {
                    x: X,
                    y: Y
                };
            });
            if (!recursive) {
                xy = rotate(x1, y1, -rad);
                x1 = xy.x;
                y1 = xy.y;
                xy = rotate(x2, y2, -rad);
                x2 = xy.x;
                y2 = xy.y;
                var cos = math.cos(PI / 180 * angle), sin = math.sin(PI / 180 * angle), x = (x1 - x2) / 2, y = (y1 - y2) / 2;
                var h = x * x / (rx * rx) + y * y / (ry * ry);
                if (h > 1) {
                    h = math.sqrt(h);
                    rx = h * rx;
                    ry = h * ry;
                }
                var rx2 = rx * rx, ry2 = ry * ry, k = (large_arc_flag == sweep_flag ? -1 : 1) * math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))), cx = k * rx * y / ry + (x1 + x2) / 2, cy = k * -ry * x / rx + (y1 + y2) / 2, f1 = math.asin(((y1 - cy) / ry).toFixed(9)), f2 = math.asin(((y2 - cy) / ry).toFixed(9));
                f1 = x1 < cx ? PI - f1 : f1;
                f2 = x2 < cx ? PI - f2 : f2;
                f1 < 0 && (f1 = PI * 2 + f1);
                f2 < 0 && (f2 = PI * 2 + f2);
                if (sweep_flag && f1 > f2) {
                    f1 = f1 - PI * 2;
                }
                if (!sweep_flag && f2 > f1) {
                    f2 = f2 - PI * 2;
                }
            } else {
                f1 = recursive[0];
                f2 = recursive[1];
                cx = recursive[2];
                cy = recursive[3];
            }
            var df = f2 - f1;
            if (abs(df) > _120) {
                var f2old = f2, x2old = x2, y2old = y2;
                f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
                x2 = cx + rx * math.cos(f2);
                y2 = cy + ry * math.sin(f2);
                res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [ f2, f2old, cx, cy ]);
            }
            df = f2 - f1;
            var c1 = math.cos(f1), s1 = math.sin(f1), c2 = math.cos(f2), s2 = math.sin(f2), t = math.tan(df / 4), hx = 4 / 3 * rx * t, hy = 4 / 3 * ry * t, m1 = [ x1, y1 ], m2 = [ x1 + hx * s1, y1 - hy * c1 ], m3 = [ x2 + hx * s2, y2 - hy * c2 ], m4 = [ x2, y2 ];
            m2[0] = 2 * m1[0] - m2[0];
            m2[1] = 2 * m1[1] - m2[1];
            if (recursive) {
                return [ m2, m3, m4 ].concat(res);
            } else {
                res = [ m2, m3, m4 ].concat(res).join().split(",");
                var newres = [];
                for (var i = 0, ii = res.length; i < ii; i++) {
                    newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
                }
                return newres;
            }
        }
        function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t;
            return {
                x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
                y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
            };
        }
        function curveDim(x0, y0, x1, y1, x2, y2, x3, y3) {
            var tvalues = [], bounds = [ [], [] ], a, b, c, t, t1, t2, b2ac, sqrtb2ac;
            for (var i = 0; i < 2; ++i) {
                if (i == 0) {
                    b = 6 * x0 - 12 * x1 + 6 * x2;
                    a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                    c = 3 * x1 - 3 * x0;
                } else {
                    b = 6 * y0 - 12 * y1 + 6 * y2;
                    a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                    c = 3 * y1 - 3 * y0;
                }
                if (abs(a) < 1e-12) {
                    if (abs(b) < 1e-12) {
                        continue;
                    }
                    t = -c / b;
                    if (0 < t && t < 1) {
                        tvalues.push(t);
                    }
                    continue;
                }
                b2ac = b * b - 4 * c * a;
                sqrtb2ac = math.sqrt(b2ac);
                if (b2ac < 0) {
                    continue;
                }
                t1 = (-b + sqrtb2ac) / (2 * a);
                if (0 < t1 && t1 < 1) {
                    tvalues.push(t1);
                }
                t2 = (-b - sqrtb2ac) / (2 * a);
                if (0 < t2 && t2 < 1) {
                    tvalues.push(t2);
                }
            }
            var x, y, j = tvalues.length, jlen = j, mt;
            while (j--) {
                t = tvalues[j];
                mt = 1 - t;
                bounds[0][j] = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
                bounds[1][j] = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
            }
            bounds[0][jlen] = x0;
            bounds[1][jlen] = y0;
            bounds[0][jlen + 1] = x3;
            bounds[1][jlen + 1] = y3;
            bounds[0].length = bounds[1].length = jlen + 2;
            return {
                min: {
                    x: mmin.apply(0, bounds[0]),
                    y: mmin.apply(0, bounds[1])
                },
                max: {
                    x: mmax.apply(0, bounds[0]),
                    y: mmax.apply(0, bounds[1])
                }
            };
        }
        function path2curve(path, path2) {
            var pth = !path2 && paths(path);
            if (!path2 && pth.curve) {
                return pathClone(pth.curve);
            }
            var p = pathToAbsolute(path), p2 = path2 && pathToAbsolute(path2), attrs = {
                x: 0,
                y: 0,
                bx: 0,
                by: 0,
                X: 0,
                Y: 0,
                qx: null,
                qy: null
            }, attrs2 = {
                x: 0,
                y: 0,
                bx: 0,
                by: 0,
                X: 0,
                Y: 0,
                qx: null,
                qy: null
            }, processPath = function(path, d, pcom) {
                var nx, ny;
                if (!path) {
                    return [ "C", d.x, d.y, d.x, d.y, d.x, d.y ];
                }
                !(path[0] in {
                    T: 1,
                    Q: 1
                }) && (d.qx = d.qy = null);
                switch (path[0]) {
                  case "M":
                    d.X = path[1];
                    d.Y = path[2];
                    break;

                  case "A":
                    path = [ "C" ].concat(a2c.apply(0, [ d.x, d.y ].concat(path.slice(1))));
                    break;

                  case "S":
                    if (pcom == "C" || pcom == "S") {
                        nx = d.x * 2 - d.bx;
                        ny = d.y * 2 - d.by;
                    } else {
                        nx = d.x;
                        ny = d.y;
                    }
                    path = [ "C", nx, ny ].concat(path.slice(1));
                    break;

                  case "T":
                    if (pcom == "Q" || pcom == "T") {
                        d.qx = d.x * 2 - d.qx;
                        d.qy = d.y * 2 - d.qy;
                    } else {
                        d.qx = d.x;
                        d.qy = d.y;
                    }
                    path = [ "C" ].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                    break;

                  case "Q":
                    d.qx = path[1];
                    d.qy = path[2];
                    path = [ "C" ].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                    break;

                  case "L":
                    path = [ "C" ].concat(l2c(d.x, d.y, path[1], path[2]));
                    break;

                  case "H":
                    path = [ "C" ].concat(l2c(d.x, d.y, path[1], d.y));
                    break;

                  case "V":
                    path = [ "C" ].concat(l2c(d.x, d.y, d.x, path[1]));
                    break;

                  case "Z":
                    path = [ "C" ].concat(l2c(d.x, d.y, d.X, d.Y));
                    break;
                }
                return path;
            }, fixArc = function(pp, i) {
                if (pp[i].length > 7) {
                    pp[i].shift();
                    var pi = pp[i];
                    while (pi.length) {
                        pcoms1[i] = "A";
                        p2 && (pcoms2[i] = "A");
                        pp.splice(i++, 0, [ "C" ].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            }, fixM = function(path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                    path2.splice(i, 0, [ "M", a2.x, a2.y ]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = path1[i][1];
                    a1.y = path1[i][2];
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            }, pcoms1 = [], pcoms2 = [], pfirst = "", pcom = "";
            for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
                p[i] && (pfirst = p[i][0]);
                if (pfirst != "C") {
                    pcoms1[i] = pfirst;
                    i && (pcom = pcoms1[i - 1]);
                }
                p[i] = processPath(p[i], attrs, pcom);
                if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C";
                fixArc(p, i);
                if (p2) {
                    p2[i] && (pfirst = p2[i][0]);
                    if (pfirst != "C") {
                        pcoms2[i] = pfirst;
                        i && (pcom = pcoms2[i - 1]);
                    }
                    p2[i] = processPath(p2[i], attrs2, pcom);
                    if (pcoms2[i] != "A" && pfirst == "C") {
                        pcoms2[i] = "C";
                    }
                    fixArc(p2, i);
                }
                fixM(p, p2, attrs, attrs2, i);
                fixM(p2, p, attrs2, attrs, i);
                var seg = p[i], seg2 = p2 && p2[i], seglen = seg.length, seg2len = p2 && seg2.length;
                attrs.x = seg[seglen - 2];
                attrs.y = seg[seglen - 1];
                attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
                attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
                attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
                attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
                attrs2.x = p2 && seg2[seg2len - 2];
                attrs2.y = p2 && seg2[seg2len - 1];
            }
            if (!p2) {
                pth.curve = pathClone(p);
            }
            return p2 ? [ p, p2 ] : p;
        }
        function mapPath(path, matrix) {
            if (!matrix) {
                return path;
            }
            var x, y, i, j, ii, jj, pathi;
            path = path2curve(path);
            for (i = 0, ii = path.length; i < ii; i++) {
                pathi = path[i];
                for (j = 1, jj = pathi.length; j < jj; j += 2) {
                    x = matrix.x(pathi[j], pathi[j + 1]);
                    y = matrix.y(pathi[j], pathi[j + 1]);
                    pathi[j] = x;
                    pathi[j + 1] = y;
                }
            }
            return path;
        }
        function catmullRom2bezier(crp, z) {
            var d = [];
            for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
                var p = [ {
                    x: +crp[i - 2],
                    y: +crp[i - 1]
                }, {
                    x: +crp[i],
                    y: +crp[i + 1]
                }, {
                    x: +crp[i + 2],
                    y: +crp[i + 3]
                }, {
                    x: +crp[i + 4],
                    y: +crp[i + 5]
                } ];
                if (z) {
                    if (!i) {
                        p[0] = {
                            x: +crp[iLen - 2],
                            y: +crp[iLen - 1]
                        };
                    } else if (iLen - 4 == i) {
                        p[3] = {
                            x: +crp[0],
                            y: +crp[1]
                        };
                    } else if (iLen - 2 == i) {
                        p[2] = {
                            x: +crp[0],
                            y: +crp[1]
                        };
                        p[3] = {
                            x: +crp[2],
                            y: +crp[3]
                        };
                    }
                } else {
                    if (iLen - 4 == i) {
                        p[3] = p[2];
                    } else if (!i) {
                        p[0] = {
                            x: +crp[i],
                            y: +crp[i + 1]
                        };
                    }
                }
                d.push([ "C", (-p[0].x + 6 * p[1].x + p[2].x) / 6, (-p[0].y + 6 * p[1].y + p[2].y) / 6, (p[1].x + 6 * p[2].x - p[3].x) / 6, (p[1].y + 6 * p[2].y - p[3].y) / 6, p[2].x, p[2].y ]);
            }
            return d;
        }
        Snap.path = paths;
        Snap.path.getTotalLength = getTotalLength;
        Snap.path.getPointAtLength = getPointAtLength;
        Snap.path.getSubpath = function(path, from, to) {
            if (this.getTotalLength(path) - to < 1e-6) {
                return getSubpathsAtLength(path, from).end;
            }
            var a = getSubpathsAtLength(path, to, 1);
            return from ? getSubpathsAtLength(a, from).end : a;
        };
        elproto.getTotalLength = function() {
            if (this.node.getTotalLength) {
                return this.node.getTotalLength();
            }
        };
        elproto.getPointAtLength = function(length) {
            return getPointAtLength(this.attr("d"), length);
        };
        elproto.getSubpath = function(from, to) {
            return Snap.path.getSubpath(this.attr("d"), from, to);
        };
        Snap._.box = box;
        Snap.path.findDotsAtSegment = findDotsAtSegment;
        Snap.path.bezierBBox = bezierBBox;
        Snap.path.isPointInsideBBox = isPointInsideBBox;
        Snap.closest = function(x, y, X, Y) {
            var r = 100, b = box(x - r / 2, y - r / 2, r, r), inside = [], getter = X[0].hasOwnProperty("x") ? function(i) {
                return {
                    x: X[i].x,
                    y: X[i].y
                };
            } : function(i) {
                return {
                    x: X[i],
                    y: Y[i]
                };
            }, found = 0;
            while (r <= 1e6 && !found) {
                for (var i = 0, ii = X.length; i < ii; i++) {
                    var xy = getter(i);
                    if (isPointInsideBBox(b, xy.x, xy.y)) {
                        found++;
                        inside.push(xy);
                        break;
                    }
                }
                if (!found) {
                    r *= 2;
                    b = box(x - r / 2, y - r / 2, r, r);
                }
            }
            if (r == 1e6) {
                return;
            }
            var len = Infinity, res;
            for (i = 0, ii = inside.length; i < ii; i++) {
                var l = Snap.len(x, y, inside[i].x, inside[i].y);
                if (len > l) {
                    len = l;
                    inside[i].len = l;
                    res = inside[i];
                }
            }
            return res;
        };
        Snap.path.isBBoxIntersect = isBBoxIntersect;
        Snap.path.intersection = pathIntersection;
        Snap.path.intersectionNumber = pathIntersectionNumber;
        Snap.path.isPointInside = isPointInsidePath;
        Snap.path.getBBox = pathBBox;
        Snap.path.get = getPath;
        Snap.path.toRelative = pathToRelative;
        Snap.path.toAbsolute = pathToAbsolute;
        Snap.path.toCubic = path2curve;
        Snap.path.map = mapPath;
        Snap.path.toString = toString;
        Snap.path.clone = pathClone;
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var mmax = Math.max, mmin = Math.min;
        var Set = function(items) {
            this.items = [];
            this.bindings = {};
            this.length = 0;
            this.type = "set";
            if (items) {
                for (var i = 0, ii = items.length; i < ii; i++) {
                    if (items[i]) {
                        this[this.items.length] = this.items[this.items.length] = items[i];
                        this.length++;
                    }
                }
            }
        }, setproto = Set.prototype;
        setproto.push = function() {
            var item, len;
            for (var i = 0, ii = arguments.length; i < ii; i++) {
                item = arguments[i];
                if (item) {
                    len = this.items.length;
                    this[len] = this.items[len] = item;
                    this.length++;
                }
            }
            return this;
        };
        setproto.pop = function() {
            this.length && delete this[this.length--];
            return this.items.pop();
        };
        setproto.forEach = function(callback, thisArg) {
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                if (callback.call(thisArg, this.items[i], i) === false) {
                    return this;
                }
            }
            return this;
        };
        setproto.animate = function(attrs, ms, easing, callback) {
            if (typeof easing == "function" && !easing.length) {
                callback = easing;
                easing = mina.linear;
            }
            if (attrs instanceof Snap._.Animation) {
                callback = attrs.callback;
                easing = attrs.easing;
                ms = easing.dur;
                attrs = attrs.attr;
            }
            var args = arguments;
            if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
                var each = true;
            }
            var begin, handler = function() {
                if (begin) {
                    this.b = begin;
                } else {
                    begin = this.b;
                }
            }, cb = 0, set = this, callbacker = callback && function() {
                if (++cb == set.length) {
                    callback.call(this);
                }
            };
            return this.forEach(function(el, i) {
                eve.once("snap.animcreated." + el.id, handler);
                if (each) {
                    args[i] && el.animate.apply(el, args[i]);
                } else {
                    el.animate(attrs, ms, easing, callbacker);
                }
            });
        };
        setproto.remove = function() {
            while (this.length) {
                this.pop().remove();
            }
            return this;
        };
        setproto.bind = function(attr, a, b) {
            var data = {};
            if (typeof a == "function") {
                this.bindings[attr] = a;
            } else {
                var aname = b || attr;
                this.bindings[attr] = function(v) {
                    data[aname] = v;
                    a.attr(data);
                };
            }
            return this;
        };
        setproto.attr = function(value) {
            var unbound = {};
            for (var k in value) {
                if (this.bindings[k]) {
                    this.bindings[k](value[k]);
                } else {
                    unbound[k] = value[k];
                }
            }
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                this.items[i].attr(unbound);
            }
            return this;
        };
        setproto.clear = function() {
            while (this.length) {
                this.pop();
            }
        };
        setproto.splice = function(index, count, insertion) {
            index = index < 0 ? mmax(this.length + index, 0) : index;
            count = mmax(0, mmin(this.length - index, count));
            var tail = [], todel = [], args = [], i;
            for (i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            for (i = 0; i < count; i++) {
                todel.push(this[index + i]);
            }
            for (;i < this.length - index; i++) {
                tail.push(this[index + i]);
            }
            var arglen = args.length;
            for (i = 0; i < arglen + tail.length; i++) {
                this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
            }
            i = this.items.length = this.length -= count - arglen;
            while (this[i]) {
                delete this[i++];
            }
            return new Set(todel);
        };
        setproto.exclude = function(el) {
            for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
                this.splice(i, 1);
                return true;
            }
            return false;
        };
        setproto.insertAfter = function(el) {
            var i = this.items.length;
            while (i--) {
                this.items[i].insertAfter(el);
            }
            return this;
        };
        setproto.getBBox = function() {
            var x = [], y = [], x2 = [], y2 = [];
            for (var i = this.items.length; i--; ) if (!this.items[i].removed) {
                var box = this.items[i].getBBox();
                x.push(box.x);
                y.push(box.y);
                x2.push(box.x + box.width);
                y2.push(box.y + box.height);
            }
            x = mmin.apply(0, x);
            y = mmin.apply(0, y);
            x2 = mmax.apply(0, x2);
            y2 = mmax.apply(0, y2);
            return {
                x: x,
                y: y,
                x2: x2,
                y2: y2,
                width: x2 - x,
                height: y2 - y,
                cx: x + (x2 - x) / 2,
                cy: y + (y2 - y) / 2
            };
        };
        setproto.clone = function(s) {
            s = new Set();
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                s.push(this.items[i].clone());
            }
            return s;
        };
        setproto.toString = function() {
            return "Snap‘s set";
        };
        setproto.type = "set";
        Snap.Set = Set;
        Snap.set = function() {
            var set = new Set();
            if (arguments.length) {
                set.push.apply(set, Array.prototype.slice.call(arguments, 0));
            }
            return set;
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var names = {}, reUnit = /[a-z]+$/i, Str = String;
        names.stroke = names.fill = "colour";
        function getEmpty(item) {
            var l = item[0];
            switch (l.toLowerCase()) {
              case "t":
                return [ l, 0, 0 ];

              case "m":
                return [ l, 1, 0, 0, 1, 0, 0 ];

              case "r":
                if (item.length == 4) {
                    return [ l, 0, item[2], item[3] ];
                } else {
                    return [ l, 0 ];
                }

              case "s":
                if (item.length == 5) {
                    return [ l, 1, 1, item[3], item[4] ];
                } else if (item.length == 3) {
                    return [ l, 1, 1 ];
                } else {
                    return [ l, 1 ];
                }
            }
        }
        function equaliseTransform(t1, t2, getBBox) {
            t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
            t1 = Snap.parseTransformString(t1) || [];
            t2 = Snap.parseTransformString(t2) || [];
            var maxlength = Math.max(t1.length, t2.length), from = [], to = [], i = 0, j, jj, tt1, tt2;
            for (;i < maxlength; i++) {
                tt1 = t1[i] || getEmpty(t2[i]);
                tt2 = t2[i] || getEmpty(tt1);
                if (tt1[0] != tt2[0] || tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3]) || tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4])) {
                    t1 = Snap._.transform2matrix(t1, getBBox());
                    t2 = Snap._.transform2matrix(t2, getBBox());
                    from = [ [ "m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f ] ];
                    to = [ [ "m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f ] ];
                    break;
                }
                from[i] = [];
                to[i] = [];
                for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                    j in tt1 && (from[i][j] = tt1[j]);
                    j in tt2 && (to[i][j] = tt2[j]);
                }
            }
            return {
                from: path2array(from),
                to: path2array(to),
                f: getPath(from)
            };
        }
        function getNumber(val) {
            return val;
        }
        function getUnit(unit) {
            return function(val) {
                return +val.toFixed(3) + unit;
            };
        }
        function getViewBox(val) {
            return val.join(" ");
        }
        function getColour(clr) {
            return Snap.rgb(clr[0], clr[1], clr[2]);
        }
        function getPath(path) {
            var k = 0, i, ii, j, jj, out, a, b = [];
            for (i = 0, ii = path.length; i < ii; i++) {
                out = "[";
                a = [ '"' + path[i][0] + '"' ];
                for (j = 1, jj = path[i].length; j < jj; j++) {
                    a[j] = "val[" + k++ + "]";
                }
                out += a + "]";
                b[i] = out;
            }
            return Function("val", "return Snap.path.toString.call([" + b + "])");
        }
        function path2array(path) {
            var out = [];
            for (var i = 0, ii = path.length; i < ii; i++) {
                for (var j = 1, jj = path[i].length; j < jj; j++) {
                    out.push(path[i][j]);
                }
            }
            return out;
        }
        function isNumeric(obj) {
            return isFinite(parseFloat(obj));
        }
        function arrayEqual(arr1, arr2) {
            if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
                return false;
            }
            return arr1.toString() == arr2.toString();
        }
        Element.prototype.equal = function(name, b) {
            return eve("snap.util.equal", this, name, b).firstDefined();
        };
        eve.on("snap.util.equal", function(name, b) {
            var A, B, a = Str(this.attr(name) || ""), el = this;
            if (isNumeric(a) && isNumeric(b)) {
                return {
                    from: parseFloat(a),
                    to: parseFloat(b),
                    f: getNumber
                };
            }
            if (names[name] == "colour") {
                A = Snap.color(a);
                B = Snap.color(b);
                return {
                    from: [ A.r, A.g, A.b, A.opacity ],
                    to: [ B.r, B.g, B.b, B.opacity ],
                    f: getColour
                };
            }
            if (name == "viewBox") {
                A = this.attr(name).vb.split(" ").map(Number);
                B = b.split(" ").map(Number);
                return {
                    from: A,
                    to: B,
                    f: getViewBox
                };
            }
            if (name == "transform" || name == "gradientTransform" || name == "patternTransform") {
                if (b instanceof Snap.Matrix) {
                    b = b.toTransformString();
                }
                if (!Snap._.rgTransform.test(b)) {
                    b = Snap._.svgTransform2string(b);
                }
                return equaliseTransform(a, b, function() {
                    return el.getBBox(1);
                });
            }
            if (name == "d" || name == "path") {
                A = Snap.path.toCubic(a, b);
                return {
                    from: path2array(A[0]),
                    to: path2array(A[1]),
                    f: getPath(A[0])
                };
            }
            if (name == "points") {
                A = Str(a).split(Snap._.separator);
                B = Str(b).split(Snap._.separator);
                return {
                    from: A,
                    to: B,
                    f: function(val) {
                        return val;
                    }
                };
            }
            var aUnit = a.match(reUnit), bUnit = Str(b).match(reUnit);
            if (aUnit && arrayEqual(aUnit, bUnit)) {
                return {
                    from: parseFloat(a),
                    to: parseFloat(b),
                    f: getUnit(aUnit)
                };
            } else {
                return {
                    from: this.asPX(name),
                    to: this.asPX(name, b),
                    f: getNumber
                };
            }
        });
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var elproto = Element.prototype, has = "hasOwnProperty", supportsTouch = "createTouch" in glob.doc, events = [ "click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "touchstart", "touchmove", "touchend", "touchcancel" ], touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        }, getScroll = function(xy, el) {
            var name = xy == "y" ? "scrollTop" : "scrollLeft", doc = el && el.node ? el.node.ownerDocument : glob.doc;
            return doc[name in doc.documentElement ? "documentElement" : "body"][name];
        }, preventDefault = function() {
            this.returnValue = false;
        }, preventTouch = function() {
            return this.originalEvent.preventDefault();
        }, stopPropagation = function() {
            this.cancelBubble = true;
        }, stopTouch = function() {
            return this.originalEvent.stopPropagation();
        }, addEvent = function(obj, type, fn, element) {
            var realName = supportsTouch && touchMap[type] ? touchMap[type] : type, f = function(e) {
                var scrollY = getScroll("y", element), scrollX = getScroll("x", element);
                if (supportsTouch && touchMap[has](type)) {
                    for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                        if (e.targetTouches[i].target == obj || obj.contains(e.targetTouches[i].target)) {
                            var olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                }
                var x = e.clientX + scrollX, y = e.clientY + scrollY;
                return fn.call(element, e, x, y);
            };
            if (type !== realName) {
                obj.addEventListener(type, f, false);
            }
            obj.addEventListener(realName, f, false);
            return function() {
                if (type !== realName) {
                    obj.removeEventListener(type, f, false);
                }
                obj.removeEventListener(realName, f, false);
                return true;
            };
        }, drag = [], dragMove = function(e) {
            var x = e.clientX, y = e.clientY, scrollY = getScroll("y"), scrollX = getScroll("x"), dragi, j = drag.length;
            while (j--) {
                dragi = drag[j];
                if (supportsTouch) {
                    var i = e.touches && e.touches.length, touch;
                    while (i--) {
                        touch = e.touches[i];
                        if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
                            x = touch.clientX;
                            y = touch.clientY;
                            (e.originalEvent ? e.originalEvent : e).preventDefault();
                            break;
                        }
                    }
                } else {
                    e.preventDefault();
                }
                var node = dragi.el.node, o, next = node.nextSibling, parent = node.parentNode, display = node.style.display;
                x += scrollX;
                y += scrollY;
                eve("snap.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
            }
        }, dragUp = function(e) {
            Snap.unmousemove(dragMove).unmouseup(dragUp);
            var i = drag.length, dragi;
            while (i--) {
                dragi = drag[i];
                dragi.el._drag = {};
                eve("snap.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
                eve.off("snap.drag.*." + dragi.el.id);
            }
            drag = [];
        };
        for (var i = events.length; i--; ) {
            (function(eventName) {
                Snap[eventName] = elproto[eventName] = function(fn, scope) {
                    if (Snap.is(fn, "function")) {
                        this.events = this.events || [];
                        this.events.push({
                            name: eventName,
                            f: fn,
                            unbind: addEvent(this.node || document, eventName, fn, scope || this)
                        });
                    } else {
                        for (var i = 0, ii = this.events.length; i < ii; i++) if (this.events[i].name == eventName) {
                            try {
                                this.events[i].f.call(this);
                            } catch (e) {}
                        }
                    }
                    return this;
                };
                Snap["un" + eventName] = elproto["un" + eventName] = function(fn) {
                    var events = this.events || [], l = events.length;
                    while (l--) if (events[l].name == eventName && (events[l].f == fn || !fn)) {
                        events[l].unbind();
                        events.splice(l, 1);
                        !events.length && delete this.events;
                        return this;
                    }
                    return this;
                };
            })(events[i]);
        }
        elproto.hover = function(f_in, f_out, scope_in, scope_out) {
            return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
        };
        elproto.unhover = function(f_in, f_out) {
            return this.unmouseover(f_in).unmouseout(f_out);
        };
        var draggable = [];
        elproto.drag = function(onmove, onstart, onend, move_scope, start_scope, end_scope) {
            var el = this;
            if (!arguments.length) {
                var origTransform;
                return el.drag(function(dx, dy) {
                    this.attr({
                        transform: origTransform + (origTransform ? "T" : "t") + [ dx, dy ]
                    });
                }, function() {
                    origTransform = this.transform().local;
                });
            }
            function start(e, x, y) {
                (e.originalEvent || e).preventDefault();
                el._drag.x = x;
                el._drag.y = y;
                el._drag.id = e.identifier;
                !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
                drag.push({
                    el: el,
                    move_scope: move_scope,
                    start_scope: start_scope,
                    end_scope: end_scope
                });
                onstart && eve.on("snap.drag.start." + el.id, onstart);
                onmove && eve.on("snap.drag.move." + el.id, onmove);
                onend && eve.on("snap.drag.end." + el.id, onend);
                eve("snap.drag.start." + el.id, start_scope || move_scope || el, x, y, e);
            }
            function init(e, x, y) {
                eve("snap.draginit." + el.id, el, e, x, y);
            }
            eve.on("snap.draginit." + el.id, start);
            el._drag = {};
            draggable.push({
                el: el,
                start: start,
                init: init
            });
            el.mousedown(init);
            return el;
        };
        elproto.undrag = function() {
            var i = draggable.length;
            while (i--) if (draggable[i].el == this) {
                this.unmousedown(draggable[i].init);
                draggable.splice(i, 1);
                eve.unbind("snap.drag.*." + this.id);
                eve.unbind("snap.draginit." + this.id);
            }
            !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
            return this;
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var elproto = Element.prototype, pproto = Paper.prototype, rgurl = /^\s*url\((.+)\)/, Str = String, $ = Snap._.$;
        Snap.filter = {};
        pproto.filter = function(filstr) {
            var paper = this;
            if (paper.type != "svg") {
                paper = paper.paper;
            }
            var f = Snap.parse(Str(filstr)), id = Snap._.id(), width = paper.node.offsetWidth, height = paper.node.offsetHeight, filter = $("filter");
            $(filter, {
                id: id,
                filterUnits: "userSpaceOnUse"
            });
            filter.appendChild(f.node);
            paper.defs.appendChild(filter);
            return new Element(filter);
        };
        eve.on("snap.util.getattr.filter", function() {
            eve.stop();
            var p = $(this.node, "filter");
            if (p) {
                var match = Str(p).match(rgurl);
                return match && Snap.select(match[1]);
            }
        });
        eve.on("snap.util.attr.filter", function(value) {
            if (value instanceof Element && value.type == "filter") {
                eve.stop();
                var id = value.node.id;
                if (!id) {
                    $(value.node, {
                        id: value.id
                    });
                    id = value.id;
                }
                $(this.node, {
                    filter: Snap.url(id)
                });
            }
            if (!value || value == "none") {
                eve.stop();
                this.node.removeAttribute("filter");
            }
        });
        Snap.filter.blur = function(x, y) {
            if (x == null) {
                x = 2;
            }
            var def = y == null ? x : [ x, y ];
            return Snap.format('<feGaussianBlur stdDeviation="{def}"/>', {
                def: def
            });
        };
        Snap.filter.blur.toString = function() {
            return this();
        };
        Snap.filter.shadow = function(dx, dy, blur, color, opacity) {
            if (typeof blur == "string") {
                color = blur;
                opacity = color;
                blur = 4;
            }
            if (typeof color != "string") {
                opacity = color;
                color = "#000";
            }
            color = color || "#000";
            if (blur == null) {
                blur = 4;
            }
            if (opacity == null) {
                opacity = 1;
            }
            if (dx == null) {
                dx = 0;
                dy = 2;
            }
            if (dy == null) {
                dy = dx;
            }
            color = Snap.color(color);
            return Snap.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
                color: color,
                dx: dx,
                dy: dy,
                blur: blur,
                opacity: opacity
            });
        };
        Snap.filter.shadow.toString = function() {
            return this();
        };
        Snap.filter.grayscale = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
                a: .2126 + .7874 * (1 - amount),
                b: .7152 - .7152 * (1 - amount),
                c: .0722 - .0722 * (1 - amount),
                d: .2126 - .2126 * (1 - amount),
                e: .7152 + .2848 * (1 - amount),
                f: .0722 - .0722 * (1 - amount),
                g: .2126 - .2126 * (1 - amount),
                h: .0722 + .9278 * (1 - amount)
            });
        };
        Snap.filter.grayscale.toString = function() {
            return this();
        };
        Snap.filter.sepia = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
                a: .393 + .607 * (1 - amount),
                b: .769 - .769 * (1 - amount),
                c: .189 - .189 * (1 - amount),
                d: .349 - .349 * (1 - amount),
                e: .686 + .314 * (1 - amount),
                f: .168 - .168 * (1 - amount),
                g: .272 - .272 * (1 - amount),
                h: .534 - .534 * (1 - amount),
                i: .131 + .869 * (1 - amount)
            });
        };
        Snap.filter.sepia.toString = function() {
            return this();
        };
        Snap.filter.saturate = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
                amount: 1 - amount
            });
        };
        Snap.filter.saturate.toString = function() {
            return this();
        };
        Snap.filter.hueRotate = function(angle) {
            angle = angle || 0;
            return Snap.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
                angle: angle
            });
        };
        Snap.filter.hueRotate.toString = function() {
            return this();
        };
        Snap.filter.invert = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
                amount: amount,
                amount2: 1 - amount
            });
        };
        Snap.filter.invert.toString = function() {
            return this();
        };
        Snap.filter.brightness = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
                amount: amount
            });
        };
        Snap.filter.brightness.toString = function() {
            return this();
        };
        Snap.filter.contrast = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
                amount: amount,
                amount2: .5 - amount / 2
            });
        };
        Snap.filter.contrast.toString = function() {
            return this();
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob, Fragment) {
        var box = Snap._.box, is = Snap.is, firstLetter = /^[^a-z]*([tbmlrc])/i, toString = function() {
            return "T" + this.dx + "," + this.dy;
        };
        Element.prototype.getAlign = function(el, way) {
            if (way == null && is(el, "string")) {
                way = el;
                el = null;
            }
            el = el || this.paper;
            var bx = el.getBBox ? el.getBBox() : box(el), bb = this.getBBox(), out = {};
            way = way && way.match(firstLetter);
            way = way ? way[1].toLowerCase() : "c";
            switch (way) {
              case "t":
                out.dx = 0;
                out.dy = bx.y - bb.y;
                break;

              case "b":
                out.dx = 0;
                out.dy = bx.y2 - bb.y2;
                break;

              case "m":
                out.dx = 0;
                out.dy = bx.cy - bb.cy;
                break;

              case "l":
                out.dx = bx.x - bb.x;
                out.dy = 0;
                break;

              case "r":
                out.dx = bx.x2 - bb.x2;
                out.dy = 0;
                break;

              default:
                out.dx = bx.cx - bb.cx;
                out.dy = 0;
                break;
            }
            out.toString = toString;
            return out;
        };
        Element.prototype.align = function(el, way) {
            return this.transform("..." + this.getAlign(el, way));
        };
    });
    return Snap;
});

(function(define) {
    define([ "jquery" ], function($) {
        return function() {
            var $container;
            var listener;
            var toastId = 0;
            var toastType = {
                error: "error",
                info: "info",
                success: "success",
                warning: "warning"
            };
            var toastr = {
                clear: clear,
                remove: remove,
                error: error,
                getContainer: getContainer,
                info: info,
                options: {},
                subscribe: subscribe,
                success: success,
                version: "2.1.2",
                warning: warning
            };
            var previousToast;
            return toastr;
            function error(message, title, optionsOverride) {
                return notify({
                    type: toastType.error,
                    iconClass: getOptions().iconClasses.error,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function getContainer(options, create) {
                if (!options) {
                    options = getOptions();
                }
                $container = $("#" + options.containerId);
                if ($container.length) {
                    return $container;
                }
                if (create) {
                    $container = createContainer(options);
                }
                return $container;
            }
            function info(message, title, optionsOverride) {
                return notify({
                    type: toastType.info,
                    iconClass: getOptions().iconClasses.info,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function subscribe(callback) {
                listener = callback;
            }
            function success(message, title, optionsOverride) {
                return notify({
                    type: toastType.success,
                    iconClass: getOptions().iconClasses.success,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function warning(message, title, optionsOverride) {
                return notify({
                    type: toastType.warning,
                    iconClass: getOptions().iconClasses.warning,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }
            function clear($toastElement, clearOptions) {
                var options = getOptions();
                if (!$container) {
                    getContainer(options);
                }
                if (!clearToast($toastElement, options, clearOptions)) {
                    clearContainer(options);
                }
            }
            function remove($toastElement) {
                var options = getOptions();
                if (!$container) {
                    getContainer(options);
                }
                if ($toastElement && $(":focus", $toastElement).length === 0) {
                    removeToast($toastElement);
                    return;
                }
                if ($container.children().length) {
                    $container.remove();
                }
            }
            function clearContainer(options) {
                var toastsToClear = $container.children();
                for (var i = toastsToClear.length - 1; i >= 0; i--) {
                    clearToast($(toastsToClear[i]), options);
                }
            }
            function clearToast($toastElement, options, clearOptions) {
                var force = clearOptions && clearOptions.force ? clearOptions.force : false;
                if ($toastElement && (force || $(":focus", $toastElement).length === 0)) {
                    $toastElement[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function() {
                            removeToast($toastElement);
                        }
                    });
                    return true;
                }
                return false;
            }
            function createContainer(options) {
                $container = $("<div/>").attr("id", options.containerId).addClass(options.positionClass).attr("aria-live", "polite").attr("role", "alert");
                $container.appendTo($(options.target));
                return $container;
            }
            function getDefaults() {
                return {
                    tapToDismiss: true,
                    toastClass: "toast",
                    containerId: "toast-container",
                    debug: false,
                    showMethod: "fadeIn",
                    showDuration: 300,
                    showEasing: "swing",
                    onShown: undefined,
                    hideMethod: "fadeOut",
                    hideDuration: 1e3,
                    hideEasing: "swing",
                    onHidden: undefined,
                    closeMethod: false,
                    closeDuration: false,
                    closeEasing: false,
                    extendedTimeOut: 1e3,
                    iconClasses: {
                        error: "toast-error",
                        info: "toast-info",
                        success: "toast-success",
                        warning: "toast-warning"
                    },
                    iconClass: "toast-info",
                    positionClass: "toast-top-right",
                    timeOut: 5e3,
                    titleClass: "toast-title",
                    messageClass: "toast-message",
                    escapeHtml: false,
                    target: "body",
                    closeHtml: '<button type="button">&times;</button>',
                    newestOnTop: true,
                    preventDuplicates: false,
                    progressBar: false
                };
            }
            function publish(args) {
                if (!listener) {
                    return;
                }
                listener(args);
            }
            function notify(map) {
                var options = getOptions();
                var iconClass = map.iconClass || options.iconClass;
                if (typeof map.optionsOverride !== "undefined") {
                    options = $.extend(options, map.optionsOverride);
                    iconClass = map.optionsOverride.iconClass || iconClass;
                }
                if (shouldExit(options, map)) {
                    return;
                }
                toastId++;
                $container = getContainer(options, true);
                var intervalId = null;
                var $toastElement = $("<div/>");
                var $titleElement = $("<div/>");
                var $messageElement = $("<div/>");
                var $progressElement = $("<div/>");
                var $closeElement = $(options.closeHtml);
                var progressBar = {
                    intervalId: null,
                    hideEta: null,
                    maxHideTime: null
                };
                var response = {
                    toastId: toastId,
                    state: "visible",
                    startTime: new Date(),
                    options: options,
                    map: map
                };
                personalizeToast();
                displayToast();
                handleEvents();
                publish(response);
                if (options.debug && console) {
                    console.log(response);
                }
                return $toastElement;
                function escapeHtml(source) {
                    if (source == null) source = "";
                    return new String(source).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                }
                function personalizeToast() {
                    setIcon();
                    setTitle();
                    setMessage();
                    setCloseButton();
                    setProgressBar();
                    setSequence();
                }
                function handleEvents() {
                    $toastElement.hover(stickAround, delayedHideToast);
                    if (!options.onclick && options.tapToDismiss) {
                        $toastElement.click(hideToast);
                    }
                    if (options.closeButton && $closeElement) {
                        $closeElement.click(function(event) {
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                                event.cancelBubble = true;
                            }
                            hideToast(true);
                        });
                    }
                    if (options.onclick) {
                        $toastElement.click(function(event) {
                            options.onclick(event);
                            hideToast();
                        });
                    }
                }
                function displayToast() {
                    $toastElement.hide();
                    $toastElement[options.showMethod]({
                        duration: options.showDuration,
                        easing: options.showEasing,
                        complete: options.onShown
                    });
                    if (options.timeOut > 0) {
                        intervalId = setTimeout(hideToast, options.timeOut);
                        progressBar.maxHideTime = parseFloat(options.timeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                        if (options.progressBar) {
                            progressBar.intervalId = setInterval(updateProgress, 10);
                        }
                    }
                }
                function setIcon() {
                    if (map.iconClass) {
                        $toastElement.addClass(options.toastClass).addClass(iconClass);
                    }
                }
                function setSequence() {
                    if (options.newestOnTop) {
                        $container.prepend($toastElement);
                    } else {
                        $container.append($toastElement);
                    }
                }
                function setTitle() {
                    if (map.title) {
                        $titleElement.append(!options.escapeHtml ? map.title : escapeHtml(map.title)).addClass(options.titleClass);
                        $toastElement.append($titleElement);
                    }
                }
                function setMessage() {
                    if (map.message) {
                        $messageElement.append(!options.escapeHtml ? map.message : escapeHtml(map.message)).addClass(options.messageClass);
                        $toastElement.append($messageElement);
                    }
                }
                function setCloseButton() {
                    if (options.closeButton) {
                        $closeElement.addClass("toast-close-button").attr("role", "button");
                        $toastElement.prepend($closeElement);
                    }
                }
                function setProgressBar() {
                    if (options.progressBar) {
                        $progressElement.addClass("toast-progress");
                        $toastElement.prepend($progressElement);
                    }
                }
                function shouldExit(options, map) {
                    if (options.preventDuplicates) {
                        if (map.message === previousToast) {
                            return true;
                        } else {
                            previousToast = map.message;
                        }
                    }
                    return false;
                }
                function hideToast(override) {
                    var method = override && options.closeMethod !== false ? options.closeMethod : options.hideMethod;
                    var duration = override && options.closeDuration !== false ? options.closeDuration : options.hideDuration;
                    var easing = override && options.closeEasing !== false ? options.closeEasing : options.hideEasing;
                    if ($(":focus", $toastElement).length && !override) {
                        return;
                    }
                    clearTimeout(progressBar.intervalId);
                    return $toastElement[method]({
                        duration: duration,
                        easing: easing,
                        complete: function() {
                            removeToast($toastElement);
                            if (options.onHidden && response.state !== "hidden") {
                                options.onHidden();
                            }
                            response.state = "hidden";
                            response.endTime = new Date();
                            publish(response);
                        }
                    });
                }
                function delayedHideToast() {
                    if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                        intervalId = setTimeout(hideToast, options.extendedTimeOut);
                        progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                    }
                }
                function stickAround() {
                    clearTimeout(intervalId);
                    progressBar.hideEta = 0;
                    $toastElement.stop(true, true)[options.showMethod]({
                        duration: options.showDuration,
                        easing: options.showEasing
                    });
                }
                function updateProgress() {
                    var percentage = (progressBar.hideEta - new Date().getTime()) / progressBar.maxHideTime * 100;
                    $progressElement.width(percentage + "%");
                }
            }
            function getOptions() {
                return $.extend({}, getDefaults(), toastr.options);
            }
            function removeToast($toastElement) {
                if (!$container) {
                    $container = getContainer();
                }
                if ($toastElement.is(":visible")) {
                    return;
                }
                $toastElement.remove();
                $toastElement = null;
                if ($container.children().length === 0) {
                    $container.remove();
                    previousToast = undefined;
                }
            }
        }();
    });
})(typeof define === "function" && define.amd ? define : function(deps, factory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory(require("jquery"));
    } else {
        window.toastr = factory(window.jQuery);
    }
});

var initCsSourcePointerHover = function() {
    $(".cs-source-point-list__item").hover(function() {
        var number = $(this).index() + 1;
        var uniqueId = $(this).parent().attr("data-source-target");
        $('[data-cs-source-point-id="' + uniqueId + '"][data-cs-source-point-number="' + number + '"]').addClass("cs-source-point--active");
    }, function() {
        var number = $(this).index() + 1;
        var uniqueId = $(this).parent().attr("data-source-target");
        $('[data-cs-source-point-id="' + uniqueId + '"][data-cs-source-point-number="' + number + '"]').removeClass("cs-source-point--active");
    });
    $(".cs-source-point[data-cs-source-point-id][data-cs-source-point-number]").hover(function() {
        var number = $(this).attr("data-cs-source-point-number");
        var uniqueId = $(this).attr("data-cs-source-point-id");
        $('[data-source-target="' + uniqueId + '"]').find("a:nth-child(" + number + ")").addClass("cs-source-point-list__item--active");
    }, function() {
        var number = $(this).attr("data-cs-source-point-number");
        var uniqueId = $(this).attr("data-cs-source-point-id");
        $('[data-source-target="' + uniqueId + '"]').find("a:nth-child(" + number + ")").removeClass("cs-source-point-list__item--active");
    });
};

var initBootstrapTooltip = function() {
    $('[data-toggle="popover"]').popover();
    $('[data-toggle="tooltip"]:visible').tooltip();
    $('[data-toggle="tooltip"]:hidden').tooltip();
};

var initClipboardJs = function() {
    var clipboard = new Clipboard(".cs--trigger-copy-clipboard");
    $(".cs--trigger-copy-clipboard").click(function() {
        var that = $(this);
        that.tooltip("dispose");
        that.attr("title", "copied!");
        that.tooltip("show");
        setTimeout(function() {
            that.attr("title", that.attr("data-title-orig"));
            that.tooltip("dispose");
            that.tooltip();
        }, 1e3);
    });
};

var interactiveGraphicStyles = {
    bg: {
        normal: {
            mouseIn: {
                fill: "rgba(30,159,204)"
            },
            mouseOut: {
                fill: "black"
            }
        },
        markedAsDone: {
            mouseIn: {
                fill: "rgba(0, 158, 53)"
            },
            mouseOut: {
                fill: "rgba(0, 158, 53)"
            }
        },
        markedAsTodo: {
            mouseIn: {
                fill: "rgba(255, 145, 29)"
            },
            mouseOut: {
                fill: "rgba(255, 145, 29)"
            }
        },
        markedAsGrayedOut: {
            mouseIn: {
                fill: "rgba(30,159,204)"
            },
            mouseOut: {
                fill: "black"
            }
        }
    },
    fill: {
        normal: {
            mouseIn: {
                fill: "rgba(30,159,204)"
            },
            mouseOut: {
                fill: "black"
            }
        },
        markedAsDone: {
            mouseIn: {
                fill: "rgba(107, 233, 150)"
            },
            mouseOut: {
                fill: "rgba(195, 233, 208)"
            }
        },
        markedAsTodo: {
            mouseIn: {
                fill: "rgba(255,184,109)"
            },
            mouseOut: {
                fill: "rgba(255,227,197)"
            }
        },
        markedAsGrayedOut: {
            mouseIn: {
                fill: "rgba(30,159,204)"
            },
            mouseOut: {
                fill: "black"
            }
        }
    },
    label: {
        normal: {
            mouseIn: {
                fill: "black"
            },
            mouseOut: {
                fill: "black"
            }
        },
        markedAsDone: {
            mouseIn: {
                fill: "black"
            },
            mouseOut: {
                fill: "rgba(0, 158, 53)"
            }
        },
        markedAsTodo: {
            mouseIn: {
                fill: "black"
            },
            mouseOut: {
                fill: "rgba(216, 111, 0)"
            }
        },
        markedAsGrayedOut: {
            mouseIn: {
                fill: "rgba(30,159,204)"
            },
            mouseOut: {
                fill: "black"
            }
        }
    }
};

var _extractElementTypeFromElementId = function(elementId) {
    if (_startsWith(elementId, "bg")) {
        return "bg";
    }
    if (_startsWith(elementId, "label")) {
        return "label";
    }
    if (_startsWith(elementId, "fill")) {
        return "fill";
    }
    return "other";
};

var _loadInteractiveGraphic = function(el) {
    var svgId = $(el).attr("id");
    console.log("ig: loading svg graphic: " + svgId);
    var jsonSettings = JSON.parse($(el).attr("data-json-settings"));
    if (jsonSettings === undefined || jsonSettings === null) {
        console.log("ig: failed1");
        return;
    }
    if (jsonSettings["markedAsDone"] === undefined || typeof jsonSettings["markedAsDone"] !== "object") {
        console.log("ig: failed2");
        return;
    }
    if (jsonSettings["markedAsTodo"] === undefined || typeof jsonSettings["markedAsTodo"] !== "object") {
        console.log("ig: failed3");
        return;
    }
    if (jsonSettings["markedAsGrayedOut"] === undefined || typeof jsonSettings["markedAsGrayedOut"] !== "object") {
        console.log("ig: failed4");
        return;
    }
    if (jsonSettings["onClick"] === undefined || typeof jsonSettings["onClick"] !== "object") {
        console.log("ig: failed5");
        return;
    }
    console.log("ig: valid input");
    var svgToLoad = "/kitchen-duty-plugin-for-atlassian-jira/images/interactive/" + $(el).attr("data-svg-to-load") + ".svg";
    var g = Snap("#" + svgId).group();
    Snap.load(svgToLoad, function(loadedFragment) {
        g.append(loadedFragment);
        [ "markedAsDone", "markedAsTodo", "markedAsGrayedOut" ].forEach(function(settingsCategory) {
            jsonSettings[settingsCategory].forEach(function(svgGroupName) {
                var svgGroup = g.select("#" + svgGroupName);
                var svgGroupChildren = svgGroup.selectAll("*");
                $(svgGroupChildren).each(function(ind, svgGroupChild) {
                    var svgGroupChildId = svgGroupChild.attr("id");
                    var svgGroupChildType = _extractElementTypeFromElementId(svgGroupChildId);
                    if (svgGroupChildType !== "other") {
                        svgGroupChild.attr(interactiveGraphicStyles[svgGroupChildType][settingsCategory]["mouseOut"]);
                        svgGroup.mouseover(function() {
                            svgGroupChild.animate(interactiveGraphicStyles[svgGroupChildType][settingsCategory]["mouseIn"], 200, mina.easein);
                        });
                        svgGroup.mouseout(function() {
                            svgGroupChild.animate(interactiveGraphicStyles[svgGroupChildType][settingsCategory]["mouseOut"], 200, mina.easein);
                        });
                    }
                });
            });
        });
        jsonSettings["onClick"].forEach(function(onClickSettings) {
            var onClickGroupName = Object.keys(onClickSettings)[0];
            $("#" + onClickGroupName).click(function() {
                console.log("ig: " + onClickGroupName + " clicked");
                window[onClickSettings[onClickGroupName]]();
            });
            $("#" + onClickGroupName).css("cursor", "pointer");
        });
    });
};

var initInteractiveGraphics = function() {
    $(".cs-interactive-graphic").each(function(ind, el) {
        _loadInteractiveGraphic(el);
    });
};

var redirectToSsl = function() {
    if (!_startsWith(window.location.protocol, "https") && !_startsWith(window.location.href, "http://localhost")) {
        window.location.href = "https://" + window.location.hostname + window.location.pathname + window.location.search;
    }
};

var _startsWith = function(stringS, prefix) {
    if (stringS === undefined || stringS === null) return false;
    return stringS.slice(0, prefix.length) == prefix;
};

var initStarsOnGitHub = function() {
    $.getJSON("https://api.github.com/repos/comsysto/kitchen-duty-plugin-for-atlassian-jira/stargazers?access_token=2605ab0ec4b7c4de2a19ef458b9c24cd33876ca4", function(data) {
        $(".cs-stars-on-github-count-stars").html(data.length);
    });
};

$(function() {
    redirectToSsl();
    for (var i = 0; i < postLoadMethods.length; i++) {
        postLoadMethods[i]();
    }
    initInteractiveGraphics();
    initBootstrapTooltip();
    initClipboardJs();
    initCsSourcePointerHover();
    initStarsOnGitHub();
});