from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import SyncLog
from .tasks import sync_fff


def is_admin(user):
    return user.is_authenticated and user.role == "admin"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sync_view(request):
    if not is_admin(request.user):
        return Response({"detail": "Accès réservé aux administrateurs."},
                    status=status.HTTP_403_FORBIDDEN)
    task = sync_fff.delay()
    return Response({"message": "Synchronisation lancée.", "task_id": task.id},
                    status=status.HTTP_202_ACCEPTED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def status_view(request):
    if not is_admin(request.user):
        return Response({"detail": "Accès réservé aux administrateurs."},
                        status=status.HTTP_403_FORBIDDEN)
    log = SyncLog.objects.order_by("-started_at").first()

    if log is None:
        return Response({"detail": "Aucune synchronisation effectuée."},
                        status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        "last_sync": log.started_at,
        "finished_at": log.finished_at,
        "status": log.status,
        "matches_synced": log.matches_synced,
        "errors_count": log.errors_count,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def logs_view(request):
    if not is_admin(request.user):
        return Response({"detail": "Accès réservé aux administrateurs."},
                        status=status.HTTP_403_FORBIDDEN)
    
    logs = SyncLog.objects.order_by("-started_at")[:30]
    data = [
        {
            "id": log.id,
            "started_at": log.started_at,
            "finished_at": log.finished_at,
            "status": log.status,
            "clubs_synced": log.clubs_synced,
            "teams_synced": log.teams_synced,
            "matches_synced": log.matches_synced,
            "results_synced": log.results_synced,
            "errors_count": log.errors_count,
            "error_details": log.error_details,
        }
        for log in logs
    ]
    return Response(data)