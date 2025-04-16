// Converted to ESM
import $ from "https://cdn.jsdelivr.net/npm/jquery@3.3.1/+esm";

const toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
const toBind = ('onwheel' in document || document.documentMode >= 9) ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
const slice = Array.prototype.slice;
let nullLowestDeltaTimeout, lowestDelta;

if ($.event.fixHooks) {
    for (let i = toFix.length; i;) {
        $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
    }
}

const special = $.event.special.mousewheel = {
    version: '3.1.12',

    setup() {
        if (this.addEventListener) {
            for (let i = toBind.length; i;) {
                this.addEventListener(toBind[--i], handler, false);
            }
        } else {
            this.onmousewheel = handler;
        }
        $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
        $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
    },

    teardown() {
        if (this.removeEventListener) {
            for (let i = toBind.length; i;) {
                this.removeEventListener(toBind[--i], handler, false);
            }
        } else {
            this.onmousewheel = null;
        }
        $.removeData(this, 'mousewheel-line-height');
        $.removeData(this, 'mousewheel-page-height');
    },

    getLineHeight(elem) {
        const $elem = $(elem);
        let $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
        if (!$parent.length) {
            $parent = $('body');
        }
        return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
    },

    getPageHeight(elem) {
        return $(elem).height();
    },

    settings: {
        adjustOldDeltas: true,
        normalizeOffset: true
    }
};

$.fn.extend({
    mousewheel(fn) {
        return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
    },

    unmousewheel(fn) {
        return this.unbind('mousewheel', fn);
    }
});

function handler(event) {
    let orgEvent = event || window.event;
    const args = slice.call(arguments, 1);
    let delta = 0;
    let deltaX = 0;
    let deltaY = 0;
    let absDelta = 0;
    let offsetX = 0;
    let offsetY = 0;
    event = $.event.fix(orgEvent);
    event.type = 'mousewheel';

    if ('detail' in orgEvent) { deltaY = orgEvent.detail * -1; }
    if ('wheelDelta' in orgEvent) { deltaY = orgEvent.wheelDelta; }
    if ('wheelDeltaY' in orgEvent) { deltaY = orgEvent.wheelDeltaY; }
    if ('wheelDeltaX' in orgEvent) { deltaX = orgEvent.wheelDeltaX * -1; }

    if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
        deltaX = deltaY * -1;
        deltaY = 0;
    }

    delta = deltaY === 0 ? deltaX : deltaY;

    if ('deltaY' in orgEvent) {
        deltaY = orgEvent.deltaY * -1;
        delta = deltaY;
    }
    if ('deltaX' in orgEvent) {
        deltaX = orgEvent.deltaX;
        if (deltaY === 0) { delta = deltaX * -1; }
    }

    if (deltaY === 0 && deltaX === 0) { return; }

    if (orgEvent.deltaMode === 1) {
        const lineHeight = $.data(this, 'mousewheel-line-height');
        delta *= lineHeight;
        deltaY *= lineHeight;
        deltaX *= lineHeight;
    } else if (orgEvent.deltaMode === 2) {
        const pageHeight = $.data(this, 'mousewheel-page-height');
        delta *= pageHeight;
        deltaY *= pageHeight;
        deltaX *= pageHeight;
    }

    absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

    if (!lowestDelta || absDelta < lowestDelta) {
        lowestDelta = absDelta;

        if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
            lowestDelta /= 40;
        }
    }

    if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
        delta /= 40;
        deltaX /= 40;
        deltaY /= 40;
    }

    delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
    deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
    deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

    if (special.settings.normalizeOffset && this.getBoundingClientRect) {
        const boundingRect = this.getBoundingClientRect();
        offsetX = event.clientX - boundingRect.left;
        offsetY = event.clientY - boundingRect.top;
    }

    event.deltaX = deltaX;
    event.deltaY = deltaY;
    event.deltaFactor = lowestDelta;
    event.offsetX = offsetX;
    event.offsetY = offsetY;
    event.deltaMode = 0;

    args.unshift(event, delta, deltaX, deltaY);

    if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
    nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

    return ($.event.dispatch || $.event.handle).apply(this, args);
}

function nullLowestDelta() {
    lowestDelta = null;
}

function shouldAdjustOldDeltas(orgEvent, absDelta) {
    return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
}

export default special;
