(function (window) {
    'use strict';

    var MESSAGE_TYPES = {
        success: true,
        warning: true,
        info: true,
        error: true,
    };

    function resolveMessageType(tag) {
        if (tag === 'debug') {
            return 'info';
        }
        if (MESSAGE_TYPES[tag]) {
            return tag;
        }
        return 'info';
    }

    function showAdminMessages(vm, items, options) {
        if (!vm || !items || !items.length) {
            return;
        }

        var settings = options || {};
        var duration = typeof settings.duration === 'number' ? settings.duration : 4500;
        var delayStep = typeof settings.delayStep === 'number' ? settings.delayStep : 200;

        items.forEach(function (item, index) {
            window.setTimeout(function () {
                vm.$message({
                    message: item.msg,
                    type: resolveMessageType(item.tag),
                    duration: duration,
                    showClose: true,
                    dangerouslyUseHTMLString: true,
                });
            }, delayStep * index);
        });
    }

    window.showAdminMessages = showAdminMessages;
    window.resolveAdminMessageType = resolveMessageType;
})(window);
