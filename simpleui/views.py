from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.forms import PasswordChangeForm
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST
from django.views.generic import TemplateView


@method_decorator(never_cache, name='dispatch')
@method_decorator(staff_member_required, name='dispatch')
class LogoutConfirmView(TemplateView):
    template_name = 'registration/logout_confirm.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = context.get('title') or 'Log out'
        return context


logout_confirm = LogoutConfirmView.as_view()


@never_cache
@staff_member_required
@require_POST
def password_change_api(request):
    form = PasswordChangeForm(user=request.user, data=request.POST)
    if form.is_valid():
        form.save()
        return JsonResponse({
            'status': 'ok',
            'message': _('Password changed successfully.'),
        })

    errors = {}
    for field, messages in form.errors.items():
        if field == '__all__':
            continue
        if messages:
            errors[field] = str(messages[0])

    non_field_errors = [str(message) for message in form.non_field_errors()]
    message = ''
    if non_field_errors:
        message = non_field_errors[0]
    elif not errors:
        message = _('Please correct the error below.')
    return JsonResponse({
        'status': 'error',
        'message': message,
        'errors': errors,
    }, status=400)
