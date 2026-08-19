from rest_framework import serializers
from .models import Comment, Follow

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_avatar_url = serializers.CharField(source='author.avatar_url', read_only=True, allow_null=True)

    class Meta:
        model = Comment
        fields = ['id', 'author_id', 'author_username', 'author_avatar_url', 'content', 'is_edited', 'created_at', 'updated_at']
        read_only_fields = ['is_edited', 'created_at', 'updated_at']


class FollowSerializer(serializers.ModelSerializer):
    follower_username = serializers.CharField(source='follower.username', read_only=True)
    following_username = serializers.CharField(source='following.username', read_only=True)
                                            
    class Meta:
        model = Follow
        fields = ['id', 'follower_username', 'following_username', 'created_at']
                                            