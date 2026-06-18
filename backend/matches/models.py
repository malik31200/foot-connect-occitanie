from django.db import models
from teams.models import Team

class Match(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('finished', 'Finished'),
        ('postponed', 'Postponed')
    ]
    SOURCE_CHOICES = [
        ('fff', 'FFF'),
        ('manual', 'Manual'),
    ]

    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches')
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches')
    category = models.CharField(max_length=50)
    season = models.CharField(max_length=20)
    group_name = models.CharField(max_length=100, blank=True, null=True)
    matchday = models.IntegerField(blank=True, null=True)
    date_time = models.DateTimeField(blank=True, null=True)
    venue = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    home_score = models.IntegerField(blank=True, null=True)
    away_score = models.IntegerField(blank=True, null=True)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='fff')
    fff_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} ({self.date_time} à {self.venue})"
