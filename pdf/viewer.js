/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var pdf_start_time = (new Date()).getTime();
localStorage.setItem("1_start",pdf_start_time);
localStorage.setItem("scoll_his",1);
var pdfjsWebLibs; {
    pdfjsWebLibs = {
        pdfjsWebPDFJS: window.pdfjsDistBuildPdf
    };
    (function() {
        (function(root, factory) {
            factory(root.pdfjsWebPDFRenderingQueue = {});
        }(this, function(exports) {
            var CLEANUP_TIMEOUT = 30000;
            var RenderingStates = {
                INITIAL: 0,
                RUNNING: 1,
                PAUSED: 2,
                FINISHED: 3
            };
            var PDFRenderingQueue = function PDFRenderingQueueClosure() {
                function PDFRenderingQueue() {
                    this.pdfViewer = null;
                    this.onIdle = null;
                    this.highestPriorityPage = null;
                    this.idleTimeout = null;
                    this.printing = false;
                    this.isThumbnailViewEnabled = false;
                }
                PDFRenderingQueue.prototype = {
                    setViewer: function PDFRenderingQueue_setViewer(pdfViewer) {
                        this.pdfViewer = pdfViewer;
                    },
                    isHighestPriority: function PDFRenderingQueue_isHighestPriority(view) {
                        return this.highestPriorityPage === view.renderingId;
                    },
                    renderHighestPriority: function PDFRenderingQueue_renderHighestPriority(currentlyVisiblePages) {
                        if (this.idleTimeout) {
                            clearTimeout(this.idleTimeout);
                            this.idleTimeout = null;
                        }
                        if (this.pdfViewer.forceRendering(currentlyVisiblePages)) {
                            return;
                        }
                        if (this.printing) {
                            return;
                        }
                        if (this.onIdle) {
                            this.idleTimeout = setTimeout(this.onIdle.bind(this), CLEANUP_TIMEOUT);
                        }
                    },
                    getHighestPriority: function PDFRenderingQueue_getHighestPriority(visible, views, scrolledDown) {
                        var visibleViews = visible.views;
                        var numVisible = visibleViews.length;
                        if (numVisible === 0) {
                            return false;
                        }
                        for (var i = 0; i < numVisible; ++i) {
                            var view = visibleViews[i].view;
                            if (!this.isViewFinished(view)) {
                                return view;
                            }
                        }
                        if (scrolledDown) {
                            var nextPageIndex = visible.last.id;
                            if (views[nextPageIndex] && !this.isViewFinished(views[nextPageIndex])) {
                                return views[nextPageIndex];
                            }
                        } else {
                            var previousPageIndex = visible.first.id - 2;
                            if (views[previousPageIndex] && !this.isViewFinished(views[previousPageIndex])) {
                                return views[previousPageIndex];
                            }
                        }
                        return null;
                    },
                    isViewFinished: function PDFRenderingQueue_isViewFinished(view) {
                        return view.renderingState === RenderingStates.FINISHED;
                    },
                    renderView: function PDFRenderingQueue_renderView(view) {
                        var state = view.renderingState;
                        switch (state) {
                            case RenderingStates.FINISHED:
                                return false;
                            case RenderingStates.PAUSED:
                                this.highestPriorityPage = view.renderingId;
                                view.resume();
                                break;
                            case RenderingStates.RUNNING:
                                this.highestPriorityPage = view.renderingId;
                                break;
                            case RenderingStates.INITIAL:
                                this.highestPriorityPage = view.renderingId;
                                var continueRendering = function() {
                                    this.renderHighestPriority();
                                }.bind(this);
                                view.draw().then(continueRendering, continueRendering);
                                break;
                        }
                        return true;
                    }
                };
                return PDFRenderingQueue;
            }();
            exports.RenderingStates = RenderingStates;
            exports.PDFRenderingQueue = PDFRenderingQueue;
        }));
        (function(root, factory) {
            factory(root.pdfjsWebUIUtils = {}, root.pdfjsWebPDFJS);
        }(this, function(exports, pdfjsLib) {
            var CSS_UNITS = 96.0 / 72.0;
            var DEFAULT_SCALE_VALUE = 'auto';
            var DEFAULT_SCALE = 1.0;
            var MIN_SCALE = 0.25;
            var MAX_SCALE = 10.0;
            var UNKNOWN_SCALE = 0;
            var MAX_AUTO_SCALE = 1.25;
            var SCROLLBAR_PADDING = 40;
            var VERTICAL_PADDING = 5;
            var RendererType = {
                CANVAS: 'canvas',
                SVG: 'svg'
            };
            var mozL10n = document.mozL10n || document.webL10n;
            var PDFJS = pdfjsLib.PDFJS;
            PDFJS.disableFullscreen = PDFJS.disableFullscreen === undefined ? false : PDFJS.disableFullscreen;
            PDFJS.useOnlyCssZoom = PDFJS.useOnlyCssZoom === undefined ? false : PDFJS.useOnlyCssZoom;
            PDFJS.maxCanvasPixels = PDFJS.maxCanvasPixels === undefined ? 16777216 : PDFJS.maxCanvasPixels;
            PDFJS.disableHistory = PDFJS.disableHistory === undefined ? false : PDFJS.disableHistory;
            PDFJS.disableTextLayer = PDFJS.disableTextLayer === undefined ? false : PDFJS.disableTextLayer;
            PDFJS.ignoreCurrentPositionOnZoom = PDFJS.ignoreCurrentPositionOnZoom === undefined ? false : PDFJS.ignoreCurrentPositionOnZoom;
            PDFJS.locale = PDFJS.locale === undefined ? navigator.language : PDFJS.locale;

            function getOutputScale(ctx) {
                var devicePixelRatio = window.devicePixelRatio || 1;
                var backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
                var pixelRatio = devicePixelRatio / backingStoreRatio;
                return {
                    sx: pixelRatio,
                    sy: pixelRatio,
                    scaled: pixelRatio !== 1
                };
            }

            function scrollIntoView(element, spot, skipOverflowHiddenElements) {
                var parent = element.offsetParent;
                if (!parent) {
                    console.error('offsetParent is not set -- cannot scroll');
                    return;
                }
                var checkOverflow = skipOverflowHiddenElements || false;
                var offsetY = element.offsetTop + element.clientTop;
                var offsetX = element.offsetLeft + element.clientLeft;
                while (parent.clientHeight === parent.scrollHeight || checkOverflow && getComputedStyle(parent).overflow === 'hidden') {
                    if (parent.dataset._scaleY) {
                        offsetY /= parent.dataset._scaleY;
                        offsetX /= parent.dataset._scaleX;
                    }
                    offsetY += parent.offsetTop;
                    offsetX += parent.offsetLeft;
                    parent = parent.offsetParent;
                    if (!parent) {
                        return;
                    }
                }
                if (spot) {
                    if (spot.top !== undefined) {
                        offsetY += spot.top;
                    }
                    if (spot.left !== undefined) {
                        offsetX += spot.left;
                        parent.scrollLeft = offsetX;
                    }
                }
                parent.scrollTop = offsetY;
            }

            function watchScroll(viewAreaElement, callback) {
                var debounceScroll = function debounceScroll(evt) {
                    if (rAF) {
                        return;
                    }
                    rAF = window.requestAnimationFrame(function viewAreaElementScrolled() {
                        rAF = null;
                        var currentY = viewAreaElement.scrollTop;
                        var lastY = state.lastY;
                        if (currentY !== lastY) {
                            state.down = currentY > lastY;
                        }
                        state.lastY = currentY;
                        callback(state);
                    });
                };
                var state = {
                    down: true,
                    lastY: viewAreaElement.scrollTop,
                    _eventHandler: debounceScroll
                };
                var rAF = null;
                viewAreaElement.addEventListener('scroll', debounceScroll, true);
                return state;
            }

            function parseQueryString(query) {
                var parts = query.split('&');
                var params = {};
                for (var i = 0, ii = parts.length; i < ii; ++i) {
                    var param = parts[i].split('=');
                    var key = param[0].toLowerCase();
                    var value = param.length > 1 ? param[1] : null;
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                }
                return params;
            }

            function binarySearchFirstItem(items, condition) {
                var minIndex = 0;
                var maxIndex = items.length - 1;
                if (items.length === 0 || !condition(items[maxIndex])) {
                    return items.length;
                }
                if (condition(items[minIndex])) {
                    return minIndex;
                }
                while (minIndex < maxIndex) {
                    var currentIndex = minIndex + maxIndex >> 1;
                    var currentItem = items[currentIndex];
                    if (condition(currentItem)) {
                        maxIndex = currentIndex;
                    } else {
                        minIndex = currentIndex + 1;
                    }
                }
                return minIndex;
            }

            function approximateFraction(x) {
                if (Math.floor(x) === x) {
                    return [
                        x,
                        1
                    ];
                }
                var xinv = 1 / x;
                var limit = 8;
                if (xinv > limit) {
                    return [
                        1,
                        limit
                    ];
                } else if (Math.floor(xinv) === xinv) {
                    return [
                        1,
                        xinv
                    ];
                }
                var x_ = x > 1 ? xinv : x;
                var a = 0,
                    b = 1,
                    c = 1,
                    d = 1;
                while (true) {
                    var p = a + c,
                        q = b + d;
                    if (q > limit) {
                        break;
                    }
                    if (x_ <= p / q) {
                        c = p;
                        d = q;
                    } else {
                        a = p;
                        b = q;
                    }
                }
                var result;
                if (x_ - a / b < c / d - x_) {
                    result = x_ === x ? [
                        a,
                        b
                    ] : [
                        b,
                        a
                    ];
                } else {
                    result = x_ === x ? [
                        c,
                        d
                    ] : [
                        d,
                        c
                    ];
                }
                return result;
            }

            function roundToDivide(x, div) {
                var r = x % div;
                return r === 0 ? x : Math.round(x - r + div);
            }

            function getVisibleElements(scrollEl, views, sortByVisibility) {
                var top = scrollEl.scrollTop,
                    bottom = top + scrollEl.clientHeight;
                var left = scrollEl.scrollLeft,
                    right = left + scrollEl.clientWidth;

                function isElementBottomBelowViewTop(view) {
                    var element = view.div;
                    var elementBottom = element.offsetTop + element.clientTop + element.clientHeight;
                    return elementBottom > top;
                }
                var visible = [],
                    view, element;
                var currentHeight, viewHeight, hiddenHeight, percentHeight;
                var currentWidth, viewWidth;
                var firstVisibleElementInd = views.length === 0 ? 0 : binarySearchFirstItem(views, isElementBottomBelowViewTop);
                for (var i = firstVisibleElementInd, ii = views.length; i < ii; i++) {
                    view = views[i];
                    element = view.div;
                    currentHeight = element.offsetTop + element.clientTop;
                    viewHeight = element.clientHeight;
                    if (currentHeight > bottom) {
                        break;
                    }
                    currentWidth = element.offsetLeft + element.clientLeft;
                    viewWidth = element.clientWidth;
                    if (currentWidth + viewWidth < left || currentWidth > right) {
                        continue;
                    }
                    hiddenHeight = Math.max(0, top - currentHeight) + Math.max(0, currentHeight + viewHeight - bottom);
                    percentHeight = (viewHeight - hiddenHeight) * 100 / viewHeight | 0;
                    visible.push({
                        id: view.id,
                        x: currentWidth,
                        y: currentHeight,
                        view: view,
                        percent: percentHeight
                    });
                }
                var first = visible[0];
                var last = visible[visible.length - 1];
                if (sortByVisibility) {
                    visible.sort(function(a, b) {
                        var pc = a.percent - b.percent;
                        if (Math.abs(pc) > 0.001) {
                            return -pc;
                        }
                        return a.id - b.id;
                    });
                }
                return {
                    first: first,
                    last: last,
                    views: visible
                };
            }

            function noContextMenuHandler(e) {
                e.preventDefault();
            }

            function getPDFFileNameFromURL(url) {
                var reURI = /^(?:([^:]+:)?\/\/[^\/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/;
                var reFilename = /[^\/?#=]+\.pdf\b(?!.*\.pdf\b)/i;
                var splitURI = reURI.exec(url);
                var suggestedFilename = reFilename.exec(splitURI[1]) || reFilename.exec(splitURI[2]) || reFilename.exec(splitURI[3]);
                if (suggestedFilename) {
                    suggestedFilename = suggestedFilename[0];
                    if (suggestedFilename.indexOf('%') !== -1) {
                        try {
                            suggestedFilename = reFilename.exec(decodeURIComponent(suggestedFilename))[0];
                        } catch (e) {}
                    }
                }
                return suggestedFilename || 'document.pdf';
            }

            function normalizeWheelEventDelta(evt) {
                var delta = Math.sqrt(evt.deltaX * evt.deltaX + evt.deltaY * evt.deltaY);
                var angle = Math.atan2(evt.deltaY, evt.deltaX);
                if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
                    delta = -delta;
                }
                var MOUSE_DOM_DELTA_PIXEL_MODE = 0;
                var MOUSE_DOM_DELTA_LINE_MODE = 1;
                var MOUSE_PIXELS_PER_LINE = 30;
                var MOUSE_LINES_PER_PAGE = 30;
                if (evt.deltaMode === MOUSE_DOM_DELTA_PIXEL_MODE) {
                    delta /= MOUSE_PIXELS_PER_LINE * MOUSE_LINES_PER_PAGE;
                } else if (evt.deltaMode === MOUSE_DOM_DELTA_LINE_MODE) {
                    delta /= MOUSE_LINES_PER_PAGE;
                }
                return delta;
            }
            var animationStarted = new Promise(function(resolve) {
                window.requestAnimationFrame(resolve);
            });
            var localized = new Promise(function(resolve, reject) {
                if (!mozL10n) {
                    resolve();
                    return;
                }
                if (mozL10n.getReadyState() !== 'loading') {
                    resolve();
                    return;
                }
                window.addEventListener('localized', function localized(evt) {
                    resolve();
                });
            });
            var ProgressBar = function ProgressBarClosure() {
                function clamp(v, min, max) {
                    return Math.min(Math.max(v, min), max);
                }

                function ProgressBar(id, opts) {
                    this.visible = true;
                    this.div = document.querySelector(id + ' .progress');
                    this.bar = this.div.parentNode;
                    this.height = opts.height || 100;
                    this.width = opts.width || 100;
                    this.units = opts.units || '%';
                    this.div.style.height = this.height + this.units;
                    this.percent = 0;
                }
                ProgressBar.prototype = {
                    updateBar: function ProgressBar_updateBar() {
                        if (this._indeterminate) {
                            this.div.classList.add('indeterminate');
                            this.div.style.width = this.width + this.units;
                            return;
                        }
                        this.div.classList.remove('indeterminate');
                        var progressSize = this.width * this._percent / 100;
                        this.div.style.width = progressSize + this.units;
                    },
                    get percent() {
                        return this._percent;
                    },
                    set percent(val) {
                        this._indeterminate = isNaN(val);
                        this._percent = clamp(val, 0, 100);
                        this.updateBar();
                    },
                    setWidth: function ProgressBar_setWidth(viewer) {
                        if (viewer) {
                            var container = viewer.parentNode;
                            var scrollbarWidth = container.offsetWidth - viewer.offsetWidth;
                            if (scrollbarWidth > 0) {
                                this.bar.setAttribute('style', 'width: calc(100% - ' + scrollbarWidth + 'px);');
                            }
                        }
                    },
                    hide: function ProgressBar_hide() {
                        if (!this.visible) {
                            return;
                        }
                        this.visible = false;
                        this.bar.classList.add('hidden');
                        document.body.classList.remove('loadingInProgress');
                    },
                    show: function ProgressBar_show() {
                        if (this.visible) {
                            return;
                        }
                        this.visible = true;
                        document.body.classList.add('loadingInProgress');
                        this.bar.classList.remove('hidden');
                    }
                };
                return ProgressBar;
            }();
            exports.CSS_UNITS = CSS_UNITS;
            exports.DEFAULT_SCALE_VALUE = DEFAULT_SCALE_VALUE;
            exports.DEFAULT_SCALE = DEFAULT_SCALE;
            exports.MIN_SCALE = MIN_SCALE;
            exports.MAX_SCALE = MAX_SCALE;
            exports.UNKNOWN_SCALE = UNKNOWN_SCALE;
            exports.MAX_AUTO_SCALE = MAX_AUTO_SCALE;
            exports.SCROLLBAR_PADDING = SCROLLBAR_PADDING;
            exports.VERTICAL_PADDING = VERTICAL_PADDING;
            exports.RendererType = RendererType;
            exports.mozL10n = mozL10n;
            exports.ProgressBar = ProgressBar;
            exports.getPDFFileNameFromURL = getPDFFileNameFromURL;
            exports.noContextMenuHandler = noContextMenuHandler;
            exports.parseQueryString = parseQueryString;
            exports.getVisibleElements = getVisibleElements;
            exports.roundToDivide = roundToDivide;
            exports.approximateFraction = approximateFraction;
            exports.getOutputScale = getOutputScale;
            exports.scrollIntoView = scrollIntoView;
            exports.watchScroll = watchScroll;
            exports.binarySearchFirstItem = binarySearchFirstItem;
            exports.normalizeWheelEventDelta = normalizeWheelEventDelta;
            exports.animationStarted = animationStarted;
            exports.localized = localized;
        }));
        (function(root, factory) {
            factory(root.pdfjsWebPDFPageView = {}, root.pdfjsWebUIUtils, root.pdfjsWebPDFRenderingQueue, root.pdfjsWebPDFJS);
        }(this, function(exports, uiUtils, pdfRenderingQueue, pdfjsLib) {
            var CSS_UNITS = uiUtils.CSS_UNITS;
            var DEFAULT_SCALE = uiUtils.DEFAULT_SCALE;
            var getOutputScale = uiUtils.getOutputScale;
            var approximateFraction = uiUtils.approximateFraction;
            var roundToDivide = uiUtils.roundToDivide;
            var RendererType = uiUtils.RendererType;
            var RenderingStates = pdfRenderingQueue.RenderingStates;
            var TEXT_LAYER_RENDER_DELAY = 200;
            var PDFPageView = function PDFPageViewClosure() {
                function PDFPageView(options) {
                    var container = options.container;
                    var id = options.id;
                    var scale = options.scale;
                    var defaultViewport = options.defaultViewport;
                    var renderingQueue = options.renderingQueue;
                    var textLayerFactory = options.textLayerFactory;
                    var annotationLayerFactory = options.annotationLayerFactory;
                    var enhanceTextSelection = options.enhanceTextSelection || false;
                    var renderInteractiveForms = options.renderInteractiveForms || false;
                    this.id = id;
                    this.renderingId = 'page' + id;
                    this.pageLabel = null;
                    this.rotation = 0;
                    this.scale = scale || DEFAULT_SCALE;
                    this.viewport = defaultViewport;
                    this.pdfPageRotate = defaultViewport.rotation;
                    this.hasRestrictedScaling = false;
                    this.enhanceTextSelection = enhanceTextSelection;
                    this.renderInteractiveForms = renderInteractiveForms;
                    this.renderingQueue = renderingQueue;
                    this.textLayerFactory = textLayerFactory;
                    this.annotationLayerFactory = annotationLayerFactory;
                    this.renderer = options.renderer || RendererType.CANVAS;
                    this.paintTask = null;
                    this.paintedViewportMap = new WeakMap();
                    this.renderingState = RenderingStates.INITIAL;
                    this.resume = null;
                    this.error = null;
                    this.onBeforeDraw = null;
                    this.onAfterDraw = null;
                    this.textLayer = null;
                    this.zoomLayer = null;
                    this.annotationLayer = null;
                    var div = document.createElement('div');
                    div.className = 'page';
                    div.style.width = Math.floor(this.viewport.width) + 'px';
                    div.style.height = Math.floor(this.viewport.height) + 'px';
                    div.setAttribute('data-page-number', this.id);
                    this.div = div;
                    container.appendChild(div);
                }
                PDFPageView.prototype = {
                    setPdfPage: function PDFPageView_setPdfPage(pdfPage) {
                        this.pdfPage = pdfPage;
                        this.pdfPageRotate = pdfPage.rotate;
                        var totalRotation = (this.rotation + this.pdfPageRotate) % 360;
                        this.viewport = pdfPage.getViewport(this.scale * CSS_UNITS, totalRotation);
                        this.stats = pdfPage.stats;
                        this.reset();
                    },
                    destroy: function PDFPageView_destroy() {
                        this.zoomLayer = null;
                        this.reset();
                        if (this.pdfPage) {
                            this.pdfPage.cleanup();
                        }
                    },
                    reset: function PDFPageView_reset(keepZoomLayer, keepAnnotations) {
                        this.cancelRendering();
                        var div = this.div;
                        div.style.width = Math.floor(this.viewport.width) + 'px';
                        div.style.height = Math.floor(this.viewport.height) + 'px';
                        var childNodes = div.childNodes;
                        var currentZoomLayerNode = keepZoomLayer && this.zoomLayer || null;
                        var currentAnnotationNode = keepAnnotations && this.annotationLayer && this.annotationLayer.div || null;
                        for (var i = childNodes.length - 1; i >= 0; i--) {
                            var node = childNodes[i];
                            if (currentZoomLayerNode === node || currentAnnotationNode === node) {
                                continue;
                            }
                            div.removeChild(node);
                        }
                        div.removeAttribute('data-loaded');
                        if (currentAnnotationNode) {
                            this.annotationLayer.hide();
                        } else {
                            this.annotationLayer = null;
                        }
                        if (this.canvas && !currentZoomLayerNode) {
                            this.paintedViewportMap.delete(this.canvas);
                            this.canvas.width = 0;
                            this.canvas.height = 0;
                            delete this.canvas;
                        }
                        if (this.svg) {
                            this.paintedViewportMap.delete(this.svg);
                            delete this.svg;
                        }
                        this.loadingIconDiv = document.createElement('div');
                        this.loadingIconDiv.className = 'loadingIcon';
                        div.appendChild(this.loadingIconDiv);
                    },
                    update: function PDFPageView_update(scale, rotation) {
                        this.scale = scale || this.scale;
                        if (typeof rotation !== 'undefined') {
                            this.rotation = rotation;
                        }
                        var totalRotation = (this.rotation + this.pdfPageRotate) % 360;
                        this.viewport = this.viewport.clone({
                            scale: this.scale * CSS_UNITS,
                            rotation: totalRotation
                        });
                        if (this.svg) {
                            this.cssTransform(this.svg, true);
                            return;
                        }
                        var isScalingRestricted = false;
                        if (this.canvas && pdfjsLib.PDFJS.maxCanvasPixels > 0) {
                            var outputScale = this.outputScale;
                            if ((Math.floor(this.viewport.width) * outputScale.sx | 0) * (Math.floor(this.viewport.height) * outputScale.sy | 0) > pdfjsLib.PDFJS.maxCanvasPixels) {
                                isScalingRestricted = true;
                            }
                        }
                        if (this.canvas) {
                            if (pdfjsLib.PDFJS.useOnlyCssZoom || this.hasRestrictedScaling && isScalingRestricted) {
                                this.cssTransform(this.canvas, true);
                                return;
                            }
                            if (!this.zoomLayer) {
                                this.zoomLayer = this.canvas.parentNode;
                                this.zoomLayer.style.position = 'absolute';
                            }
                        }
                        if (this.zoomLayer) {
                            this.cssTransform(this.zoomLayer.firstChild);
                        }
                        this.reset(true, true);
                    },
                    cancelRendering: function PDFPageView_cancelRendering() {
                        if (this.paintTask) {
                            this.paintTask.cancel();
                            this.paintTask = null;
                        }
                        this.renderingState = RenderingStates.INITIAL;
                        this.resume = null;
                        if (this.textLayer) {
                            this.textLayer.cancel();
                            this.textLayer = null;
                        }
                    },
                    updatePosition: function PDFPageView_updatePosition() {
                        if (this.textLayer) {
                            this.textLayer.render(TEXT_LAYER_RENDER_DELAY);
                        }
                    },
                    cssTransform: function PDFPageView_transform(target, redrawAnnotations) {
                        var CustomStyle = pdfjsLib.CustomStyle;
                        var width = this.viewport.width;
                        var height = this.viewport.height;
                        var div = this.div;
                        target.style.width = target.parentNode.style.width = div.style.width = Math.floor(width) + 'px';
                        target.style.height = target.parentNode.style.height = div.style.height = Math.floor(height) + 'px';
                        var relativeRotation = this.viewport.rotation - this.paintedViewportMap.get(target).rotation;
                        var absRotation = Math.abs(relativeRotation);
                        var scaleX = 1,
                            scaleY = 1;
                        if (absRotation === 90 || absRotation === 270) {
                            scaleX = height / width;
                            scaleY = width / height;
                        }
                        var cssTransform = 'rotate(' + relativeRotation + 'deg) ' + 'scale(' + scaleX + ',' + scaleY + ')';
                        CustomStyle.setProp('transform', target, cssTransform);
                        if (this.textLayer) {
                            var textLayerViewport = this.textLayer.viewport;
                            var textRelativeRotation = this.viewport.rotation - textLayerViewport.rotation;
                            var textAbsRotation = Math.abs(textRelativeRotation);
                            var scale = width / textLayerViewport.width;
                            if (textAbsRotation === 90 || textAbsRotation === 270) {
                                scale = width / textLayerViewport.height;
                            }
                            var textLayerDiv = this.textLayer.textLayerDiv;
                            var transX, transY;
                            switch (textAbsRotation) {
                                case 0:
                                    transX = transY = 0;
                                    break;
                                case 90:
                                    transX = 0;
                                    transY = '-' + textLayerDiv.style.height;
                                    break;
                                case 180:
                                    transX = '-' + textLayerDiv.style.width;
                                    transY = '-' + textLayerDiv.style.height;
                                    break;
                                case 270:
                                    transX = '-' + textLayerDiv.style.width;
                                    transY = 0;
                                    break;
                                default:
                                    console.error('Bad rotation value.');
                                    break;
                            }
                            CustomStyle.setProp('transform', textLayerDiv, 'rotate(' + textAbsRotation + 'deg) ' + 'scale(' + scale + ', ' + scale + ') ' + 'translate(' + transX + ', ' + transY + ')');
                            CustomStyle.setProp('transformOrigin', textLayerDiv, '0% 0%');
                        }
                        if (redrawAnnotations && this.annotationLayer) {
                            this.annotationLayer.render(this.viewport, 'display');
                        }
                    },
                    get width() {
                        return this.viewport.width;
                    },
                    get height() {
                        return this.viewport.height;
                    },
                    getPagePoint: function PDFPageView_getPagePoint(x, y) {
                        return this.viewport.convertToPdfPoint(x, y);
                    },
                    draw: function PDFPageView_draw() {
                        if (this.renderingState !== RenderingStates.INITIAL) {
                            console.error('Must be in new state before drawing');
                            this.reset();
                        }
                        this.renderingState = RenderingStates.RUNNING;
                        var self = this;
                        var pdfPage = this.pdfPage;
                        var viewport = this.viewport;
                        var div = this.div;
                        var canvasWrapper = document.createElement('div');
                        canvasWrapper.style.width = div.style.width;
                        canvasWrapper.style.height = div.style.height;
                        canvasWrapper.classList.add('canvasWrapper');
                        if (this.annotationLayer && this.annotationLayer.div) {
                            div.insertBefore(canvasWrapper, this.annotationLayer.div);
                        } else {
                            div.appendChild(canvasWrapper);
                        }
                        var textLayerDiv = null;
                        var textLayer = null;
                        if (this.textLayerFactory) {
                            textLayerDiv = document.createElement('div');
                            textLayerDiv.className = 'textLayer';
                            textLayerDiv.style.width = canvasWrapper.style.width;
                            textLayerDiv.style.height = canvasWrapper.style.height;
                            if (this.annotationLayer && this.annotationLayer.div) {
                                div.insertBefore(textLayerDiv, this.annotationLayer.div);
                            } else {
                                div.appendChild(textLayerDiv);
                            }
                            textLayer = this.textLayerFactory.createTextLayerBuilder(textLayerDiv, this.id - 1, this.viewport, this.enhanceTextSelection);
                        }
                        this.textLayer = textLayer;
                        var renderContinueCallback = null;
                        if (this.renderingQueue) {
                            renderContinueCallback = function renderContinueCallback(cont) {
                                if (!self.renderingQueue.isHighestPriority(self)) {
                                    self.renderingState = RenderingStates.PAUSED;
                                    self.resume = function resumeCallback() {
                                        self.renderingState = RenderingStates.RUNNING;
                                        cont();
                                    };
                                    return;
                                }
                                cont();
                            };
                        }
                        var finishPaintTask = function finishPaintTask(error) {
                            if (paintTask === self.paintTask) {
                                self.paintTask = null;
                            }
                            if (error === 'cancelled') {
                                self.error = null;
                                return Promise.resolve(undefined);
                            }
                            self.renderingState = RenderingStates.FINISHED;
                            if (self.loadingIconDiv) {
                                div.removeChild(self.loadingIconDiv);
                                delete self.loadingIconDiv;
                            }
                            if (self.zoomLayer) {
                                var zoomLayerCanvas = self.zoomLayer.firstChild;
                                self.paintedViewportMap.delete(zoomLayerCanvas);
                                zoomLayerCanvas.width = 0;
                                zoomLayerCanvas.height = 0;
                                if (div.contains(self.zoomLayer)) {
                                    div.removeChild(self.zoomLayer);
                                }
                                self.zoomLayer = null;
                            }
                            self.error = error;
                            self.stats = pdfPage.stats;
                            if (self.onAfterDraw) {
                                self.onAfterDraw();
                            }
                            if (error) {
                                return Promise.reject(error);
                            }
                            return Promise.resolve(undefined);
                        };
                        var paintTask = this.renderer === RendererType.SVG ? this.paintOnSvg(canvasWrapper) : this.paintOnCanvas(canvasWrapper);
                        paintTask.onRenderContinue = renderContinueCallback;
                        this.paintTask = paintTask;
                        var resultPromise = paintTask.promise.then(function() {
                            return finishPaintTask(null).then(function() {
                                if (textLayer) {
                                    pdfPage.getTextContent({
                                        normalizeWhitespace: true
                                    }).then(function textContentResolved(textContent) {
                                        textLayer.setTextContent(textContent);
                                        textLayer.render(TEXT_LAYER_RENDER_DELAY);
                                    });
                                }
                            });
                        }, function(reason) {
                            return finishPaintTask(reason);
                        });
                        div.setAttribute('data-loaded', true);
                        if (this.onBeforeDraw) {
                            this.onBeforeDraw();
                        }
                        return resultPromise;
                    },
                    paintOnCanvas: function(canvasWrapper) {
                        var resolveRenderPromise, rejectRenderPromise;
                        var promise = new Promise(function(resolve, reject) {
                            resolveRenderPromise = resolve;
                            rejectRenderPromise = reject;
                        });
                        var result = {
                            promise: promise,
                            onRenderContinue: function(cont) {
                                cont();
                            },
                            cancel: function() {
                                renderTask.cancel();
                            }
                        };
                        var self = this;
                        var pdfPage = this.pdfPage;
                        var viewport = this.viewport;
                        var canvas = document.createElement('canvas');
                        canvas.id = 'page' + this.id;
                        canvas.setAttribute('hidden', 'hidden');
                        var isCanvasHidden = true;
                        var showCanvas = function() {
                            if (isCanvasHidden) {
                                canvas.removeAttribute('hidden');
                                isCanvasHidden = false;
                            }
                        };
                        canvasWrapper.appendChild(canvas);
                        this.canvas = canvas;
                        canvas.mozOpaque = true;
                        var ctx = canvas.getContext('2d', {
                            alpha: false
                        });
                        var outputScale = getOutputScale(ctx);
                        this.outputScale = outputScale;
                        if (pdfjsLib.PDFJS.useOnlyCssZoom) {
                            var actualSizeViewport = viewport.clone({
                                scale: CSS_UNITS
                            });
                            outputScale.sx *= actualSizeViewport.width / viewport.width;
                            outputScale.sy *= actualSizeViewport.height / viewport.height;
                            outputScale.scaled = true;
                        }
                        if (pdfjsLib.PDFJS.maxCanvasPixels > 0) {
                            var pixelsInViewport = viewport.width * viewport.height;
                            var maxScale = Math.sqrt(pdfjsLib.PDFJS.maxCanvasPixels / pixelsInViewport);
                            if (outputScale.sx > maxScale || outputScale.sy > maxScale) {
                                outputScale.sx = maxScale;
                                outputScale.sy = maxScale;
                                outputScale.scaled = true;
                                this.hasRestrictedScaling = true;
                            } else {
                                this.hasRestrictedScaling = false;
                            }
                        }
                        var sfx = approximateFraction(outputScale.sx);
                        var sfy = approximateFraction(outputScale.sy);
                        canvas.width = roundToDivide(viewport.width * outputScale.sx, sfx[0]);
                        canvas.height = roundToDivide(viewport.height * outputScale.sy, sfy[0]);
                        canvas.style.width = roundToDivide(viewport.width, sfx[1]) + 'px';
                        canvas.style.height = roundToDivide(viewport.height, sfy[1]) + 'px';
                        this.paintedViewportMap.set(canvas, viewport);
                        var transform = !outputScale.scaled ? null : [
                            outputScale.sx,
                            0,
                            0,
                            outputScale.sy,
                            0,
                            0
                        ];
                        var renderContext = {
                            canvasContext: ctx,
                            transform: transform,
                            viewport: this.viewport,
                            renderInteractiveForms: this.renderInteractiveForms
                        };
                        var renderTask = this.pdfPage.render(renderContext);
                        renderTask.onContinue = function(cont) {
                            showCanvas();
                            if (result.onRenderContinue) {
                                result.onRenderContinue(cont);
                            } else {
                                cont();
                            }
                        };
                        renderTask.promise.then(function pdfPageRenderCallback() {
                            showCanvas();
                            resolveRenderPromise(undefined);
                        }, function pdfPageRenderError(error) {
                            showCanvas();
                            rejectRenderPromise(error);
                        });
                        return result;
                    },
                    paintOnSvg: function PDFPageView_paintOnSvg(wrapper) {
                        var cancelled = false;
                        var ensureNotCancelled = function() {
                            if (cancelled) {
                                throw 'cancelled';
                            }
                        };
                        var self = this;
                        var pdfPage = this.pdfPage;
                        var SVGGraphics = pdfjsLib.SVGGraphics;
                        var actualSizeViewport = this.viewport.clone({
                            scale: CSS_UNITS
                        });
                        var promise = pdfPage.getOperatorList().then(function(opList) {
                            ensureNotCancelled();
                            var svgGfx = new SVGGraphics(pdfPage.commonObjs, pdfPage.objs);
                            return svgGfx.getSVG(opList, actualSizeViewport).then(function(svg) {
                                ensureNotCancelled();
                                self.svg = svg;
                                self.paintedViewportMap.set(svg, actualSizeViewport);
                                svg.style.width = wrapper.style.width;
                                svg.style.height = wrapper.style.height;
                                self.renderingState = RenderingStates.FINISHED;
                                wrapper.appendChild(svg);
                            });
                        });
                        return {
                            promise: promise,
                            onRenderContinue: function(cont) {
                                cont();
                            },
                            cancel: function() {
                                cancelled = true;
                            }
                        };
                    },
                    setPageLabel: function PDFView_setPageLabel(label) {
                        this.pageLabel = typeof label === 'string' ? label : null;
                        if (this.pageLabel !== null) {
                            this.div.setAttribute('data-page-label', this.pageLabel);
                        } else {
                            this.div.removeAttribute('data-page-label');
                        }
                    }
                };
                return PDFPageView;
            }();
            exports.PDFPageView = PDFPageView;
        }));
        (function(root, factory) {
            factory(root.pdfjsWebTextLayerBuilder = {}, root.pdfjsWebPDFJS);
        }(this, function(exports, pdfjsLib) {
            var EXPAND_DIVS_TIMEOUT = 300;
            var TextLayerBuilder = function TextLayerBuilderClosure() {
                function TextLayerBuilder(options) {
                    this.textLayerDiv = options.textLayerDiv;
                    this.textContent = null;
                    this.renderingDone = false;
                    this.pageIdx = options.pageIndex;
                    this.pageNumber = this.pageIdx + 1;
                    this.matches = [];
                    this.viewport = options.viewport;
                    this.textDivs = [];
                    this.findController = options.findController || null;
                    this.textLayerRenderTask = null;
                    this.enhanceTextSelection = options.enhanceTextSelection;
                    this._bindMouse();
                }
                TextLayerBuilder.prototype = {
                    _finishRendering: function TextLayerBuilder_finishRendering() {
                        this.renderingDone = true;
                        if (!this.enhanceTextSelection) {
                            var endOfContent = document.createElement('div');
                            endOfContent.className = 'endOfContent';
                            this.textLayerDiv.appendChild(endOfContent);
                        }
                    },
                    render: function TextLayerBuilder_render(timeout) {
                        if (!this.textContent || this.renderingDone) {
                            return;
                        }
                        this.cancel();
                        this.textDivs = [];
                        var textLayerFrag = document.createDocumentFragment();
                        this.textLayerRenderTask = pdfjsLib.renderTextLayer({
                            textContent: this.textContent,
                            container: textLayerFrag,
                            viewport: this.viewport,
                            textDivs: this.textDivs,
                            timeout: timeout,
                            enhanceTextSelection: this.enhanceTextSelection
                        });
                        this.textLayerRenderTask.promise.then(function() {
                            this.textLayerDiv.appendChild(textLayerFrag);
                            this._finishRendering();
                            this.updateMatches();
                        }.bind(this), function(reason) {});
                    },
                    cancel: function TextLayerBuilder_cancel() {
                        if (this.textLayerRenderTask) {
                            this.textLayerRenderTask.cancel();
                            this.textLayerRenderTask = null;
                        }
                    },
                    setTextContent: function TextLayerBuilder_setTextContent(textContent) {
                        this.cancel();
                        this.textContent = textContent;
                    },
                    convertMatches: function TextLayerBuilder_convertMatches(matches, matchesLength) {
                        var i = 0;
                        var iIndex = 0;
                        var bidiTexts = this.textContent.items;
                        var end = bidiTexts.length - 1;
                        var queryLen = this.findController === null ? 0 : this.findController.state.query.length;
                        var ret = [];
                        if (!matches) {
                            return ret;
                        }
                        for (var m = 0, len = matches.length; m < len; m++) {
                            var matchIdx = matches[m];
                            while (i !== end && matchIdx >= iIndex + bidiTexts[i].str.length) {
                                iIndex += bidiTexts[i].str.length;
                                i++;
                            }
                            if (i === bidiTexts.length) {
                                console.error('Could not find a matching mapping');
                            }
                            var match = {
                                begin: {
                                    divIdx: i,
                                    offset: matchIdx - iIndex
                                }
                            };
                            if (matchesLength) {
                                matchIdx += matchesLength[m];
                            } else {
                                matchIdx += queryLen;
                            }
                            while (i !== end && matchIdx > iIndex + bidiTexts[i].str.length) {
                                iIndex += bidiTexts[i].str.length;
                                i++;
                            }
                            match.end = {
                                divIdx: i,
                                offset: matchIdx - iIndex
                            };
                            ret.push(match);
                        }
                        return ret;
                    },
                    renderMatches: function TextLayerBuilder_renderMatches(matches) {
                        if (matches.length === 0) {
                            return;
                        }
                        var bidiTexts = this.textContent.items;
                        var textDivs = this.textDivs;
                        var prevEnd = null;
                        var pageIdx = this.pageIdx;
                        var isSelectedPage = this.findController === null ? false : pageIdx === this.findController.selected.pageIdx;
                        var selectedMatchIdx = this.findController === null ? -1 : this.findController.selected.matchIdx;
                        var highlightAll = this.findController === null ? false : this.findController.state.highlightAll;
                        var infinity = {
                            divIdx: -1,
                            offset: undefined
                        };

                        function beginText(begin, className) {
                            var divIdx = begin.divIdx;
                            textDivs[divIdx].textContent = '';
                            appendTextToDiv(divIdx, 0, begin.offset, className);
                        }

                        function appendTextToDiv(divIdx, fromOffset, toOffset, className) {
                            var div = textDivs[divIdx];
                            var content = bidiTexts[divIdx].str.substring(fromOffset, toOffset);
                            var node = document.createTextNode(content);
                            if (className) {
                                var span = document.createElement('span');
                                span.className = className;
                                span.appendChild(node);
                                div.appendChild(span);
                                return;
                            }
                            div.appendChild(node);
                        }
                        var i0 = selectedMatchIdx,
                            i1 = i0 + 1;
                        if (highlightAll) {
                            i0 = 0;
                            i1 = matches.length;
                        } else if (!isSelectedPage) {
                            return;
                        }
                        for (var i = i0; i < i1; i++) {
                            var match = matches[i];
                            var begin = match.begin;
                            var end = match.end;
                            var isSelected = isSelectedPage && i === selectedMatchIdx;
                            var highlightSuffix = isSelected ? ' selected' : '';
                            if (this.findController) {
                                this.findController.updateMatchPosition(pageIdx, i, textDivs, begin.divIdx);
                            }
                            if (!prevEnd || begin.divIdx !== prevEnd.divIdx) {
                                if (prevEnd !== null) {
                                    appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset);
                                }
                                beginText(begin);
                            } else {
                                appendTextToDiv(prevEnd.divIdx, prevEnd.offset, begin.offset);
                            }
                            if (begin.divIdx === end.divIdx) {
                                appendTextToDiv(begin.divIdx, begin.offset, end.offset, 'highlight' + highlightSuffix);
                            } else {
                                appendTextToDiv(begin.divIdx, begin.offset, infinity.offset, 'highlight begin' + highlightSuffix);
                                for (var n0 = begin.divIdx + 1, n1 = end.divIdx; n0 < n1; n0++) {
                                    textDivs[n0].className = 'highlight middle' + highlightSuffix;
                                }
                                beginText(end, 'highlight end' + highlightSuffix);
                            }
                            prevEnd = end;
                        }
                        if (prevEnd) {
                            appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset);
                        }
                    },
                    updateMatches: function TextLayerBuilder_updateMatches() {
                        if (!this.renderingDone) {
                            return;
                        }
                        var matches = this.matches;
                        var textDivs = this.textDivs;
                        var bidiTexts = this.textContent.items;
                        var clearedUntilDivIdx = -1;
                        for (var i = 0, len = matches.length; i < len; i++) {
                            var match = matches[i];
                            var begin = Math.max(clearedUntilDivIdx, match.begin.divIdx);
                            for (var n = begin, end = match.end.divIdx; n <= end; n++) {
                                var div = textDivs[n];
                                div.textContent = bidiTexts[n].str;
                                div.className = '';
                            }
                            clearedUntilDivIdx = match.end.divIdx + 1;
                        }
                        if (this.findController === null || !this.findController.active) {
                            return;
                        }
                        var pageMatches, pageMatchesLength;
                        if (this.findController !== null) {
                            pageMatches = this.findController.pageMatches[this.pageIdx] || null;
                            pageMatchesLength = this.findController.pageMatchesLength ? this.findController.pageMatchesLength[this.pageIdx] || null : null;
                        }
                        this.matches = this.convertMatches(pageMatches, pageMatchesLength);
                        this.renderMatches(this.matches);
                    },
                    _bindMouse: function TextLayerBuilder_bindMouse() {
                        var div = this.textLayerDiv;
                        var self = this;
                        var expandDivsTimer = null;
                        div.addEventListener('mousedown', function(e) {
                            if (self.enhanceTextSelection && self.textLayerRenderTask) {
                                self.textLayerRenderTask.expandTextDivs(true);
                                if (expandDivsTimer) {
                                    clearTimeout(expandDivsTimer);
                                    expandDivsTimer = null;
                                }
                                return;
                            }
                            var end = div.querySelector('.endOfContent');
                            if (!end) {
                                return;
                            }
                            var adjustTop = e.target !== div;
                            adjustTop = adjustTop && window.getComputedStyle(end).getPropertyValue('-moz-user-select') !== 'none';
                            if (adjustTop) {
                                var divBounds = div.getBoundingClientRect();
                                var r = Math.max(0, (e.pageY - divBounds.top) / divBounds.height);
                                end.style.top = (r * 100).toFixed(2) + '%';
                            }
                            end.classList.add('active');
                        });
                        div.addEventListener('mouseup', function(e) {
                            if (self.enhanceTextSelection && self.textLayerRenderTask) {
                                expandDivsTimer = setTimeout(function() {
                                    if (self.textLayerRenderTask) {
                                        self.textLayerRenderTask.expandTextDivs(false);
                                    }
                                    expandDivsTimer = null;
                                }, EXPAND_DIVS_TIMEOUT);
                                return;
                            }
                            var end = div.querySelector('.endOfContent');
                            if (!end) {
                                return;
                            }
                            end.style.top = '';
                            end.classList.remove('active');
                        });
                    }
                };
                return TextLayerBuilder;
            }();

            function DefaultTextLayerFactory() {}
            DefaultTextLayerFactory.prototype = {
                createTextLayerBuilder: function(textLayerDiv, pageIndex, viewport, enhanceTextSelection) {
                    return new TextLayerBuilder({
                        textLayerDiv: textLayerDiv,
                        pageIndex: pageIndex,
                        viewport: viewport,
                        enhanceTextSelection: enhanceTextSelection
                    });
                }
            };
            exports.TextLayerBuilder = TextLayerBuilder;
            exports.DefaultTextLayerFactory = DefaultTextLayerFactory;
        }));
        (function(root, factory) {
            factory(root.pdfjsWebPDFViewer = {}, root.pdfjsWebUIUtils, root.pdfjsWebPDFPageView, root.pdfjsWebPDFRenderingQueue, root.pdfjsWebTextLayerBuilder, root.pdfjsWebPDFJS);
        }(this, function(exports, uiUtils, pdfPageView, pdfRenderingQueue, textLayerBuilder, pdfjsLib) {
            var UNKNOWN_SCALE = uiUtils.UNKNOWN_SCALE;
            var SCROLLBAR_PADDING = uiUtils.SCROLLBAR_PADDING;
            var VERTICAL_PADDING = uiUtils.VERTICAL_PADDING;
            var MAX_AUTO_SCALE = uiUtils.MAX_AUTO_SCALE;
            var CSS_UNITS = uiUtils.CSS_UNITS;
            var DEFAULT_SCALE = uiUtils.DEFAULT_SCALE;
            var DEFAULT_SCALE_VALUE = uiUtils.DEFAULT_SCALE_VALUE;
            var RendererType = uiUtils.RendererType;
            var scrollIntoView = uiUtils.scrollIntoView;
            var watchScroll = uiUtils.watchScroll;
            var getVisibleElements = uiUtils.getVisibleElements;
            var PDFPageView = pdfPageView.PDFPageView;
            var RenderingStates = pdfRenderingQueue.RenderingStates;
            var PDFRenderingQueue = pdfRenderingQueue.PDFRenderingQueue;
            var TextLayerBuilder = textLayerBuilder.TextLayerBuilder;
            var DEFAULT_CACHE_SIZE = 10;
            var PDFViewer = function pdfViewer() {
                function PDFPageViewBuffer(size) {
                    var data = [];
                    this.push = function cachePush(view) {
                        var i = data.indexOf(view);
                        if (i >= 0) {
                            data.splice(i, 1);
                        }
                        data.push(view);
                        if (data.length > size) {
                            data.shift().destroy();
                        }
                    };
                    this.resize = function(newSize) {
                        size = newSize;
                        while (data.length > size) {
                            data.shift().destroy();
                        }
                    };
                }

                function isSameScale(oldScale, newScale) {
                    if (newScale === oldScale) {
                        return true;
                    }
                    if (Math.abs(newScale - oldScale) < 1e-15) {
                        return true;
                    }
                    return false;
                }

                function PDFViewer(options) {
                    this.container = options.container;
                    this.viewer = options.viewer || options.container.firstElementChild;
                    this.removePageBorders = options.removePageBorders || false;
                    this.enhanceTextSelection = options.enhanceTextSelection || false;
                    this.renderInteractiveForms = options.renderInteractiveForms || false;
                    this.renderer = options.renderer || RendererType.CANVAS;
                    this.defaultRenderingQueue = !options.renderingQueue;
                    if (this.defaultRenderingQueue) {
                        this.renderingQueue = new PDFRenderingQueue();
                        this.renderingQueue.setViewer(this);
                    } else {
                        this.renderingQueue = options.renderingQueue;
                    }
                    this.scroll = watchScroll(this.container, this._scrollUpdate.bind(this));
                    this._resetView();
                    if (this.removePageBorders) {
                        this.viewer.classList.add('removePageBorders');
                    }
                }
                PDFViewer.prototype = {
                    get pagesCount() {
                        return this._pages.length;
                    },
                    getPageView: function(index) {
                        return this._pages[index];
                    },
                    get pageViewsReady() {
                        return this._pageViewsReady;
                    },
                    get currentPageNumber() {
                        return this._currentPageNumber;
                    },
                    set currentPageNumber(val) {
                        if ((val | 0) !== val) {
                            throw new Error('Invalid page number.');
                        }
                        if (!this.pdfDocument) {
                            this._currentPageNumber = val;
                            return;
                        }
                        this._setCurrentPageNumber(val, true);
                    },
                    _setCurrentPageNumber: function PDFViewer_setCurrentPageNumber(val, resetCurrentPageView) {
                        if (this._currentPageNumber === val) {
                            if (resetCurrentPageView) {
                                this._resetCurrentPageView();
                            }
                            return;
                        }
                        if (!(0 < val && val <= this.pagesCount)) {
                            console.error('PDFViewer_setCurrentPageNumber: "' + val + '" is out of bounds.');
                            return;
                        }
                        var arg = {
                            source: this,
                            pageNumber: val,
                            pageLabel: this._pageLabels && this._pageLabels[val - 1]
                        };
                        this._currentPageNumber = val;
                        if (resetCurrentPageView) {
                            this._resetCurrentPageView();
                        }
                    },
                    get currentPageLabel() {
                        return this._pageLabels && this._pageLabels[this._currentPageNumber - 1];
                    },
                    set currentPageLabel(val) {
                        var pageNumber = val | 0;
                        if (this._pageLabels) {
                            var i = this._pageLabels.indexOf(val);
                            if (i >= 0) {
                                pageNumber = i + 1;
                            }
                        }
                        this.currentPageNumber = pageNumber;
                    },
                    get currentScale() {
                        return this._currentScale !== UNKNOWN_SCALE ? this._currentScale : DEFAULT_SCALE;
                    },
                    set currentScale(val) {
                        if (isNaN(val)) {
                            throw new Error('Invalid numeric scale');
                        }
                        if (!this.pdfDocument) {
                            this._currentScale = val;
                            this._currentScaleValue = val !== UNKNOWN_SCALE ? val.toString() : null;
                            return;
                        }
                        this._setScale(val, false);
                    },
                    get currentScaleValue() {
                        return this._currentScaleValue;
                    },
                    set currentScaleValue(val) {
                        if (!this.pdfDocument) {
                            this._currentScale = isNaN(val) ? UNKNOWN_SCALE : val;
                            this._currentScaleValue = val.toString();
                            return;
                        }
                        this._setScale(val, false);
                    },
                    get pagesRotation() {
                        return this._pagesRotation;
                    },
                    set pagesRotation(rotation) {
                        if (!(typeof rotation === 'number' && rotation % 90 === 0)) {
                            throw new Error('Invalid pages rotation angle.');
                        }
                        this._pagesRotation = rotation;
                        if (!this.pdfDocument) {
                            return;
                        }
                        for (var i = 0, l = this._pages.length; i < l; i++) {
                            var pageView = this._pages[i];
                            pageView.update(pageView.scale, rotation);
                        }
                        this._setScale(this._currentScaleValue, true);
                        if (this.defaultRenderingQueue) {
                            this.update();
                        }
                    },
                    setDocument: function(pdfDocument) {
                        if (this.pdfDocument) {
                            this._cancelRendering();
                            this._resetView();
                        }
                        this.pdfDocument = pdfDocument;
                        if (!pdfDocument) {
                            return;
                        }
                        var pagesCount = pdfDocument.numPages;
                        var self = this;
                        var resolvePagesPromise;
                        var pagesPromise = new Promise(function(resolve) {
                            resolvePagesPromise = resolve;
                        });
                        this.pagesPromise = pagesPromise;
                        pagesPromise.then(function() {
                            self._pageViewsReady = true;
                        });
                        var isOnePageRenderedResolved = false;
                        var resolveOnePageRendered = null;
                        var onePageRendered = new Promise(function(resolve) {
                            resolveOnePageRendered = resolve;
                        });
                        this.onePageRendered = onePageRendered;
                        var bindOnAfterAndBeforeDraw = function(pageView) {
                            pageView.onBeforeDraw = function pdfViewLoadOnBeforeDraw() {
                                self._buffer.push(this);
                            };
                            pageView.onAfterDraw = function pdfViewLoadOnAfterDraw() {
                                if (!isOnePageRenderedResolved) {
                                    isOnePageRenderedResolved = true;
                                    resolveOnePageRendered();
                                }
                            };
                        };
                        var firstPagePromise = pdfDocument.getPage(1);
                        this.firstPagePromise = firstPagePromise;
                        return firstPagePromise.then(function(pdfPage) {
                            var scale = this.currentScale;
                            var viewport = pdfPage.getViewport(scale * CSS_UNITS);
                            for (var pageNum = 1; pageNum <= pagesCount; ++pageNum) {
                                var textLayerFactory = null;
                                if (!pdfjsLib.PDFJS.disableTextLayer) {
                                    textLayerFactory = this;
                                }
                                var pageView = new PDFPageView({
                                    container: this.viewer,
                                    id: pageNum,
                                    scale: scale,
                                    defaultViewport: viewport.clone(),
                                    renderingQueue: this.renderingQueue,
                                    textLayerFactory: textLayerFactory,
                                    annotationLayerFactory: this,
                                    enhanceTextSelection: this.enhanceTextSelection,
                                    renderInteractiveForms: this.renderInteractiveForms,
                                    renderer: this.renderer
                                });
                                bindOnAfterAndBeforeDraw(pageView);
                                this._pages.push(pageView);
                            }
                            var linkService = this.linkService;
                            onePageRendered.then(function() {
                                if (!pdfjsLib.PDFJS.disableAutoFetch) {
                                    var getPagesLeft = pagesCount;
                                    for (var pageNum = 1; pageNum <= pagesCount; ++pageNum) {
                                        pdfDocument.getPage(pageNum).then(function(pageNum, pdfPage) {
                                            var pageView = self._pages[pageNum - 1];
                                            if (!pageView.pdfPage) {
                                                pageView.setPdfPage(pdfPage);
                                            }
                                            getPagesLeft--;
                                            if (!getPagesLeft) {
                                                resolvePagesPromise();
                                            }
                                        }.bind(null, pageNum));
                                    }
                                } else {
                                    resolvePagesPromise();
                                }
                            });
                            if (this.defaultRenderingQueue) {
                                this.update();
                            }
                            if (this.findController) {
                                this.findController.resolveFirstPage();
                            }
                        }.bind(this));
                    },
                    setPageLabels: function PDFViewer_setPageLabels(labels) {
                        if (!this.pdfDocument) {
                            return;
                        }
                        if (!labels) {
                            this._pageLabels = null;
                        } else if (!(labels instanceof Array && this.pdfDocument.numPages === labels.length)) {
                            this._pageLabels = null;
                            console.error('PDFViewer_setPageLabels: Invalid page labels.');
                        } else {
                            this._pageLabels = labels;
                        }
                        for (var i = 0, ii = this._pages.length; i < ii; i++) {
                            var pageView = this._pages[i];
                            var label = this._pageLabels && this._pageLabels[i];
                            pageView.setPageLabel(label);
                        }
                    },
                    _resetView: function() {
                        this._pages = [];
                        this._currentPageNumber = 1;
                        this._currentScale = UNKNOWN_SCALE;
                        this._currentScaleValue = null;
                        this._pageLabels = null;
                        this._buffer = new PDFPageViewBuffer(DEFAULT_CACHE_SIZE);
                        this._location = null;
                        this._pagesRotation = 0;
                        this._pagesRequests = [];
                        this._pageViewsReady = false;
                        this.viewer.textContent = '';
                    },
                    _scrollUpdate: function PDFViewer_scrollUpdate() {
                        if (this.pagesCount === 0) {
                            return;
                        }
                        this.update();
                        for (var i = 0, ii = this._pages.length; i < ii; i++) {
                            this._pages[i].updatePosition();
                        }
                    },
                    _setScaleDispatchEvent: function pdfViewer_setScaleDispatchEvent(newScale, newValue, preset) {
                        var arg = {
                            source: this,
                            scale: newScale,
                            presetValue: preset ? newValue : undefined
                        }
                    },
                    _setScaleUpdatePages: function pdfViewer_setScaleUpdatePages(newScale, newValue, noScroll, preset) {
                        this._currentScaleValue = newValue.toString();
                        if (isSameScale(this._currentScale, newScale)) {
                            if (preset) {
                                this._setScaleDispatchEvent(newScale, newValue, true);
                            }
                            return;
                        }
                        for (var i = 0, ii = this._pages.length; i < ii; i++) {
                            this._pages[i].update(newScale);
                        }
                        this._currentScale = newScale;
                        if (!noScroll) {
                            var page = this._currentPageNumber,
                                dest;
                            if (this._location && !pdfjsLib.PDFJS.ignoreCurrentPositionOnZoom && !(this.isInPresentationMode || this.isChangingPresentationMode)) {
                                page = this._location.pageNumber;
                                dest = [
                                    null, {
                                        name: 'XYZ'
                                    },
                                    this._location.left,
                                    this._location.top,
                                    null
                                ];
                            }
                            this.scrollPageIntoView({
                                pageNumber: page,
                                destArray: dest,
                                allowNegativeOffset: true
                            });
                        }
                        this._setScaleDispatchEvent(newScale, newValue, preset);
                        if (this.defaultRenderingQueue) {
                            this.update();
                        }
                    },
                    _setScale: function PDFViewer_setScale(value, noScroll) {
                        var scale = parseFloat(value);
                        if (scale > 0) {
                            this._setScaleUpdatePages(scale, value, noScroll, false);
                        } else {
                            var currentPage = this._pages[this._currentPageNumber - 1];
                            if (!currentPage) {
                                return;
                            }
                            var hPadding = this.isInPresentationMode || this.removePageBorders ? 0 : SCROLLBAR_PADDING;
                            var vPadding = this.isInPresentationMode || this.removePageBorders ? 0 : VERTICAL_PADDING;
                            var pageWidthScale = (this.container.clientWidth - hPadding) / currentPage.width * currentPage.scale;
                            var pageHeightScale = (this.container.clientHeight - vPadding) / currentPage.height * currentPage.scale;
                            switch (value) {
                                case 'page-actual':
                                    scale = 1;
                                    break;
                                case 'page-width':
                                    scale = pageWidthScale;
                                    break;
                                case 'page-height':
                                    scale = pageHeightScale;
                                    break;
                                case 'page-fit':
                                    scale = Math.min(pageWidthScale, pageHeightScale);
                                    break;
                                case 'auto':
                                    var isLandscape = currentPage.width > currentPage.height;
                                    var horizontalScale = isLandscape ? Math.min(pageHeightScale, pageWidthScale) : pageWidthScale;
                                    scale = Math.min(MAX_AUTO_SCALE, horizontalScale);
                                    break;
                                default:
                                    console.error('PDFViewer_setScale: "' + value + '" is an unknown zoom value.');
                                    return;
                            }
                            this._setScaleUpdatePages(scale, value, noScroll, true);
                        }
                    },
                    _resetCurrentPageView: function() {
                        if (this.isInPresentationMode) {
                            this._setScale(this._currentScaleValue, true);
                        }
                        var pageView = this._pages[this._currentPageNumber - 1];
                        scrollIntoView(pageView.div);
                    },
                    scrollPageIntoView: function PDFViewer_scrollPageIntoView(params) {
                        if (!this.pdfDocument) {
                            return;
                        }
                        if (arguments.length > 1 || typeof params === 'number') {
                            console.warn('Call of scrollPageIntoView() with obsolete signature.');
                            var paramObj = {};
                            if (typeof params === 'number') {
                                paramObj.pageNumber = params;
                            }
                            if (arguments[1] instanceof Array) {
                                paramObj.destArray = arguments[1];
                            }
                            params = paramObj;
                        }
                        var pageNumber = params.pageNumber || 0;
                        var dest = params.destArray || null;
                        var allowNegativeOffset = params.allowNegativeOffset || false;
                        if (this.isInPresentationMode || !dest) {
                            this._setCurrentPageNumber(pageNumber, true);
                            return;
                        }
                        var pageView = this._pages[pageNumber - 1];
                        if (!pageView) {
                            console.error('PDFViewer_scrollPageIntoView: ' + 'Invalid "pageNumber" parameter.');
                            return;
                        }
                        var x = 0,
                            y = 0;
                        var width = 0,
                            height = 0,
                            widthScale, heightScale;
                        var changeOrientation = pageView.rotation % 180 === 0 ? false : true;
                        var pageWidth = (changeOrientation ? pageView.height : pageView.width) / pageView.scale / CSS_UNITS;
                        var pageHeight = (changeOrientation ? pageView.width : pageView.height) / pageView.scale / CSS_UNITS;
                        var scale = 0;
                        switch (dest[1].name) {
                            case 'XYZ':
                                x = dest[2];
                                y = dest[3];
                                scale = dest[4];
                                x = x !== null ? x : 0;
                                y = y !== null ? y : pageHeight;
                                break;
                            case 'Fit':
                            case 'FitB':
                                scale = 'page-fit';
                                break;
                            case 'FitH':
                            case 'FitBH':
                                y = dest[2];
                                scale = 'page-width';
                                if (y === null && this._location) {
                                    x = this._location.left;
                                    y = this._location.top;
                                }
                                break;
                            case 'FitV':
                            case 'FitBV':
                                x = dest[2];
                                width = pageWidth;
                                height = pageHeight;
                                scale = 'page-height';
                                break;
                            case 'FitR':
                                x = dest[2];
                                y = dest[3];
                                width = dest[4] - x;
                                height = dest[5] - y;
                                var hPadding = this.removePageBorders ? 0 : SCROLLBAR_PADDING;
                                var vPadding = this.removePageBorders ? 0 : VERTICAL_PADDING;
                                widthScale = (this.container.clientWidth - hPadding) / width / CSS_UNITS;
                                heightScale = (this.container.clientHeight - vPadding) / height / CSS_UNITS;
                                scale = Math.min(Math.abs(widthScale), Math.abs(heightScale));
                                break;
                            default:
                                console.error('PDFViewer_scrollPageIntoView: \'' + dest[1].name + '\' is not a valid destination type.');
                                return;
                        }
                        if (scale && scale !== this._currentScale) {
                            this.currentScaleValue = scale;
                        } else if (this._currentScale === UNKNOWN_SCALE) {
                            this.currentScaleValue = DEFAULT_SCALE_VALUE;
                        }
                        if (scale === 'page-fit' && !dest[4]) {
                            scrollIntoView(pageView.div);
                            return;
                        }
                        var boundingRect = [
                            pageView.viewport.convertToViewportPoint(x, y),
                            pageView.viewport.convertToViewportPoint(x + width, y + height)
                        ];
                        var left = Math.min(boundingRect[0][0], boundingRect[1][0]);
                        var top = Math.min(boundingRect[0][1], boundingRect[1][1]);
                        if (!allowNegativeOffset) {
                            left = Math.max(left, 0);
                            top = Math.max(top, 0);
                        }
                        scrollIntoView(pageView.div, {
                            left: left,
                            top: top
                        });
                    },
                    _updateLocation: function(firstPage) {
                        var currentScale = this._currentScale;
                        var currentScaleValue = this._currentScaleValue;
                        var normalizedScaleValue = parseFloat(currentScaleValue) === currentScale ? Math.round(currentScale * 10000) / 100 : currentScaleValue;
                        var pageNumber = firstPage.id;
                        var pdfOpenParams = '#page=' + pageNumber;
                        pdfOpenParams += '&zoom=' + normalizedScaleValue;
                        var currentPageView = this._pages[pageNumber - 1];
                        var container = this.container;
                        var topLeft = currentPageView.getPagePoint(container.scrollLeft - firstPage.x, container.scrollTop - firstPage.y);
                        var intLeft = Math.round(topLeft[0]);
                        var intTop = Math.round(topLeft[1]);
                        pdfOpenParams += ',' + intLeft + ',' + intTop;
                        this._location = {
                            pageNumber: pageNumber,
                            scale: normalizedScaleValue,
                            top: intTop,
                            left: intLeft,
                            pdfOpenParams: pdfOpenParams
                        };
                    },
                    update: function PDFViewer_update() {
                        var visible = this._getVisiblePages();
                        var visiblePages = visible.views;
                        if (visiblePages.length === 0) {
                            return;
                        }
                        var suggestedCacheSize = Math.max(DEFAULT_CACHE_SIZE, 2 * visiblePages.length + 1);
                        this._buffer.resize(suggestedCacheSize);
                        this.renderingQueue.renderHighestPriority(visible);
                        var currentId = this._currentPageNumber;
                        var firstPage = visible.first;
                        for (var i = 0, ii = visiblePages.length, stillFullyVisible = false; i < ii; ++i) {
                            var page = visiblePages[i];
                            if (page.percent < 100) {
                                break;
                            }
                            if (page.id === currentId) {
                                stillFullyVisible = true;
                                break;
                            }
                        }
                        if (!stillFullyVisible) {
                            currentId = visiblePages[0].id;
                        }
                        if (!this.isInPresentationMode) {
                            this._setCurrentPageNumber(currentId);
                        }
                        this._updateLocation(firstPage);
                    },
                    containsElement: function(element) {
                        return this.container.contains(element);
                    },
                    focus: function() {
                        this.container.focus();
                    },
                    get isHorizontalScrollbarEnabled() {
                        return this.isInPresentationMode ? false : this.container.scrollWidth > this.container.clientWidth;
                    },
                    _getVisiblePages: function() {
                        if (!this.isInPresentationMode) {
                            return getVisibleElements(this.container, this._pages, true);
                        }
                        var visible = [];
                        var currentPage = this._pages[this._currentPageNumber - 1];
                        visible.push({
                            id: currentPage.id,
                            view: currentPage
                        });
                        return {
                            first: currentPage,
                            last: currentPage,
                            views: visible
                        };
                    },
                    cleanup: function() {
                        for (var i = 0, ii = this._pages.length; i < ii; i++) {
                            if (this._pages[i] && this._pages[i].renderingState !== RenderingStates.FINISHED) {
                                this._pages[i].reset();
                            }
                        }
                    },
                    _cancelRendering: function PDFViewer_cancelRendering() {
                        for (var i = 0, ii = this._pages.length; i < ii; i++) {
                            if (this._pages[i]) {
                                this._pages[i].cancelRendering();
                            }
                        }
                    },
                    _ensurePdfPageLoaded: function(pageView) {
                        if (pageView.pdfPage) {
                            return Promise.resolve(pageView.pdfPage);
                        }
                        var pageNumber = pageView.id;
                        if (this._pagesRequests[pageNumber]) {
                            return this._pagesRequests[pageNumber];
                        }
                        var promise = this.pdfDocument.getPage(pageNumber).then(function(pdfPage) {
                            pageView.setPdfPage(pdfPage);
                            this._pagesRequests[pageNumber] = null;
                            return pdfPage;
                        }.bind(this));
                        this._pagesRequests[pageNumber] = promise;
                        return promise;
                    },
                    forceRendering: function(currentlyVisiblePages) {
                        var visiblePages = currentlyVisiblePages || this._getVisiblePages();
                        var pageView = this.renderingQueue.getHighestPriority(visiblePages, this._pages, this.scroll.down);
                        if (pageView) {
                            this._ensurePdfPageLoaded(pageView).then(function() {
                                this.renderingQueue.renderView(pageView);
                            }.bind(this));
                            return true;
                        }
                        return false;
                    },
                    createTextLayerBuilder: function(textLayerDiv, pageIndex, viewport, enhanceTextSelection) {
                        return new TextLayerBuilder({
                            textLayerDiv: textLayerDiv,
                            pageIndex: pageIndex,
                            viewport: viewport,
                            findController: this.isInPresentationMode ? null : this.findController,
                            enhanceTextSelection: this.isInPresentationMode ? false : enhanceTextSelection
                        });
                    },
                    getPagesOverview: function() {
                        return this._pages.map(function(pageView) {
                            var viewport = pageView.pdfPage.getViewport(1);
                            return {
                                width: viewport.width,
                                height: viewport.height
                            };
                        });
                    }
                };
                return PDFViewer;
            }();
            exports.PDFViewer = PDFViewer;
        }));
        (function(root, factory) {
            factory(root.pdfjsWebApp = {}, root.pdfjsWebUIUtils, root.pdfjsWebPDFViewer, root.pdfjsWebPDFRenderingQueue, root.pdfjsWebPDFJS);
        }(this, function(exports, uiUtilsLib, pdfViewerLib, pdfRenderingQueueLib, pdfjsLib) {
            var UNKNOWN_SCALE = uiUtilsLib.UNKNOWN_SCALE;
            var DEFAULT_SCALE_VALUE = uiUtilsLib.DEFAULT_SCALE_VALUE;
            var MIN_SCALE = uiUtilsLib.MIN_SCALE;
            var MAX_SCALE = uiUtilsLib.MAX_SCALE;
            var ProgressBar = uiUtilsLib.ProgressBar;
            var getPDFFileNameFromURL = uiUtilsLib.getPDFFileNameFromURL;
            var noContextMenuHandler = uiUtilsLib.noContextMenuHandler;
            var mozL10n = uiUtilsLib.mozL10n;
            var parseQueryString = uiUtilsLib.parseQueryString;
            var PDFViewer = pdfViewerLib.PDFViewer;
            var RenderingStates = pdfRenderingQueueLib.RenderingStates;
            var PDFRenderingQueue = pdfRenderingQueueLib.PDFRenderingQueue;
            var normalizeWheelEventDelta = uiUtilsLib.normalizeWheelEventDelta;
            var animationStarted = uiUtilsLib.animationStarted;
            var localized = uiUtilsLib.localized;
            var RendererType = uiUtilsLib.RendererType;
            var DEFAULT_SCALE_DELTA = 1.1;
            var DISABLE_AUTO_FETCH_LOADING_BAR_TIMEOUT = 5000;

            function configure(PDFJS) {
                PDFJS.imageResourcesPath = './images/';
                PDFJS.workerSrc = '../build/pdf.worker.js';
                PDFJS.cMapUrl = '../web/cmaps/';
                PDFJS.cMapPacked = true;
            }
            var PDFViewerApplication = {
                initialBookmark: document.location.hash.substring(1),
                initialDestination: null,
                initialized: false,
                fellback: false,
                appConfig: null,
                pdfDocument: null,
                pdfLoadingTask: null,
                pdfViewer: null,
                pdfRenderingQueue: null,
                pageRotation: 0,
                isInitialViewSet: false,
                viewerPrefs: {
                    pdfBugEnabled: false,
                    showPreviousViewOnLoad: true,
                    defaultZoomValue: '',
                    disablePageLabels: false,
                    renderer: 'canvas',
                    enhanceTextSelection: false,
                    renderInteractiveForms: false
                },
                isViewerEmbedded: window.parent !== window,
                url: '',
                baseUrl: '',
                initialize: function pdfViewInitialize(appConfig) {
                    var self = this;
                    var PDFJS = pdfjsLib.PDFJS;
                    configure(PDFJS);
                    this.appConfig = appConfig;
                    return self._initializeViewerComponents();
                },
                _initializeViewerComponents: function() {
                    var self = this;
                    var appConfig = this.appConfig;
                    return new Promise(function(resolve, reject) {
                        var pdfRenderingQueue = new PDFRenderingQueue();
                        pdfRenderingQueue.onIdle = self.cleanup.bind(self);
                        self.pdfRenderingQueue = pdfRenderingQueue;
                        var container = appConfig.mainContainer;
                        var viewer = appConfig.viewerContainer;
                        self.pdfViewer = new PDFViewer({
                            container: container,
                            viewer: viewer,
                            renderingQueue: pdfRenderingQueue,
                            renderer: self.viewerPrefs['renderer'],
                            enhanceTextSelection: self.viewerPrefs['enhanceTextSelection'],
                            renderInteractiveForms: self.viewerPrefs['renderInteractiveForms']
                        });
                        pdfRenderingQueue.setViewer(self.pdfViewer);
                        resolve(undefined);
                    });
                },
                run: function pdfViewRun(config) {
                    this.initialize(config).then(webViewerInitialized);
                },
                get pagesCount() {
                    return this.pdfDocument ? this.pdfDocument.numPages : 0;
                },
                set page(val) {
                    this.pdfViewer.currentPageNumber = val;
                },
                get page() {
                    return this.pdfViewer.currentPageNumber;
                },
                get loadingBar() {
                    var bar = new ProgressBar('#loadingBar', {});
                    return pdfjsLib.shadow(this, 'loadingBar', bar);
                },
                close: function pdfViewClose() {
                    var errorWrapper = this.appConfig.errorWrapper.container;
                    errorWrapper.setAttribute('hidden', 'true');
                    if (!this.pdfLoadingTask) {
                        return Promise.resolve();
                    }
                    var promise = this.pdfLoadingTask.destroy();
                    this.pdfLoadingTask = null;
                    if (this.pdfDocument) {
                        this.pdfDocument = null;
                        this.pdfViewer.setDocument(null);
                    }
                    this.store = null;
                    this.isInitialViewSet = false;
                    this.findController.reset();
                    this.findBar.reset();
                    if (typeof PDFBug !== 'undefined') {
                        PDFBug.cleanup();
                    }
                    return promise;
                },
                open: function pdfViewOpen(file, args) {
                    if (arguments.length > 2 || typeof args === 'number') {
                        return Promise.reject(new Error('Call of open() with obsolete signature.'));
                    }
                    if (this.pdfLoadingTask) {
                        return this.close().then(function() {
                            return this.open(file, args);
                        }.bind(this));
                    }
                    var parameters = Object.create(null),
                        scale;
                        parameters.url = file;
                    var self = this;
                    var loadingTask = pdfjsLib.getDocument(parameters);
                    this.pdfLoadingTask = loadingTask;
                    loadingTask.onProgress = function getDocumentProgress(progressData) {
                        self.progress(progressData.loaded / progressData.total);
                    };
                    return loadingTask.promise.then(function getDocumentCallback(pdfDocument) {
                        self.load(pdfDocument, scale);
                    });
                },
                progress: function pdfViewProgress(level) {
                    var percent = Math.round(level * 100);
                    if (percent > this.loadingBar.percent || isNaN(percent)) {
                        this.loadingBar.percent = percent;
                        if (pdfjsLib.PDFJS.disableAutoFetch && percent) {
                            if (this.disableAutoFetchLoadingBarTimeout) {
                                clearTimeout(this.disableAutoFetchLoadingBarTimeout);
                                this.disableAutoFetchLoadingBarTimeout = null;
                            }
                            this.loadingBar.show();
                            this.disableAutoFetchLoadingBarTimeout = setTimeout(function() {
                                this.loadingBar.hide();
                                this.disableAutoFetchLoadingBarTimeout = null;
                            }.bind(this), DISABLE_AUTO_FETCH_LOADING_BAR_TIMEOUT);
                        }
                    }
                },
                load: function pdfViewLoad(pdfDocument, scale) {
                    var self = this;
                    scale = scale || UNKNOWN_SCALE;
                    var pdfViewer = this.pdfViewer;
                    pdfViewer.currentScale = scale;
                    pdfViewer.setDocument(pdfDocument);
                },
                cleanup: function pdfViewCleanup() {
                    if (!this.pdfDocument) {
                        return;
                    }
                    this.pdfViewer.cleanup();
                    if (this.pdfViewer.renderer !== RendererType.SVG) {
                        this.pdfDocument.cleanup();
                    }
                },
                forceRendering: function pdfViewForceRendering() {
                    this.pdfRenderingQueue.printing = this.printing;
                    this.pdfRenderingQueue.renderHighestPriority();
                }
            };
            var HOSTED_VIEWER_ORIGINS = [
                'null',
                'http://mozilla.github.io',
                'https://mozilla.github.io'
            ];

            function webViewerInitialized() {
                var file = DEFAULT_URL;
                var waitForBeforeOpening = [];
                var PDFJS = pdfjsLib.PDFJS;
                mozL10n.setLanguage(PDFJS.locale);
                Promise.all(waitForBeforeOpening).then(function() {
                    if (file) {
                        PDFViewerApplication.open(file);
                    }
                })
            }
            exports.PDFViewerApplication = PDFViewerApplication;
        }));
    }.call(pdfjsWebLibs));
};

function getViewerConfiguration() {
    return {
        appContainer: document.body,
        mainContainer: document.getElementById('viewerContainer'),
        viewerContainer: document.getElementById('viewer'),
        debuggerScriptPath: './debugger.js'
    };
}

function webViewerLoad() {
    var config = getViewerConfiguration();
    window.PDFViewerApplication = pdfjsWebLibs.pdfjsWebApp.PDFViewerApplication;
    pdfjsWebLibs.pdfjsWebApp.PDFViewerApplication.run(config);
}

function getPdfPageTime(key) {
    //获取页面结束的时间
    var end_time = localStorage.getItem(key+"_end");
    var start_time = localStorage.getItem(key+"_start");
    if(!start_time){
        start_time = pdf_start_time;
    }
    //时间差
    var start_end = Number(end_time) - Number(start_time);
    if(localStorage.getItem(key)){
        start_end = Number(start_end) + Number(localStorage.getItem(key));
    }
    window.localStorage.removeItem(key+"_end");
    window.localStorage.removeItem(key+"_start");
    localStorage.setItem(key,start_end);
}

function setPdfPageTime(key) {
  if(window.localStorage){
    localStorage.setItem(key,(new Date()).getTime());
  }
}
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    webViewerLoad();
} else {
    document.addEventListener('DOMContentLoaded', webViewerLoad, true);
}