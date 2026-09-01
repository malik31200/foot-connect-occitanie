from rest_framework import serializers
from .models import Comment, Follow, CommentLike

class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_avatar_url = serializers.CharField(source='author.avatar_url', read_only=True, allow_null=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(source='parent.id', read_only=True, allow_null=True)
    replies = serializers.SerializerMethodField()

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_replies(self, obj):
        # Seulement pour les commentaires de premier niveau
        if obj.parent_id is not None:
            return []
        qs = obj.replies.select_related('author').prefetch_related('likes').all()
        return CommentSerializer(qs, many=True, context=self.context).data

    class Meta:
        model = Comment
        fields = ['id', 'author_id', 'author_username', 'author_avatar_url',
                  'content', 'is_edited', 'parent_id', 'replies',
                  'created_at', 'updated_at', 'likes_count', 'is_liked']
        read_only_fields = ['is_edited', 'created_at', 'updated_at']


class FollowSerializer(serializers.ModelSerializer):
    follower_username = serializers.CharField(source='follower.username', read_only=True)
    following_username = serializers.CharField(source='following.username', read_only=True)
                                            
    class Meta:
        model = Follow
        fields = ['id', 'follower_username', 'following_username', 'created_at']
                                            