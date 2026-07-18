from django.apps import AppConfig


class SimpleApp(AppConfig):
    name = 'simpleui'

    def ready(self):
        self._remove_xframe_options_middleware()
        self._patch_admin_urls()

    @staticmethod
    def _remove_xframe_options_middleware():
        try:
            import django
            version = django.get_version()
            if int(version.split('.')[0]) >= 3:
                from django.conf import settings
                for index, item in enumerate(settings.MIDDLEWARE):
                    if item == 'django.middleware.clickjacking.XFrameOptionsMiddleware':
                        settings.MIDDLEWARE.pop(index)
        except Exception:
            pass

    @staticmethod
    def _patch_admin_urls():
        from django.contrib import admin
        from django.urls import path

        if getattr(admin.site, '_simpleui_urls_patched', False):
            return

        from simpleui.views import logout_confirm, password_change_api

        original_get_urls = admin.site.get_urls

        def get_urls():
            custom = [
                path('logout/confirm/', admin.site.admin_view(logout_confirm), name='logout_confirm'),
                path('simpleui/password-change/', admin.site.admin_view(password_change_api), name='simpleui_password_change'),
            ]
            return custom + original_get_urls()

        admin.site.get_urls = get_urls
        admin.site._simpleui_urls_patched = True
