from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView

from .models import Log


class LogListView(LoginRequiredMixin, ListView):
    model = Log
    template_name = "audit/log_list.html"
    context_object_name = "logs"
    paginate_by = 50
