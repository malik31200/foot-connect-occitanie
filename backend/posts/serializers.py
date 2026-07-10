from rest_framework import serializers
from .models import Post, PostMedia


class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ['id', 'media_type', 'media_url', 'order']


class PostSerializer(serializers.ModelSerializer):
    medias = PostMediaSerializer(many=True, read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    match_info = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id','author_id', 'author_username', 'match_info', 'caption', 'likes_count', 'comments_count', 'medias', 'created_at']

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_match_info(self, obj):
        if not obj.match:
            return None
        return {
            'id': obj.match.id,
            'home_team': obj.match.home_team.name,
            'away_team': obj.match.away_team.name,
            'date_time': obj.match.date_time,
        }

