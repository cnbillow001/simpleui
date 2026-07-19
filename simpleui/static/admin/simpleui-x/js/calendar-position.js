'use strict';

(function () {
    function getScrollTargets() {
        var targets = [window, document];
        ['content', 'container', 'content-main'].forEach(function (id) {
            var node = document.getElementById(id);
            if (node) {
                targets.push(node);
            }
        });
        document.querySelectorAll('.form-main, .colM').forEach(function (node) {
            if (targets.indexOf(node) === -1) {
                targets.push(node);
            }
        });
        return targets;
    }

    function isVisible(box) {
        if (!box) {
            return false;
        }
        if (box.style.display === 'none') {
            return false;
        }
        return window.getComputedStyle(box).display !== 'none';
    }

    function getTriggerAnchor(num, kind) {
        var ds = DateTimeShortcuts;
        if (kind === 'clock') {
            return document.getElementById(ds.clockLinkName + num) || ds.clockInputs[num] || null;
        }
        return document.getElementById(ds.calendarLinkName + num) || ds.calendarInputs[num] || null;
    }

    function isRtlLayout() {
        return window.getComputedStyle(document.body).direction === 'rtl';
    }

    function isScrollable(node) {
        if (!node || node === document.body || node === document.documentElement) {
            return false;
        }
        var style = window.getComputedStyle(node);
        var overflow = (style.overflow + style.overflowX + style.overflowY).toLowerCase();
        if (!/(auto|scroll|overlay)/.test(overflow)) {
            return false;
        }
        return node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth;
    }

    function getScrollParent(el) {
        var node = el ? el.parentElement : null;
        while (node && node !== document.body && node !== document.documentElement) {
            if (isScrollable(node)) {
                return node;
            }
            node = node.parentElement;
        }
        return null;
    }

    function resolvePopupHost(box, anchor) {
        var scrollParent = getScrollParent(anchor);
        if (!scrollParent) {
            if (box.parentNode !== document.body) {
                document.body.appendChild(box);
            }
            return { node: document.body, mode: 'fixed' };
        }

        if (box.parentNode !== scrollParent) {
            scrollParent.appendChild(box);
        }

        return { node: scrollParent, mode: 'absolute' };
    }

    function computeViewportPosition(anchorRect, kind, boxWidth, boxHeight) {
        var gap = 6;
        var isRtl = isRtlLayout();
        var left;
        var top;

        if (kind === 'clock') {
            left = isRtl ? (anchorRect.left - boxWidth + 17) : (anchorRect.left + 17);
            top = anchorRect.top - 30;
        } else if (kind === 'calendar') {
            left = isRtl ? (anchorRect.left - 180) : (anchorRect.left + 17);
            top = anchorRect.top - 75;
        } else {
            left = anchorRect.left;
            top = anchorRect.bottom + gap;
        }

        top = Math.max(8, top);

        if (top + boxHeight > window.innerHeight - 8 && anchorRect.top - boxHeight - gap >= 8) {
            top = anchorRect.top - boxHeight - gap;
        } else if (top + boxHeight > window.innerHeight - 8) {
            top = Math.max(8, anchorRect.bottom + gap);
        }

        left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - boxWidth - 8));
        top = Math.min(Math.max(8, top), Math.max(8, window.innerHeight - boxHeight - 8));

        return { left: left, top: top };
    }

    function applyViewportPosition(box, hostInfo, viewportPos) {
        box.style.margin = '0';
        box.style.right = 'auto';
        box.style.bottom = 'auto';
        box.style.zIndex = '10000';

        if (hostInfo.mode === 'fixed') {
            box.style.position = 'fixed';
            box.style.left = viewportPos.left + 'px';
            box.style.top = viewportPos.top + 'px';
            return;
        }

        var host = hostInfo.node;
        var hostRect = host.getBoundingClientRect();
        box.style.position = 'absolute';
        box.style.left = (viewportPos.left - hostRect.left + host.scrollLeft) + 'px';
        box.style.top = (viewportPos.top - hostRect.top + host.scrollTop) + 'px';
    }

    function placePopup(box, anchor, kind) {
        if (!box || !anchor) {
            return;
        }

        var hostInfo = resolvePopupHost(box, anchor);
        var anchorRect = anchor.getBoundingClientRect();
        var isClock = kind === 'clock';
        var boxWidth = box.offsetWidth || (isClock ? 120 : 304);
        var boxHeight = box.offsetHeight || (isClock ? 200 : 280);
        var viewportPos = computeViewportPosition(anchorRect, kind, boxWidth, boxHeight);

        applyViewportPosition(box, hostInfo, viewportPos);
    }

    function schedulePlace(box, anchor, kind) {
        placePopup(box, anchor, kind);
        window.requestAnimationFrame(function () {
            placePopup(box, anchor, kind);
            window.requestAnimationFrame(function () {
                placePopup(box, anchor, kind);
            });
        });
    }

    function repositionOpenPopups() {
        if (!window.DateTimeShortcuts) {
            return;
        }

        var ds = DateTimeShortcuts;
        var calendarCount = ds.calendars ? ds.calendars.length : 0;
        for (var i = 0; i < calendarCount; i += 1) {
            var calBox = document.getElementById(ds.calendarDivName1 + i);
            if (!isVisible(calBox)) {
                continue;
            }
            schedulePlace(calBox, getTriggerAnchor(i, 'calendar'), 'calendar');
        }

        var clockCount = ds.clockInputs ? ds.clockInputs.length : 0;
        for (var j = 0; j < clockCount; j += 1) {
            var clockBox = document.getElementById(ds.clockDivName + j);
            if (!isVisible(clockBox)) {
                continue;
            }
            schedulePlace(clockBox, getTriggerAnchor(j, 'clock'), 'clock');
        }
    }

    function openCalendarPatched(num) {
        var calBox = document.getElementById(DateTimeShortcuts.calendarDivName1 + num);
        var inp = DateTimeShortcuts.calendarInputs[num];
        var anchor = getTriggerAnchor(num, 'calendar');
        if (!calBox || !inp || !anchor) {
            return;
        }

        calBox.style.display = 'block';
        document.addEventListener('click', DateTimeShortcuts.dismissCalendarFunc[num]);

        try {
            if (inp.value && typeof inp.value.strptime === 'function' && typeof get_format === 'function') {
                var format = get_format('DATE_INPUT_FORMATS')[0];
                var selected = inp.value.strptime(format);
                var year = selected.getUTCFullYear();
                var month = selected.getUTCMonth() + 1;
                if (/^\d{4}$/.test(String(year)) && month >= 1 && month <= 12) {
                    DateTimeShortcuts.calendars[num].drawDate(month, year, selected);
                }
            }
        } catch (ignoreDrawError) {
        }

        schedulePlace(calBox, anchor, 'calendar');
    }

    function openClockPatched(num) {
        var clockBox = document.getElementById(DateTimeShortcuts.clockDivName + num);
        var anchor = getTriggerAnchor(num, 'clock');
        if (!clockBox || !anchor) {
            return;
        }

        clockBox.style.display = 'block';
        document.addEventListener('click', DateTimeShortcuts.dismissClockFunc[num]);
        schedulePlace(clockBox, anchor, 'clock');
    }

    function patchDateTimePositioning() {
        if (!window.DateTimeShortcuts) {
            return false;
        }

        DateTimeShortcuts.openCalendar = openCalendarPatched;
        DateTimeShortcuts.openClock = openClockPatched;

        if (!DateTimeShortcuts._simpleuiPositionPatched) {
            getScrollTargets().forEach(function (target) {
                target.addEventListener('scroll', repositionOpenPopups, {capture: true, passive: true});
            });
            window.addEventListener('resize', repositionOpenPopups);

            var originalInit = DateTimeShortcuts.init;
            if (typeof originalInit === 'function' && !DateTimeShortcuts._simpleuiInitWrapped) {
                DateTimeShortcuts.init = function () {
                    originalInit.apply(this, arguments);
                    DateTimeShortcuts.openCalendar = openCalendarPatched;
                    DateTimeShortcuts.openClock = openClockPatched;
                };
                DateTimeShortcuts._simpleuiInitWrapped = true;
            }
        }

        DateTimeShortcuts._simpleuiPositionPatched = true;
        return true;
    }

    function boot() {
        if (patchDateTimePositioning()) {
            return;
        }

        window.addEventListener('load', patchDateTimePositioning);

        var delays = [0, 120, 400, 1000, 2000];
        for (var i = 0; i < delays.length; i += 1) {
            window.setTimeout(patchDateTimePositioning, delays[i]);
        }
    }

    boot();
})();
