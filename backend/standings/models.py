from django.db import models
from teams.models import Team


class Standing(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE,
    related_name='standings')
    category = models.CharField(max_length=100)
    season = models.CharField(max_length=10)
    group_name = models.CharField(max_length=100)
    played = models.IntegerField(default=0)
    won = models.IntegerField(default=0)
    draw = models.IntegerField(default=0)
    lost = models.IntegerField(default=0)
    goals_for = models.IntegerField(default=0)
    goals_against = models.IntegerField(default=0)
    goal_diff = models.IntegerField(default=0)
    points = models.IntegerField(default=0)
    rank = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('team', 'category', 'season', 'group_name')]
        ordering = ['rank']

    def __str__(self):
        return f"{self.team.name} - {self.category} {self.season} (#{self.rank})"
