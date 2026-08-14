from rest_framework import serializers
from .models import Team
from clubs.serializers import ClubSerializer


class TeamSerializer(serializers.ModelSerializer):
    club = ClubSerializer(read_only=True)
    club_id = serializers.PrimaryKeyRelatedField(
        queryset =__import__('clubs.models', fromlist=['Club']).Club.objects.all(),
        source='club',
        write_only=True,
    )
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'club', 'club_id', 'name', 'category', 'group_name',
                  'season', 'fff_id', 'created_at', 'logo_url']
        read_only_fields = ['created_at']

    def get_logo_url(self, obj):
        return obj.club.logo_url if obj.club else None

    def validate_fff_id(self, value):
        if value == '':
            return None
        return value
