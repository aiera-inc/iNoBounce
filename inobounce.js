/*! iNoBounce - v0.1.6
 * https://github.com/lazd/iNoBounce/
 * Copyright (c) 2013 Larry Davis <lazdnet@gmail.com>; Licensed BSD */
(function(global) {
    // Stores the Y position where the touch started
    let startY = 0;
    let startX = 0;

    // Store enabled status
    let enabled = false;

    let supportsPassiveOption = false;
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get() {
                supportsPassiveOption = true;
                return true;
            }
        });
        window.addEventListener('test', null, opts);
    } catch (e) {
        // console.log('iNoBounce: ', e);
    }

    const canScrollCheck = function(overflowY, el) {
        if (overflowY === 'auto' || overflowY === 'scroll') {
            return el.scrollHeight > el.offsetHeight;
        }

        return el.scrollWidth > el.offsetWidth;
    };

    const isScrollableCheck = function(scrolling, overflowY, overflowX) {
        const isTouchScroll = scrolling === 'touch';
        const scrollY = overflowY === 'auto' || overflowY === 'scroll';
        const scrollX = overflowX === 'auto' || overflowX === 'scroll';

        return isTouchScroll && (scrollY || scrollX);
    };

    // ensure user is scrolling horizontally
    const vertScroll = function(evt) {
        // Get the current Y position of the touch
        const curY = evt.touches ? evt.touches[0].screenY : evt.screenY;
        // Get the current X position of the touch
        const curX = evt.touches ? evt.touches[0].screenX : evt.screenX;

        const Ydiff = Math.abs(startY - curY);
        const Xdiff = Math.abs(startX - curX);

        // prevent if the user tried to scroll vertical in horizontal area
        if (Ydiff > Xdiff) {
            evt.preventDefault();
        }
    };

    const horScroll = function(evt, height, el) {
        // Get the current Y position of the touch
        const curY = evt.touches ? evt.touches[0].screenY : evt.screenY;

        // Determine if the user is trying to scroll past the top or bottom
        // In this case, the window will bounce, so we have to prevent scrolling completely
        const isAtTop = startY <= curY && el.scrollTop === 0;
        const isAtBottom = startY >= curY && el.scrollHeight - el.scrollTop === height;

        // Stop a bounce bug when at the bottom or top of the scrollable element
        // Only need this for vertical scrolling
        if (isAtTop || isAtBottom) {
            evt.preventDefault();
        }
    };

    const handleTouchmove = function(evt) {
        // Get the element that was scrolled upon
        let el = evt.target;

        // Allow zooming
        const zoom = window.innerWidth / window.document.documentElement.clientWidth;
        if (evt.touches.length > 1 || zoom !== 1) {
            return;
        }

        // Check all parent elements for scrollability
        while (el !== document.body && el !== document) {
            // Get some style properties
            const style = window.getComputedStyle(el);

            if (!style) {
                // If we've encountered an element we can't compute the style for, get out
                break;
            }

            // Ignore range input element
            if (el.nodeName === 'INPUT' && el.getAttribute('type') === 'range') {
                return;
            }

            const scrolling = style.getPropertyValue('-webkit-overflow-scrolling');
            const overflowY = style.getPropertyValue('overflow-y');
            const overflowX = style.getPropertyValue('overflow-x');
            const height = parseInt(style.getPropertyValue('height'), 10);

            // Determine if the element should scroll
            const isScrollable = isScrollableCheck(scrolling, overflowY, overflowX);
            const canScroll = canScrollCheck(overflowY, el);

            if (isScrollable && canScroll) {
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    horScroll(evt, height, el);
                } else {
                    vertScroll(evt);
                }

                // No need to continue up the DOM, we've done our job
                return;
            }

            // Test the next parent
            el = el.parentNode;
        }

        // Stop the bouncing -- no parents are scrollable
        evt.preventDefault();
    };

    const handleTouchstart = function(evt) {
        // Store the first Y position of the touch
        startY = evt.touches ? evt.touches[0].screenY : evt.screenY;
        // Store the first X position of the touch
        startX = evt.touches ? evt.touches[0].screenX : evt.screenX;
    };

    const enable = function() {
        // Listen to a couple key touch events
        window.addEventListener('touchstart', handleTouchstart, supportsPassiveOption ? { passive: false } : false);
        window.addEventListener('touchmove', handleTouchmove, supportsPassiveOption ? { passive: false } : false);
        enabled = true;
    };

    const disable = function() {
        // Stop listening
        window.removeEventListener('touchstart', handleTouchstart, false);
        window.removeEventListener('touchmove', handleTouchmove, false);
        enabled = false;
    };

    const isEnabled = function() {
        return enabled;
    };

    // Enable by default if the browser supports -webkit-overflow-scrolling
    // Test this by setting the property with JavaScript on an element that exists in the DOM
    // Then, see if the property is reflected in the computed style
    const testDiv = document.createElement('div');
    document.documentElement.appendChild(testDiv);
    testDiv.style.WebkitOverflowScrolling = 'touch';
    const scrollSupport =
        'getComputedStyle' in window && window.getComputedStyle(testDiv)['-webkit-overflow-scrolling'] === 'touch';
    document.documentElement.removeChild(testDiv);

    if (scrollSupport) {
        enable();
    }

    // A module to support enabling/disabling iNoBounce
    const iNoBounce = {
        enable,
        disable,
        isEnabled
    };

    if (typeof module !== 'undefined' && module.exports) {
        // Node.js Support
        module.exports = iNoBounce;
    }
    if (typeof global.define === 'function') {
        // AMD Support
        (function(define) {
            define('iNoBounce', [], function() {
                return iNoBounce;
            });
        })(global.define);
    } else {
        // Browser support
        /* eslint-disable no-param-reassign */
        global.iNoBounce = iNoBounce;
    }
})(this);
