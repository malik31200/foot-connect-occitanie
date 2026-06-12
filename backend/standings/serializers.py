from rest_framework import serializers
from .models import Standing


class StandingSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = Standing
        fields = [
            'id', 'team', 'team_name', 'category', 'season', 'group_name',
            'played', 'won', 'draw', 'lost',
            'goals_for', 'goals_against', 'goal_diff',
            'points', 'rank', 'updated_at',
        ]
