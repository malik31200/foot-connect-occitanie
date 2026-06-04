from django.db import models


class SyncLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failure', 'Failure'),
        ('partial', 'Partial'),
    ]

    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    clubs_synced = models.IntegerField(default=0)
    teams_synced = models.IntegerField(default=0)
    matches_synced = models.IntegerField(default=0)
    results_synced = models.IntegerField(default=0)
    errors_count = models.IntegerField(default=0)
    error_details = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"SyncLog {self.started_at} - {self.status}"
    