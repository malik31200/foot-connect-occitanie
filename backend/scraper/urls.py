from django.urls import path
from . import views


# all endpoints reserved at admins
urlpatterns = [
    # Triggers immediate FFF synchronization (Celery async task)
    path("sync", views.sync_view),

    # Returns the summary of the last synchronization
    path("status", views.status_view),

    # Returns history of the last 30 synchronizations
    path("logs", views.logs_view),
]