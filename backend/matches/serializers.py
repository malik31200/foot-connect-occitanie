from rest_framework import serializers
from .models import Match
from teams.serializers import TeamSerializer


class MatchSerializer(serializers.ModelSerializer):
    home_team = TeamSerializer(read_only=True)
    away_team = TeamSerializer(read_only=True)
    home_team_id =serializers.PrimaryKeyRelatedField(
        queryset=__import__('teams.models', fromlist=['Team']).Team.objects.all(),
        source='home_team',
        write_only=True,
    )

    away_team_id =serializers.PrimaryKeyRelatedField(
        queryset=__import__('teams.models', fromlist=['Team']).Team.objects.all(),
        source='away_team',
        write_only=True,
    )

    class Meta:
        model = Match
        fields = [
            'id', 'home_team', 'away_team', 'home_team_id', 'away_team_id',
            'category', 'season', 'group_name', 'matchday', 'date_time',
            'venue', 'status', 'home_score', 'away_score',
            'source', 'fff_id', 'is_locked', 'created_at', 'updated_at',
        ]
        read_only_fields = ['source', 'fff_id', 'is_locked', 'created_at', 'updated_at']
