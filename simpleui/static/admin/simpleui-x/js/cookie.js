var username = document.cookie.split(";")[0].split("=")[1];

// Write cookies (always path=/)
function setCookie(name, value) {
    var Days = 365;
    var exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    // Remove possible stale cookies on narrower paths first
    eraseCookie(name);
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + exp.toGMTString() + ";path=/";
}

function getCookie(name) {
    var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if (arr = document.cookie.match(reg)) {
        try {
            return decodeURIComponent(arr[2]);
        } catch (e) {
            return unescape(arr[2]);
        }
    }
    return null;
}

function eraseCookie(name) {
    var paths = ['/', '/admin', '/admin/', '/admin/logout', '/admin/logout/', '/admin/logout/confirm', '/admin/logout/confirm/'];
    for (var i = 0; i < paths.length; i++) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=" + paths[i];
    }
}

// Theme preference: localStorage first (survives logout), cookie as fallback.
var SIMPLEUI_THEME_KEY = 'simpleui_theme';
var SIMPLEUI_THEME_NAME_KEY = 'simpleui_theme_name';

function setThemePreference(theme, themeName) {
    try {
        if (theme) {
            localStorage.setItem(SIMPLEUI_THEME_KEY, theme);
        } else {
            localStorage.removeItem(SIMPLEUI_THEME_KEY);
        }
        if (themeName) {
            localStorage.setItem(SIMPLEUI_THEME_NAME_KEY, themeName);
        } else {
            localStorage.removeItem(SIMPLEUI_THEME_NAME_KEY);
        }
    } catch (e) {
    }
    if (theme) {
        setCookie('theme', theme);
    } else {
        eraseCookie('theme');
    }
    if (themeName) {
        setCookie('theme_name', themeName);
    } else {
        eraseCookie('theme_name');
    }
}

function getThemePreference() {
    var theme = null;
    var themeName = null;
    try {
        theme = localStorage.getItem(SIMPLEUI_THEME_KEY);
        themeName = localStorage.getItem(SIMPLEUI_THEME_NAME_KEY);
    } catch (e) {
    }
    if (!theme) {
        theme = getCookie('theme');
    }
    if (!themeName) {
        themeName = getCookie('theme_name');
    }
    // Ignore empty leftovers from older logout clearing
    if (theme === '') {
        theme = null;
    }
    if (themeName === '') {
        themeName = null;
    }
    // Migrate cookie -> localStorage and drop stale empty cookies
    if (theme || themeName) {
        try {
            if (theme) {
                localStorage.setItem(SIMPLEUI_THEME_KEY, theme);
            }
            if (themeName) {
                localStorage.setItem(SIMPLEUI_THEME_NAME_KEY, themeName);
            }
        } catch (e) {
        }
    } else {
        eraseCookie('theme');
        eraseCookie('theme_name');
    }
    return {theme: theme, themeName: themeName};
}

var SIMPLEUI_FONT_SIZE_KEY = 'simpleui_font_size';
var DEFAULT_FONT_SLIDER = 14;
var FONT_SIZE_MIN = 10;
var FONT_SIZE_MAX = 30;

function clampFontSize(size) {
    var parsed = parseInt(size, 10);
    if (isNaN(parsed) || parsed <= 0) {
        return 0;
    }
    if (parsed < FONT_SIZE_MIN) {
        return FONT_SIZE_MIN;
    }
    if (parsed > FONT_SIZE_MAX) {
        return FONT_SIZE_MAX;
    }
    return parsed;
}

function setFontPreference(size) {
    var parsed = clampFontSize(size);
    try {
        if (parsed > 0) {
            localStorage.setItem(SIMPLEUI_FONT_SIZE_KEY, String(parsed));
        } else {
            localStorage.removeItem(SIMPLEUI_FONT_SIZE_KEY);
        }
    } catch (e) {
    }
    setCookie('fontSize', parsed);
}

function getFontPreference() {
    var size = null;
    try {
        size = localStorage.getItem(SIMPLEUI_FONT_SIZE_KEY);
    } catch (e) {
    }
    if (size === null || size === '') {
        size = getCookie('fontSize');
    }
    if (size === null || size === '') {
        return 0;
    }
    return clampFontSize(size);
}

function getFontSliderValue(size) {
    var parsed = clampFontSize(size);
    if (parsed > 0) {
        return parsed;
    }
    return DEFAULT_FONT_SLIDER;
}

function normalizeSimpleuiThemeColor(value) {
    if (!value) {
        return null;
    }
    var raw = String(value).trim().replace(/\s*!important\s*/ig, '');
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
        return raw.length === 4
            ? ('#' + raw[1] + raw[1] + raw[2] + raw[2] + raw[3] + raw[3]).toLowerCase()
            : raw.toLowerCase();
    }
    var rgb = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgb) {
        return '#' + [rgb[1], rgb[2], rgb[3]].map(function (part) {
            var hex = parseInt(part, 10).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    return null;
}

function pickSimpleuiThemeColor(item) {
    if (!item) {
        return null;
    }
    var candidates = [item.top, item.logo, item.menu];
    for (var i = 0; i < candidates.length; i++) {
        var color = normalizeSimpleuiThemeColor(candidates[i]);
        if (!color) {
            continue;
        }
        var rgb = color.replace('#', '');
        var r = parseInt(rgb.slice(0, 2), 16);
        var g = parseInt(rgb.slice(2, 4), 16);
        var b = parseInt(rgb.slice(4, 6), 16);
        if (r > 240 && g > 240 && b > 240) {
            continue;
        }
        return color;
    }
    return null;
}

function resolveSimpleuiThemeItem(themeUrl, themeName) {
    var themes = (window.parent && window.parent.SimpleuiThemes) || window.SimpleuiThemes || [];
    var file = '';
    if (themeUrl) {
        file = String(themeUrl).split('?')[0].split('/').pop();
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
    return item;
}

function readThemePrimaryFromDom() {
    var docs = [document];
    try {
        if (window.parent && window.parent.document && window.parent.document !== document) {
            docs.push(window.parent.document);
        }
    } catch (e) {
    }
    for (var i = 0; i < docs.length; i++) {
        var btn = docs[i].querySelector('.el-button--primary');
        if (!btn) {
            continue;
        }
        var color = normalizeSimpleuiThemeColor(window.getComputedStyle(btn).backgroundColor);
        if (color) {
            return color;
        }
    }
    return null;
}

function readThemePrimaryFromCssVar() {
    var value = window.getComputedStyle(document.documentElement).getPropertyValue('--su-input-accent');
    return normalizeSimpleuiThemeColor(value);
}

function simpleuiHexToRgbParts(hex) {
    var normalized = normalizeSimpleuiThemeColor(hex);
    if (!normalized) {
        return null;
    }
    var parts = normalized.replace('#', '');
    return {
        r: parseInt(parts.slice(0, 2), 16),
        g: parseInt(parts.slice(2, 4), 16),
        b: parseInt(parts.slice(4, 6), 16)
    };
}

function simpleuiRgbPartsToHex(r, g, b) {
    return '#' + [r, g, b].map(function (part) {
        var hex = Math.max(0, Math.min(255, Math.round(part))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function darkenSimpleuiColor(hex, ratio) {
    var rgb = simpleuiHexToRgbParts(hex);
    if (!rgb) {
        return hex;
    }
    var factor = 1 - (ratio || 0.12);
    return simpleuiRgbPartsToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

function applyDjangoAdminThemeVars(primary) {
    var root = document.documentElement;
    var hover = darkenSimpleuiColor(primary, 0.12);
    var rgb = simpleuiHexToRgbParts(primary);
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', primary);
    root.style.setProperty('--accent', primary);
    root.style.setProperty('--link-fg', primary);
    root.style.setProperty('--link-hover-color', hover);
    root.style.setProperty('--default-button-bg', primary);
    root.style.setProperty('--button-bg', primary);
    root.style.setProperty('--button-hover-bg', hover);
    root.style.setProperty('--default-button-hover-bg', hover);
    if (rgb) {
        root.style.setProperty('--selected-row', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.16)');
    }
}

function applyFormThemeVars(themeUrl, themeName) {
    var item = resolveSimpleuiThemeItem(themeUrl, themeName);
    var primary = pickSimpleuiThemeColor(item)
        || readThemePrimaryFromCssVar()
        || readThemePrimaryFromDom()
        || '#409eff';
    var root = document.documentElement;
    root.style.setProperty('--su-input-focus-border', primary);
    root.style.setProperty('--su-input-accent', primary);
    var rgb = simpleuiHexToRgbParts(primary);
    if (rgb) {
        root.style.setProperty('--su-input-focus-ring', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.12)');
    }
    applyDjangoAdminThemeVars(primary);
    if (typeof window.syncSimpleuiSelectorAccent === 'function') {
        window.syncSimpleuiSelectorAccent();
    }
}

function scheduleApplyFormThemeVars(themeUrl, themeName) {
    var delays = [0, 80, 200, 500, 1000];
    for (var i = 0; i < delays.length; i++) {
        window.setTimeout(function () {
            applyFormThemeVars(themeUrl, themeName);
        }, delays[i]);
    }
}
