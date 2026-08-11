from rest_framework import serializers
from .models import Club


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ['id', 'name', 'city', 'logo_url', 'fff_id', 'created_at']
        read_only_fields = ['created_at']

    def validate_fff_id(self, value):
        # Convertit une chaîne vide en null pour éviter la contrainte unique
        if value == '':
            return None
        return value
