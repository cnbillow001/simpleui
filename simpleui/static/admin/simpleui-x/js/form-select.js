'use strict';

(function () {
    function getJQuery() {
        var djangoJq = window.django && window.django.jQuery;
        var globalJq = window.jQuery;
        var candidates = [djangoJq, globalJq];

        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i] && candidates[i].fn && candidates[i].fn.select2) {
                return candidates[i];
            }
        }

        return djangoJq || globalJq || null;
    }

    function shouldEnhanceSelect(element) {
        if (!element || element.multiple) {
            return false;
        }
        if (element.classList.contains('admin-autocomplete')) {
            return false;
        }
        if (element.classList.contains('select2-hidden-accessible')) {
            return false;
        }
        if (element.name && element.name.indexOf('__prefix__') !== -1) {
            return false;
        }
        return true;
    }

    function buildSelect2Options($, $el) {
        var options = {
            width: 'style',
            dropdownAutoWidth: true,
            minimumResultsForSearch: 12,
            dropdownParent: $(document.body)
        };

        if ($el.closest('#result_list').length) {
            options.width = 'resolve';
            options.minimumResultsForSearch = Infinity;
        }

        if ($el.closest('.inline-group').length) {
            options.width = '100%';
        }

        return options;
    }

    function initSimpleuiSelects(root) {
        var $ = getJQuery();
        if (!$ || !$.fn.select2) {
            return;
        }

        var $scope = root ? $(root) : $(document);
        $scope.find('select').each(function () {
            if (!shouldEnhanceSelect(this)) {
                return;
            }

            var $el = $(this);
            if ($el.data('simpleuiSelect2')) {
                return;
            }

            $el.select2(buildSelect2Options($, $el));
            $el.data('simpleuiSelect2', true);
        });
    }

    function scheduleInit(root) {
        window.setTimeout(function () {
            initSimpleuiSelects(root);
        }, 0);
    }

    function boot() {
        window.initSimpleuiSelects = initSimpleuiSelects;

        var bind = function (fn) {
            var $ = getJQuery();
            if ($) {
                $(fn);
                return;
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', fn);
            } else {
                fn();
            }
        };

        bind(function () {
            initSimpleuiSelects();
            scheduleInit();
        });

        window.addEventListener('load', function () {
            initSimpleuiSelects();
        });

        document.addEventListener('formset:added', function (event) {
            initSimpleuiSelects(event.target);
            scheduleInit(event.target);
        });
    }

    boot();
})();
