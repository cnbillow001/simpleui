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
