"""Minimal Django development backend for previewing this SimpleUI checkout."""

import os
import sys
from pathlib import Path

from django.conf import settings


BASE_DIR = Path(__file__).resolve().parent

if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY="simpleui-local-development-only",
        ROOT_URLCONF=__name__,
        ALLOWED_HOSTS=["127.0.0.1", "localhost"],
        INSTALLED_APPS=[
            "simpleui",
            "django.contrib.admin",
            "django.contrib.auth",
            "django.contrib.contenttypes",
            "django.contrib.sessions",
            "django.contrib.messages",
            "django.contrib.staticfiles",
        ],
        MIDDLEWARE=[
            "django.middleware.security.SecurityMiddleware",
            "django.contrib.sessions.middleware.SessionMiddleware",
            "django.middleware.common.CommonMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
            "django.contrib.messages.middleware.MessageMiddleware",
        ],
        DATABASES={
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / ".dev_backend.sqlite3",
            }
        },
        TEMPLATES=[
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "DIRS": [],
                "APP_DIRS": True,
                "OPTIONS": {
                    "context_processors": [
                        "django.template.context_processors.request",
                        "django.contrib.auth.context_processors.auth",
                        "django.contrib.messages.context_processors.messages",
                    ]
                },
            }
        ],
        STATIC_URL="static/",
        LANGUAGE_CODE="zh-hans",
        TIME_ZONE="Asia/Shanghai",
        USE_I18N=True,
        USE_TZ=True,
        DEFAULT_AUTO_FIELD="django.db.models.BigAutoField",
        SIMPLEUI_HOME_INFO=False,
    )

import django

django.setup()

from django.contrib import admin
from django.core.management import execute_from_command_line
from django.urls import path

admin.site.site_header = "企业运营管理中心"
admin.site.site_title = "企业管理后台"
admin.site.index_title = "业务管理"

urlpatterns = [path("admin/", admin.site.urls)]


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dev_backend")
    execute_from_command_line(sys.argv)
