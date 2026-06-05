from rest_framework import serializers
from .models import Club


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'city', 'logo_url', 'fff_id', 'created_at']
        read_only_fields = ['created_at']
