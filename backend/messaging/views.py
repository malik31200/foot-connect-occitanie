from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from users.models import User
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(
            user1=request.user
        ) | Conversation.objects.filter(
            user2=request.user
        )
        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        target_id = request.data.get('target_user_id')
        target = get_object_or_404(User, id=target_id)

        if target == request.user:
            return Response({'detail': 'Impossible de créer une conversation avec soi-même.'}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation = Conversation.objects.filter(
            user1=request.user, user2=target
        ).first() or Conversation.objects.filter(
            user1=target, user2=request.user
        ).first()

        if not conversation:
            conversation = Conversation.objects.create(user1=request.user, user2=target)

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    

class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if request.user not in [conversation.user1, conversation.user2]:
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        messages = conversation.messages.all()
        return Response(MessageSerializer(messages, many=True).data)
    
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if request.user not in [conversation.user1, conversation.user2]:
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        serializer = MessageSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(sender=request.user, conversation=conversation)
            conversation.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        if request.user not in [conversation.user1, conversation.user2]:
            return Response(status=status.HTTP_403_FORBIDDEN)
        updated = conversation.messages.filter(
            is_read=False
        ).exclude(sender=request.user).update(is_read=True)
        return Response({'marked_read': updated})
