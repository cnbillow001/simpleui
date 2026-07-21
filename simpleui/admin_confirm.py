from decimal import Decimal

from django.contrib import messages
from django.contrib.admin import helpers
from django.contrib.admin.utils import model_ngettext
from django.core.exceptions import FieldDoesNotExist, PermissionDenied
from django.template.response import TemplateResponse
from django.utils.safestring import mark_safe
from django.utils.translation import gettext as _


def build_delete_confirm_table(modeladmin, objects):
    field_names = modeladmin.get_delete_confirm_fields()
    if not field_names:
        return {'headers': [], 'rows': []}

    headers = [modeladmin.get_delete_confirm_field_label(name) for name in field_names]
    rows = []
    for obj in objects:
        rows.append([modeladmin.format_delete_confirm_cell(obj, name) for name in field_names])
    return {'headers': headers, 'rows': rows}


def delete_selected_with_confirm_table(modeladmin, request, queryset):
    opts = modeladmin.model._meta
    app_label = opts.app_label

    deletable_objects, model_count, perms_needed, protected = modeladmin.get_deleted_objects(
        queryset, request
    )

    if request.POST.get('post') and not protected:
        if perms_needed:
            raise PermissionDenied
        count = len(queryset)
        if count:
            modeladmin.log_deletions(request, queryset)
            modeladmin.delete_queryset(request, queryset)
            modeladmin.message_user(
                request,
                _('Successfully deleted %(count)d %(items)s.')
                % {'count': count, 'items': model_ngettext(modeladmin.opts, count)},
                messages.SUCCESS,
            )
        return None

    objects_name = model_ngettext(queryset)
    title = (
        _('Cannot delete %(name)s') % {'name': objects_name}
        if perms_needed or protected
        else _('Delete multiple objects')
    )

    context = {
        **modeladmin.admin_site.each_context(request),
        'title': title,
        'subtitle': None,
        'objects_name': str(objects_name),
        'deletable_objects': [deletable_objects],
        'model_count': dict(model_count).items(),
        'queryset': queryset,
        'confirm_table': build_delete_confirm_table(modeladmin, queryset),
        'related_delete_summary': build_related_delete_summary(model_count, opts),
        'perms_lacking': perms_needed,
        'protected': protected,
        'opts': opts,
        'action_checkbox_name': helpers.ACTION_CHECKBOX_NAME,
        'media': modeladmin.media,
    }

    request.current_app = modeladmin.admin_site.name
    return TemplateResponse(
        request,
        modeladmin.delete_selected_confirmation_template
        or [
            f'admin/{app_label}/{opts.model_name}/delete_selected_confirmation.html',
            f'admin/{app_label}/delete_selected_confirmation.html',
            'admin/delete_selected_confirmation.html',
        ],
        context,
    )


def build_related_delete_summary(model_count, opts):
    primary = opts.verbose_name_plural
    related = []
    for model_name, count in model_count.items():
        if model_name != primary:
            related.append({'label': model_name, 'count': count})
    return related


class DeleteConfirmTableMixin:
    delete_confirm_fields = None
    delete_confirm_field_limit = 8
    delete_confirm_field_labels = None

    def get_delete_confirm_fields(self):
        if self.delete_confirm_fields:
            return self.delete_confirm_fields
        if self.list_display:
            return tuple(self.list_display[: self.delete_confirm_field_limit])
        return ()

    def get_delete_confirm_field_label(self, field_name):
        labels = self.delete_confirm_field_labels or {}
        if field_name in labels:
            return labels[field_name]

        method = getattr(self, field_name, None)
        if method is not None and hasattr(method, 'short_description'):
            return str(method.short_description)

        try:
            return str(self.model._meta.get_field(field_name).verbose_name)
        except FieldDoesNotExist:
            return field_name.replace('_', ' ')

    def format_delete_confirm_cell(self, obj, field_name):
        method = getattr(self, field_name, None)
        if method is not None and callable(method):
            value = method(obj)
        elif hasattr(obj, f'get_{field_name}_display'):
            value = getattr(obj, f'get_{field_name}_display')()
        else:
            value = getattr(obj, field_name, None)

        if value in (None, ''):
            return '—'
        if isinstance(value, Decimal):
            return f'¥{value}'
        if isinstance(value, bool):
            return '是' if value else '否'
        if hasattr(value, 'strftime'):
            return value.strftime('%Y-%m-%d %H:%M')
        return mark_safe(value) if hasattr(value, '__html__') else str(value)

    def get_delete_confirm_table(self, objects):
        return build_delete_confirm_table(self, objects)

    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            _func, name, description = actions['delete_selected']
            actions['delete_selected'] = (
                delete_selected_with_confirm_table,
                name,
                description,
            )
        return actions

    def render_delete_form(self, request, context):
        obj = context.get('object')
        if obj is not None:
            context['confirm_table'] = self.get_delete_confirm_table([obj])
            primary = self.opts.verbose_name_plural
            related = []
            for model_name, count in context.get('model_count', []):
                if model_name != primary:
                    related.append({'label': model_name, 'count': count})
            context['related_delete_summary'] = related
        return super().render_delete_form(request, context)


def patch_model_admin_delete_confirm():
    from django.contrib.admin import ModelAdmin

    if getattr(ModelAdmin, '_simpleui_delete_confirm_patched', False):
        return

    mixin = DeleteConfirmTableMixin
    ModelAdmin.delete_confirm_fields = None
    ModelAdmin.delete_confirm_field_limit = 8
    ModelAdmin.delete_confirm_field_labels = None
    ModelAdmin.get_delete_confirm_fields = mixin.get_delete_confirm_fields
    ModelAdmin.get_delete_confirm_field_label = mixin.get_delete_confirm_field_label
    ModelAdmin.format_delete_confirm_cell = mixin.format_delete_confirm_cell
    ModelAdmin.get_delete_confirm_table = mixin.get_delete_confirm_table

    original_get_actions = ModelAdmin.get_actions

    def get_actions(self, request):
        actions = original_get_actions(self, request)
        if 'delete_selected' in actions:
            _func, name, description = actions['delete_selected']
            actions['delete_selected'] = (
                delete_selected_with_confirm_table,
                name,
                description,
            )
        return actions

    ModelAdmin.get_actions = get_actions

    original_render_delete_form = ModelAdmin.render_delete_form

    def render_delete_form(self, request, context):
        obj = context.get('object')
        if obj is not None:
            context['confirm_table'] = self.get_delete_confirm_table([obj])
            primary = self.opts.verbose_name_plural
            related = []
            for model_name, count in context.get('model_count', []):
                if model_name != primary:
                    related.append({'label': model_name, 'count': count})
            context['related_delete_summary'] = related
        return original_render_delete_form(self, request, context)

    ModelAdmin.render_delete_form = render_delete_form
    ModelAdmin._simpleui_delete_confirm_patched = True
