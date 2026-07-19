'use strict';

(function () {
    function readAccentColor() {
        var value = window.getComputedStyle(document.documentElement).getPropertyValue('--su-input-accent');
        value = value && value.trim();
        return value || '#409eff';
    }

    function syncSelectorAccent(root) {
        var accent = readAccentColor();
        var scope = root || document;
        scope.querySelectorAll('.selector select').forEach(function (select) {
            select.style.setProperty('accent-color', accent, 'important');
        });
    }

    function renderPanel(select) {
        var panel = select.simpleuiPanel;
        if (!panel) {
            return;
        }
        panel.innerHTML = '';
        Array.prototype.forEach.call(select.options, function (option) {
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'simpleui-selector-item' + (option.selected ? ' is-selected' : '');
            item.textContent = option.text;
            item.title = option.text;
            item.addEventListener('mousedown', function (event) {
                event.preventDefault();
            });
            item.addEventListener('click', function (event) {
                if (event.ctrlKey || event.metaKey) {
                    option.selected = !option.selected;
                } else if (event.shiftKey && select.simpleuiLastIndex != null) {
                    var options = Array.prototype.slice.call(select.options);
                    var currentIndex = options.indexOf(option);
                    var start = Math.min(select.simpleuiLastIndex, currentIndex);
                    var end = Math.max(select.simpleuiLastIndex, currentIndex);
                    if (!event.ctrlKey && !event.metaKey) {
                        options.forEach(function (opt) {
                            opt.selected = false;
                        });
                    }
                    for (var i = start; i <= end; i += 1) {
                        options[i].selected = true;
                    }
                } else {
                    Array.prototype.forEach.call(select.options, function (opt) {
                        opt.selected = false;
                    });
                    option.selected = true;
                }
                select.simpleuiLastIndex = Array.prototype.indexOf.call(select.options, option);
                renderPanel(select);
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
            panel.appendChild(item);
        });
    }

    function enhanceSelectorSelect(select) {
        if (!select || select.multiple !== true || select.dataset.simpleuiSelectorEnhanced === '1') {
            return;
        }
        select.dataset.simpleuiSelectorEnhanced = '1';
        select.classList.add('simpleui-selector-native');

        var wrap = document.createElement('div');
        wrap.className = 'simpleui-selector-list-wrap';
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(select);

        var panel = document.createElement('div');
        panel.className = 'simpleui-selector-panel';
        panel.setAttribute('role', 'listbox');
        panel.setAttribute('aria-multiselectable', 'true');
        wrap.appendChild(panel);
        select.simpleuiPanel = panel;
        select.simpleuiLastIndex = null;

        var observer = new MutationObserver(function () {
            renderPanel(select);
        });
        observer.observe(select, { childList: true });

        select.addEventListener('change', function () {
            renderPanel(select);
        });

        renderPanel(select);
    }

    function enhanceSelectors(root) {
        var scope = root || document;
        scope.querySelectorAll('.selector select[multiple]').forEach(enhanceSelectorSelect);
        syncSelectorAccent(scope);
    }

    function scheduleEnhance(root) {
        var delays = [0, 100, 300, 800];
        for (var i = 0; i < delays.length; i++) {
            window.setTimeout(function () {
                enhanceSelectors(root);
            }, delays[i]);
        }
    }

    function bindSelectorActions(root) {
        var scope = root || document;
        scope.querySelectorAll('.selector-add, .selector-remove, .selector-chooseall, .selector-clearall').forEach(function (button) {
            if (button.dataset.simpleuiSelectorBound === '1') {
                return;
            }
            button.dataset.simpleuiSelectorBound = '1';
            button.addEventListener('click', function () {
                window.setTimeout(function () {
                    enhanceSelectors(scope);
                }, 0);
            });
        });
    }

    window.syncSimpleuiSelectorAccent = function (root) {
        syncSelectorAccent(root);
        enhanceSelectors(root);
    };

    function boot(root) {
        enhanceSelectors(root);
        bindSelectorActions(root);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            scheduleEnhance();
            bindSelectorActions();
        });
    } else {
        scheduleEnhance();
        bindSelectorActions();
    }

    document.addEventListener('formset:added', function (event) {
        scheduleEnhance(event.target);
        bindSelectorActions(event.target);
    });
})();
