/**
 * Sync login / logout pages with the current SimpleUI theme color.
 * Supports solid colors and extracts accents from gradient themes (e.g. Orange).
 */
(function () {
    var DEFAULT_COLOR = '#409eff';

    function clampByte(n) {
        return Math.max(0, Math.min(255, Math.round(n)));
    }

    function hexToRgb(hex) {
        var h = String(hex || '').replace('#', '').trim();
        if (h.length === 3) {
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        }
        if (!/^[0-9a-fA-F]{6}$/.test(h)) {
            return null;
        }
        return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16)
        };
    }

    function toHex(r, g, b) {
        return '#' + [r, g, b].map(function (n) {
            var h = clampByte(n).toString(16);
            return h.length === 1 ? '0' + h : h;
        }).join('');
    }

    function rgbStringToHex(value) {
        var m = String(value).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (!m) {
            return null;
        }
        return toHex(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
    }

    function normalizeSolid(value) {
        if (!value) {
            return null;
        }
        var v = String(value).trim().replace(/\s*!important\s*/ig, '');
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
            var rgb = hexToRgb(v);
            return rgb ? toHex(rgb.r, rgb.g, rgb.b) : null;
        }
        if (/^rgb/i.test(v)) {
            return rgbStringToHex(v);
        }
        return null;
    }

    function extractFromCssValue(value) {
        if (!value) {
            return [];
        }
        var v = String(value);
        var found = [];
        var hexRe = /#([0-9a-f]{3}|[0-9a-f]{6})\b/ig;
        var rgbRe = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/ig;
        var m;
        while ((m = hexRe.exec(v))) {
            var hex = normalizeSolid(m[0]);
            if (hex) {
                found.push(hex);
            }
        }
        while ((m = rgbRe.exec(v))) {
            var rgbHex = rgbStringToHex(m[0]);
            if (rgbHex) {
                found.push(rgbHex);
            }
        }
        return found;
    }

    function isNearWhite(hex) {
        var rgb = hexToRgb(hex);
        if (!rgb) {
            return false;
        }
        return rgb.r > 240 && rgb.g > 240 && rgb.b > 240;
    }

    function chromaScore(hex) {
        var rgb = hexToRgb(hex);
        if (!rgb) {
            return 0;
        }
        return Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
    }

    function pickBestColor(colors) {
        var usable = (colors || []).filter(function (c) {
            return c && !isNearWhite(c);
        });
        if (!usable.length) {
            return null;
        }
        usable.sort(function (a, b) {
            return chromaScore(b) - chromaScore(a);
        });
        return usable[0];
    }

    function normalizeColor(value) {
        if (!value) {
            return null;
        }
        var solid = normalizeSolid(String(value).trim().replace(/\s*!important\s*/ig, ''));
        if (solid && !isNearWhite(solid)) {
            return solid;
        }
        return pickBestColor(extractFromCssValue(value));
    }

    function darken(hex, amount) {
        var rgb = hexToRgb(hex);
        if (!rgb) {
            return hex;
        }
        var factor = 1 - amount;
        return toHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
    }

    function pickThemeColor(item) {
        if (!item) {
            return null;
        }
        // Prefer theme accent (primary), then visible top bar / logo colors; skip white sidebar bg.
        var candidates = [item.primary, item.top, item.logo, item.menu];
        for (var i = 0; i < candidates.length; i++) {
            var color = normalizeColor(candidates[i]);
            if (color) {
                return color;
            }
        }
        if (typeof readThemePrimaryFromStylesheet === 'function') {
            return normalizeColor(readThemePrimaryFromStylesheet(null, item && item.text));
        }
        return null;
    }

    function fileFromThemeUrl(themeUrl) {
        if (!themeUrl) {
            return '';
        }
        try {
            themeUrl = decodeURIComponent(themeUrl);
        } catch (e) {
        }
        var clean = String(themeUrl).split('?')[0];
        var parts = clean.split('/');
        return parts[parts.length - 1] || '';
    }

    function resolveThemeItem() {
        var themes = window.SimpleuiThemes || [];
        var pref = typeof getThemePreference === 'function'
            ? getThemePreference()
            : {
                theme: (typeof getCookie === 'function' ? getCookie('theme') : null),
                themeName: (typeof getCookie === 'function' ? getCookie('theme_name') : null)
            };
        var themeName = pref && pref.themeName;
        var themeUrl = (pref && pref.theme) || '';
        var file = fileFromThemeUrl(themeUrl);

        if (!file && window.SIMPLEUI_DEFAULT_THEME) {
            file = String(window.SIMPLEUI_DEFAULT_THEME).split('?')[0];
        }

        var item = null;
        if (themeName) {
            for (var i = 0; i < themes.length; i++) {
                if (themes[i].text === themeName) {
                    item = themes[i];
                    break;
                }
            }
        }
        if (!item && file) {
            for (var j = 0; j < themes.length; j++) {
                if (themes[j].file === file) {
                    item = themes[j];
                    break;
                }
            }
        }
        if (!item && window.SIMPLEUI_DEFAULT_THEME) {
            var defFile = String(window.SIMPLEUI_DEFAULT_THEME).split('?')[0];
            for (var k = 0; k < themes.length; k++) {
                if (themes[k].file === defFile) {
                    item = themes[k];
                    break;
                }
            }
        }
        return item;
    }

    function applyLoginTheme() {
        var item = resolveThemeItem();
        var primary = pickThemeColor(item) || DEFAULT_COLOR;
        var hover = darken(primary, 0.12);
        var rgb = hexToRgb(primary) || {r: 60, g: 141, b: 188};
        var root = document.documentElement;

        root.style.setProperty('--login-primary', primary);
        root.style.setProperty('--login-primary-hover', hover);
        root.style.setProperty('--login-primary-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
        root.style.setProperty('--el-color-primary', primary);

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', primary);
        }

        if (typeof applyFormThemeVars === 'function') {
            applyFormThemeVars(null, item && item.text);
        } else {
            root.style.setProperty('--su-input-focus-border', primary, 'important');
            root.style.setProperty('--su-input-accent', primary, 'important');
            root.style.setProperty('--su-input-focus-ring', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.12)', 'important');
        }

        var logos = document.querySelectorAll('img.login-brand__img, img[src*="brand-logo.svg"]');
        for (var i = 0; i < logos.length; i++) {
            var img = logos[i];
            try {
                var url = new URL(img.getAttribute('src'), window.location.origin);
                if (url.pathname.indexOf('brand-logo') === -1) {
                    continue;
                }
                var variant = url.searchParams.get('variant') || 'login';
                if (variant !== 'login') {
                    continue;
                }
                url.searchParams.set('color', primary);
                // bust cache so color change is visible immediately
                url.searchParams.set('_', String(Date.now()));
                img.src = url.pathname + '?' + url.searchParams.toString();
            } catch (e) {
            }
        }
    }

    window.applyBrandLogoTheme = applyLoginTheme;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyLoginTheme);
    } else {
        applyLoginTheme();
    }
})();
