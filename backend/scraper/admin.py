from django.contrib import admin
from .models import SyncLog


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ["id", "status", "started_at", "finished_at", "matches_synced", "errors_count"]

    list_filter = ["status"]

    readonly_fields = ["started_at", "finished_at", "status", "clubs_synced", "teams_synced",
                       "matches_synced", "results_synced", "error_details"]