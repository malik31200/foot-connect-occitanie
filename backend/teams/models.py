from django.db import models
from clubs.models import Club


class Team(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    group_name = models.CharField(max_length=100, blank=True, null=True)
    season = models.CharField(max_length=20)
    fff_id = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.category} ({self.season})"
