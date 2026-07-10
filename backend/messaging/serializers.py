from rest_framework import serializers
from .models import Conversation, Message
from users.models import User


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'sender_username', 'content', 'is_read', 'created_at')
        read_only_fields = ['is_read', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    other_username = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'other_username', 'last_message', 'unread_count', 'updated_at']

    def get_other_username(self, obj):
        user = self.context['request'].user
        return obj.other_user(user).username
    
    def get_last_message(self, obj):
        msg = obj.messages.last()
        return msg.content if msg else None
    
    def get_unread_count(self,obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()