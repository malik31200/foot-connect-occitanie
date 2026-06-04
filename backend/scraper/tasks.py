from celery import shared_task
from django.utils import timezone
from .models import SyncLog
from . import service


@shared_task
def sync_fff():
    started_at = timezone.now()
    log = SyncLog.objects.create(
        started_at=started_at,
        status="partial",
    )

    try:
        stats = service.sync_matches()
        log.status = "success" if stats["errors_count"] == 0 else "partial"
    except Exception as e:
        stats = {
            "clubs_synced": 0,
            "teams_synced": 0,
            "matches_synced": 0,
            "results_synced": 0,
            "errors_count": 1,
            "error_details": [str(e)],
        }
        log.status = "failure"

    log.finished_at = timezone.now()
    log.clubs_synced = stats["clubs_synced"]
    log.teams_synced = stats["teams_synced"]
    log.matches_synced = stats["matches_synced"]
    log.results_synced = stats["results_synced"]
    log.errors_count = stats["errors_count"]
    log.error_details = stats["error_details"]
    log.save()

    return stats