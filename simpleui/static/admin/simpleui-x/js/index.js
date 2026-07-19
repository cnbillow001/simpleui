(function () {
    if (window.frameElement) {
        window.frameElement.contentWindow.parent.callback()
    }

    window.addEventListener('hashchange', function (e) {
        if (e.newURL != e.oldURL) {
            openByHash()
        }
    });

    function openByHash() {
        var hash = location.hash;
        hash = hash.substring(1)

        // Home hash: only show "首页"
        if (!hash || hash === '/') {
            app.tabModel = '0';
            app.menuActive = '1';
            app.breadcrumbs = [];
            return;
        }

        for (var i = 0; i < app.menuData.length; i++) {
            var item = app.menuData[i]
            // Avoid matching items without url against "/"
            if (item.url && item.url == hash) {
                // selected=false: ensure tab exists after refresh; index as string for el-menu
                app.openTab(item, String(item.eid), false, false);
                break;
            }
        }
    }

    function changeUrl(data) {
        if (data.id == '0' || data.eid == '1' || data.url === '/' || !data.url) {
            if (location.hash && location.hash !== '#' && location.hash !== '#/') {
                location.hash = '#/';
            }
            return;
        }
        if (data.url && data.url.indexOf('http') != 0) {
            location.hash = '#' + data.url;
        }
    }

    function isHomeTab(item) {
        return !!(item && (item.id == '0' || item.eid == '1' || item.url === '/'));
    }

    function resolveBreadcrumbs(item) {
        if (!item || isHomeTab(item)) {
            return [];
        }
        if (item.breadcrumbs && item.breadcrumbs.length) {
            return item.breadcrumbs;
        }
        // Tabs restored from sessionStorage may lack breadcrumbs; recover from menuData.
        if (window.app && app.menuData && item.url) {
            for (var i = 0; i < app.menuData.length; i++) {
                var menuItem = app.menuData[i];
                if (menuItem.url === item.url && menuItem.breadcrumbs && menuItem.breadcrumbs.length) {
                    item.breadcrumbs = menuItem.breadcrumbs;
                    return menuItem.breadcrumbs;
                }
            }
        }
        return [];
    }

    window.callback = function () {
        window.location.reload()
    }

    var fontConfig = new Vue({
        // el: '#dynamicCss',
        data: {
            fontSize: null
        },
        created: function () {
            this.fontSize = getFontPreference();
        },
        watch: {
            fontSize: {
                immediate: true,
                handler: function (newValue) {
                if (newValue != 0) {
                    var fontStyle = document.getElementById('fontStyle');
                    if (!fontStyle) {
                        fontStyle = document.createElement('style');
                        fontStyle.id = 'fontStyle';
                        fontStyle.type = 'text/css';
                        document.head.append(fontStyle);
                    }
                    fontStyle.innerHTML = '*{font-size:' + newValue + 'px!important;}'

                } else {
                    var fontStyle = document.getElementById('fontStyle');
                    if (fontStyle) {
                        fontStyle.remove();
                    }
                }
                }
            }
        },
        methods: {}
    });

    // Waves.init();

    //为元素注册水波纹效果
    Vue.directive('waves', {
        // 当被绑定的元素插入到 DOM 中时……
        inserted: function (el) {
            // 聚焦元素
            Waves.attach(el);
            Waves.init();
        }
    });


    window.getLanuage = function (key) {
        if (!window.Lanuages) {
            return "";
        }
        var val = Lanuages[key];
        if (!val || val == "") {
            val = key;
        }
        return val
    }

    new Vue({
        el: '#main',
        data: {
            drawer: false,
            mobile: false,
            upgrade: {
                isUpdate: false,
                body: '',
                version: '',
                dialogVisible: false
            },
            isResize: false,
            searchInput: '',
            height: 1000,
            fold: false,
            zoom: false,
            timeline: true,
            tabs: [home],
            tabModel: 0,
            tabIndex: 0,
            menus: [],
            menuActive: '0',
            breadcrumbs: [],
            language: window.language,
            pwdDialogVisible: false,
            pwdLoading: false,
            pwdForm: {
                oldPassword: '',
                newPassword1: '',
                newPassword2: ''
            },
            pwdErrors: {},
            pwdErrorMessage: '',
            logoutDialogVisible: false,
            logoutLoading: false,
            themeDialogVisible: false,
            small: false,
            themes: SimpleuiThemes,
            theme: "",
            themeName: "",
            popup: {
                left: 0,
                top: 0,
                show: false,
                tab: null,
                menus: [{
                    text: getLanuage('Refresh'),
                    icon: 'el-icon-refresh',
                    handler: function (tab, item) {
                        try {
                            document.getElementById(tab.id).contentWindow.location.reload(true);
                        } catch (e) {
                            console.log(e)
                            var url = tab.url.split('?')[0];
                            tab.url = url + '?_=' + new Date().getTime()
                        }
                    }
                }, {
                    text: getLanuage('Close current'),
                    icon: 'el-icon-circle-close',
                    handler: function (tab, item) {
                        app.handleTabsEdit(tab.id, 'remove');
                    }
                }, {
                    text: getLanuage('Close other'),
                    icon: 'far fa-copy',
                    handler: function (tab) {
                        app.tabs.forEach(item => {
                            if (item.id != tab.id) {
                                app.handleTabsEdit(item.id, 'remove');
                            }
                        })
                    }
                }, {
                    text: getLanuage('Close all'),
                    icon: 'el-icon-close',
                    handler: function (tab, item) {

                        app.$confirm(Lanuages["Are you sure you want them all closed"], Lanuages.Tips, {
                            confirmButtonText: Lanuages.ConfirmYes,
                            cancelButtonText: Lanuages.ConfirmNo,
                            type: 'warning'
                        }).then(function () {
                            app.tabs.forEach((tab, index) => {
                                if (index != 0) {
                                    app.handleTabsEdit(tab.id, 'remove');
                                }
                            });
                            app.menuActive = '1';
                        }).catch(function () {

                        });

                    }
                }, {
                    text: getLanuage('Open in a new page'),
                    icon: 'el-icon-news',
                    handler: function (tab, item) {
                        window.open(tab.newUrl);
                    }
                }]
            },
            // 首页快捷操作，按菜单组分组
            quickGroups: [],
            fontDialogVisible: false,
            fontSlider: DEFAULT_FONT_SLIDER,
            fontPersistReady: false,
            loading: false,
            menuTextShow: true,
            menuData: []
        },
        watch: {
            theme: function (newValue, oldValue) {
                this.$nextTick(function () {
                    if (window.renderCallback) {
                        window.renderCallback(this);
                    }
                });
            },
            fold: function (newValue, oldValue) {
                // console.log(newValue)
            },
            menus: function (newValue) {
                this.quickGroups = this.buildQuickGroups(newValue);
            }
            /*,
            tabs: function (newValue, oldValue) {

                //改变tab时把状态储存到sessionStorage
                console.log(newValue)
            }*/
        },
        created: function () {

            // this.watch.theme('');

            var val = getCookie('fold') == 'true';
            this.small = this.fold = val;
            this.menuTextShow = !this.fold;

            var self = this;
            window.onresize = function () {

                self.height = document.documentElement.clientHeight || document.body.clientHeight
                var width = document.documentElement.clientWidth || document.body.clientWidth;

                if (!self.small) {

                    self.menuTextShow = !(width < 800);
                    self.$nextTick(() => {
                        self.fold = width < 800;
                    })
                }
                self.isResize = true;
                self.mobile = width < 800;

                //判断全屏状态
                try {
                    self.zoom = document.webkitIsFullScreen;
                } catch (e) {
                    //不是非webkit内核下，无能为力
                }
            }
            window.app = this;

            var savedFontSize = getFontPreference();
            this.fontSlider = getFontSliderValue(savedFontSize);

            menus = this.handlerMenus(menus);

            this.menus = window.menus
            this.quickGroups = this.buildQuickGroups(this.menus);

            var themePref = (typeof getThemePreference === 'function')
                ? getThemePreference()
                : {theme: getCookie('theme'), themeName: getCookie('theme_name')};
            this.theme = themePref.theme || '';
            this.themeName = themePref.themeName || '';
            if (!this.theme && this.themeName) {
                var named = (window.SimpleuiThemes || []).find(function (t) {
                    return t.text === themePref.themeName;
                });
                if (named && named.file) {
                    this.theme = window.themeUrl + named.file;
                } else if (this.themeName === 'Default') {
                    this.theme = window.themeUrl + 'default.css';
                }
            }


            //接收子页面的事件注册
            window.themeEvents = [];
            window.fontEvents = [];
            window.addEvent = function (name, handler) {
                if (name == 'theme') {
                    themeEvents.push(handler);
                } else if (name == 'font') {
                    fontEvents.push(handler);
                }
            }
            var temp_tabs = sessionStorage['tabs'];

            if (temp_tabs && temp_tabs != '') {
                this.tabs = JSON.parse(temp_tabs);
            }
            //elementui布局问题，导致页面不能正常撑开，调用resize使其重新计算
            if (window.onresize) {
                window.onresize();
            }
            this.$nextTick(function () {
                // Restore menu active after el-menu items are registered
                if (location.hash != '') {
                    openByHash();
                }
                if (window.renderCallback) {
                    window.renderCallback(this);
                }
                var themeItem = (window.SimpleuiThemes || []).find(function (t) {
                    return t.text === self.themeName;
                }) || {menu: null, file: self.theme};
                self.applyMenuPopupTheme(themeItem);
            });
        },
        methods: {
            buildQuickGroups: function (menus) {
                var groups = [];

                function collectLeaves(menuItem, leaves) {
                    if (!menuItem || menuItem.id === '0' || menuItem.eid === '1') {
                        return;
                    }

                    if (menuItem.models && menuItem.models.length) {
                        menuItem.models.forEach(function (child) {
                            collectLeaves(child, leaves);
                        });
                    } else if (menuItem.url) {
                        leaves.push(menuItem);
                    }
                }

                (menus || []).forEach(function (item) {
                    if (item.id === '0' || item.eid === '1') {
                        return;
                    }

                    var leaves = [];
                    if (item.models && item.models.length) {
                        item.models.forEach(function (child) {
                            collectLeaves(child, leaves);
                        });
                    } else {
                        collectLeaves(item, leaves);
                    }

                    if (leaves.length) {
                        groups.push({
                            name: item.name,
                            icon: item.icon,
                            models: leaves
                        });
                    }
                });

                return groups;
            },
            hashString: function (value) {
                var hash = 0;
                var text = String(value || '');
                for (var i = 0; i < text.length; i++) {
                    hash = ((hash << 5) - hash) + text.charCodeAt(i);
                    hash |= 0;
                }
                return Math.abs(hash);
            },
            quickIconTone: function (groupName, item, index) {
                var seed = String(groupName || '') + '|' + String((item && (item.eid || item.name)) || index);
                return 'icon--tone-' + ((this.hashString(seed) % 4) + 1);
            },
            handlerMenus(menus) {
                let self = this;
                menus.forEach(item => {
                    item.icon = getIcon(item.name, item.icon);

                    if (item.models) {
                        item.models.forEach(mItem => {
                            mItem.icon = getIcon(mItem.name, mItem.icon);
                            self.menuData.push(mItem)
                            if (mItem.models) {
                                self.handlerMenus(mItem.models);
                            }
                        });
                    } else {
                        self.menuData.push(item)
                    }
                });
                return menus;
            },
            syncTabs: function () {
                if (window.sessionStorage) {
                    sessionStorage['tabs'] = JSON.stringify(this.tabs);
                }
            },
            reset: function () {
                this.fontSlider = DEFAULT_FONT_SLIDER;
                fontConfig.fontSize = 0;

                setFontPreference(0);

                this.fontDialogVisible = false;
                fontEvents.forEach(handler => {
                    handler(0);
                });
            },
            fontClick: function () {
                var opening = !this.fontDialogVisible;
                this.fontDialogVisible = opening;
                if (opening) {
                    this.fontSlider = getFontSliderValue(fontConfig.fontSize);
                    this.fontPersistReady = false;
                    var self = this;
                    this.$nextTick(function () {
                        self.fontPersistReady = true;
                    });
                }
            },
            fontSlideChange: function (value) {
                if (!this.fontDialogVisible || !this.fontPersistReady) {
                    return;
                }
                var size = (typeof clampFontSize === 'function')
                    ? clampFontSize(value)
                    : parseInt(value, 10);
                if (!size || size < 10) {
                    size = 10;
                }
                if (size > 30) {
                    size = 30;
                }
                this.fontSlider = size;
                fontConfig.fontSize = size;
                setFontPreference(size);
                fontEvents.forEach(handler => {
                    handler(size);
                });

            },
            iframeLoad: function (tab, e) {
                url = e.target.contentWindow.location.href

                tab.newUrl = url;
                tab.loading = false;
                this.$forceUpdate();
                var self = this;
                e.target.contentWindow.beforeLoad = function () {
                    tab.loading = true;
                    self.$forceUpdate();
                }
                this.loading = false;
            },
            setTheme: function (item) {
                var url = window.themeUrl;
                if (item.file && item.file != '') {
                    this.theme = url + item.file;
                } else {
                    this.theme = '';
                }
                this.themeName = item.text;
                if (typeof setThemePreference === 'function') {
                    setThemePreference(this.theme, item.text);
                } else {
                    setCookie('theme', this.theme);
                    setCookie('theme_name', item.text);
                }

                // Collapsed flyout is outside .menu; sync colors from theme preview / sidebar
                this.applyMenuPopupTheme(item);

                var self = this;
                //通知子页面
                window.themeEvents.forEach(handler => {
                    handler(self.theme)
                });
            },
            applyMenuPopupTheme: function (item) {
                var root = document.documentElement;
                var menuVars = [
                    '--su-menu-bg',
                    '--su-menu-color',
                    '--su-menu-hover-bg',
                    '--su-menu-hover-color',
                    '--su-menu-active',
                    '--su-menu-active-bg',
                    '--su-menu-active-color',
                    '--su-menu-title-hover-bg',
                    '--su-menu-border'
                ];

                function clearInline() {
                    menuVars.forEach(function (name) {
                        root.style.removeProperty(name);
                    });
                }

                function parseRgb(color) {
                    if (!color) {
                        return null;
                    }
                    var hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
                    if (hex) {
                        var h = hex[1];
                        if (h.length === 3) {
                            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
                        }
                        return {
                            r: parseInt(h.slice(0, 2), 16),
                            g: parseInt(h.slice(2, 4), 16),
                            b: parseInt(h.slice(4, 6), 16)
                        };
                    }
                    var m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
                    if (!m) {
                        return null;
                    }
                    return {r: +m[1], g: +m[2], b: +m[3]};
                }

                function isLight(color) {
                    var rgb = parseRgb(color);
                    if (!rgb) {
                        return false;
                    }
                    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 170;
                }

                function readRootVar(name) {
                    return getComputedStyle(root).getPropertyValue(name).trim();
                }

                function applyPalette(bg, color) {
                    if (bg) {
                        root.style.setProperty('--su-menu-bg', bg);
                    }
                    if (isLight(bg)) {
                        root.style.setProperty('--su-menu-color', color || '#606266');
                        root.style.setProperty('--su-menu-hover-bg', 'rgba(0, 0, 0, 0.04)');
                        root.style.setProperty('--su-menu-hover-color', '#303133');
                        root.style.setProperty('--su-menu-active-bg', 'rgba(0, 0, 0, 0.06)');
                        root.style.setProperty('--su-menu-active-color', '#303133');
                        root.style.setProperty('--su-menu-title-hover-bg', 'rgba(0, 0, 0, 0.06)');
                        root.style.setProperty('--su-menu-border', 'rgba(0, 0, 0, 0.08)');
                    } else if (bg) {
                        root.style.setProperty('--su-menu-color', color || '#bfcbd9');
                        root.style.setProperty('--su-menu-hover-bg', 'rgba(255, 255, 255, 0.06)');
                        root.style.setProperty('--su-menu-hover-color', '#ffffff');
                        root.style.setProperty('--su-menu-active-bg', 'rgba(255, 255, 255, 0.08)');
                        root.style.setProperty('--su-menu-active-color', '#ffffff');
                        root.style.setProperty('--su-menu-title-hover-bg', 'rgba(255, 255, 255, 0.06)');
                        root.style.setProperty('--su-menu-border', 'rgba(255, 255, 255, 0.12)');
                    }
                }

                function syncFromSidebar() {
                    var menu = document.querySelector('.menu');
                    if (!menu) {
                        return;
                    }
                    var bg = getComputedStyle(menu).backgroundColor;
                    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
                        applyPalette(bg, null);
                    }
                    var activeEl = menu.querySelector('.el-menu-item.is-active') || menu.querySelector('.el-menu .is-active');
                    if (activeEl) {
                        var activeStyle = getComputedStyle(activeEl);
                        var accent = activeStyle.borderLeftColor;
                        if (!accent || accent === 'rgba(0, 0, 0, 0)' || accent === 'transparent') {
                            accent = activeStyle.color;
                        }
                        if (accent && accent !== 'rgba(0, 0, 0, 0)') {
                            root.style.setProperty('--su-menu-active', accent);
                        }
                        // Match collapsed popup active bg to expanded sidebar selection.
                        var activeBg = activeStyle.backgroundColor;
                        if (activeBg && activeBg !== 'transparent' && activeBg !== 'rgba(0, 0, 0, 0)') {
                            root.style.setProperty('--su-menu-active-bg', activeBg);
                        }
                    }
                }

                if (item && item.menu) {
                    applyPalette(item.menu, null);
                } else {
                    clearInline();
                }

                var self = this;
                this.$nextTick(function () {
                    var link = document.querySelector('#main link[rel="stylesheet"]');
                    var finish = function () {
                        syncFromSidebar();
                    };
                    if (link && self.theme) {
                        link.addEventListener('load', finish, {once: true});
                    }
                    setTimeout(finish, 120);
                    setTimeout(finish, 400);
                });
            },
            openUrl: function (url) {
                window.open(url);
            },
            contextmenu: function (item, e) {
                //右键菜单，如果x+菜单宽度超过屏幕宽度，就默认为屏幕宽度-10-菜单宽度

                //home没有popup menu
                if (item.id == '0') {
                    return;
                }
                this.popup.tab = item;
                this.popup.show = true;
                this.$nextTick(function () {
                    let el = this.$refs.popupmenu;
                    el.style.width = '150px';
                    let x = e.clientX;

                    let w = document.body.offsetWidth
                    if (x + 150 > w) {
                        x = w - 160;
                    }

                    this.popup.left = x;
                    this.popup.top = e.clientY;
                });
            },
            mainClick: function (e) {
                this.popup.show = false;
            },
            tabClick: function (tab) {
                var item = this.tabs[tab.index];
                var index = item.index;
                this.menuActive = String(index);
                if (tab.index == '0' || isHomeTab(item)) {
                    item.url = '/';
                    this.breadcrumbs = [];
                } else {
                    this.breadcrumbs = resolveBreadcrumbs(item);
                }
                changeUrl(item);
            },
            handleTabsEdit: function (targetName, action) {

                var self = this;
                if (action === 'remove') {
                    var next = '0';
                    this.tabs.forEach((tab, index) => {
                        if (tab.id == targetName) {
                            var temp = self.tabs[index + 1] || self.tabs[index - 1];
                            if (temp) {
                                next = temp.id;
                                self.menuActive = temp.index;
                                self.breadcrumbs = resolveBreadcrumbs(temp);
                                changeUrl(temp)
                            }
                        }
                    });
                    this.tabModel = next;
                    if (next == '0') {
                        this.breadcrumbs = [];
                    }

                    if (targetName != 0) {
                        this.tabs = this.tabs.filter(tab => tab.id !== targetName);
                    }
                    this.syncTabs();
                }
            }
            ,
            openTab: function (data, index, selected, loading) {
                //support version: 2022.6.13
                if (data.newTab) {
                    window.open(data.url);
                    return;
                }

                this.breadcrumbs = resolveBreadcrumbs(data);

                //如果data没有eid，就直接打开或者添加，根据url
                if (!data.eid) {
                    data.eid = new Date().getTime() + "" + Math.random();
                }

                if (index) {
                    this.menuActive = String(index);
                }
                if (selected) {
                    //找到name，打开
                    // console.log(data)
                    for (var i = 0; i < this.tabs.length; i++) {
                        if (this.tabs[i].url == data.url) {
                            this.tabModel = this.tabs[i].id;
                            break;
                        }
                    }
                    return;
                }

                if (isHomeTab(data)) {
                    this.tabModel = '0';
                    this.breadcrumbs = [];
                    changeUrl(data);
                    return;
                }

                var exists = null;
                //判断是否存在，存在就直接打开
                for (var i = 0; i < this.tabs.length; i++) {
                    var tab = this.tabs[i];
                    if (tab.eid == data.eid) {
                        exists = tab;
                        continue;
                    }
                }

                if (exists) {
                    this.tabModel = exists.id;
                    this.breadcrumbs = resolveBreadcrumbs(exists);
                } else {
                    //其他的网址loading会一直转
                    if (data.url && data.url.indexOf('http') != 0) {
                        if (loading) {
                            data.loading = true;
                            this.loading = true;
                        } else {
                            data.loading = false;
                            this.loading = false;
                        }
                    }
                    // data.id = new Date().getTime() + "" + Math.random();
                    data.id = data.eid;
                    data.index = index;
                    this.tabs.push(data);
                    this.tabModel = data.id;
                }
                changeUrl(data)
                this.syncTabs();
            }
            ,
            foldClick: function () {

                //移动端浮动菜单
                var width = document.documentElement.clientWidth || document.body.clientWidth;
                if (width < 800) {
                    this.drawer = !this.drawer;
                    return;
                }
                this.menuTextShow = !this.menuTextShow;
                this.$nextTick(() => {
                    this.fold = !this.fold;

                    this.small = this.fold;
                    //设置进cookie
                    setCookie('fold', this.fold);
                });


            }
            ,
            changePassword: function () {
                this.pwdForm = {
                    oldPassword: '',
                    newPassword1: '',
                    newPassword2: ''
                };
                this.pwdErrors = {};
                this.pwdErrorMessage = '';
                this.pwdLoading = false;
                this.pwdDialogVisible = true;
            },
            closePasswordDialog: function () {
                this.pwdDialogVisible = false;
                this.pwdErrors = {};
                this.pwdErrorMessage = '';
            },
            applyPasswordErrors: function (errors, message) {
                var self = this;
                this.pwdErrors = {};
                this.pwdErrorMessage = message || '';
                Object.keys(errors || {}).forEach(function (field) {
                    self.$set(self.pwdErrors, field, errors[field]);
                });
            },
            submitPasswordChange: function () {
                var vm = window.app || this;
                vm.pwdLoading = true;
                vm.pwdErrors = {};
                vm.pwdErrorMessage = '';
                var body = new URLSearchParams();
                body.append('old_password', vm.pwdForm.oldPassword || '');
                body.append('new_password1', vm.pwdForm.newPassword1 || '');
                body.append('new_password2', vm.pwdForm.newPassword2 || '');

                fetch(window.urls.changePasswordApi, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: body.toString(),
                    credentials: 'same-origin',
                }).then(function (response) {
                    return response.text().then(function (text) {
                        var data = {};
                        try {
                            data = text ? JSON.parse(text) : {};
                        } catch (e) {
                            data = {
                                status: 'error',
                                message: getLanuage('Please correct the error below.'),
                            };
                        }

                        if (response.ok && data.status === 'ok') {
                            vm.pwdDialogVisible = false;
                            vm.pwdForm = {
                                oldPassword: '',
                                newPassword1: '',
                                newPassword2: ''
                            };
                            vm.applyPasswordErrors({}, '');
                            vm.$message.success(data.message || getLanuage('Password changed successfully.'));
                            return;
                        }

                        vm.applyPasswordErrors(data.errors || {}, data.message || getLanuage('Please correct the error below.'));
                    });
                }).catch(function () {
                    vm.applyPasswordErrors({}, getLanuage('Please correct the error below.'));
                }).finally(function () {
                    vm.pwdLoading = false;
                });
            },
            logout: function () {
                this.logoutLoading = false;
                this.logoutDialogVisible = true;
            },
            confirmLogout: function () {
                this.logoutLoading = true;

                try {
                    // Only clear tab state; theme preference is kept in localStorage/cookies.
                    delete sessionStorage['tabs'];
                } catch (e) {
                }

                var form = document.querySelector("#logout_form");
                if (form) {
                    form.submit();
                    return;
                }

                this.logoutLoading = false;
                location.replace((window.urls && window.urls.login) || '/admin/login/');
            },
            goIndex: function (url) {
                if (!url || url == 'None') {
                    url = '/';
                }
                window.open(url);
            }
            ,
            getLanuage: getLanuage,
            getIcon: getIcon,
            goZoom: function () {
                var el = window.document.body;
                if (!this.zoom) {

                    var isFullscreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
                    if (!isFullscreen) {//进入全屏,多重短路表达式
                        (el.requestFullscreen && el.requestFullscreen()) ||
                        (el.mozRequestFullScreen && el.mozRequestFullScreen()) ||
                        (el.webkitRequestFullscreen && el.webkitRequestFullscreen()) || (el.msRequestFullscreen && el.msRequestFullscreen());
                    }
                    this.zoom = true;
                } else {

                    document.exitFullscreen ? document.exitFullscreen() :
                        document.mozCancelFullScreen ? document.mozCancelFullScreen() :
                            document.webkitExitFullscreen ? document.webkitExitFullscreen() : '';
                    this.zoom = false;
                }
            }
            ,
            displayTimeline: function () {
                this.timeline = !this.timeline;
            },
            report: function (url) {
                if (!url) {
                    if (document.querySelector('html').lang) {
                        url = 'https://simpleui.72wo.com';
                    } else {
                        url = 'https://github.com/newpanjing/simpleui/issues';
                    }
                }
                window.open(url);
            }
        }
    })


})();