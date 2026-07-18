if (parent.callback) {
    //如果是在子框架内就把首页刷新
    parent.callback();
}

function loginMessage(key, fallback) {
    if (window.Lanuages && Lanuages[key]) {
        return Lanuages[key];
    }
    return fallback || key;
}

var loginApp = new Vue({
    el: '.login-main',
    data: {
        username: '',
        password: '',
        loading: false
    },
    methods: {
        login: function () {
            this.loading = true;
            if (this.username === "" || this.password === "") {
                this.$message.error(
                    loginMessage('Please enter your username or password!', 'Please enter your username or password!')
                );
                this.loading = false;
                return;
            }
            this.$nextTick(function () {
                document.getElementById('login-form').submit();
            });
        }
    }
});
