from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from posts.models import Post
from users.models import User
from .models import Like, Comment, Follow
from .serializers import CommentSerializer, FollowSerializer


class LikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if not created:
            like.delete()
            post.likes_count = max(0, post.likes_count - 1)
            post.save()
            return Response({'liked': False, 'likes_count': post.likes_count})

        post.likes_count += 1
        post.save()
        return Response({'liked': True, 'likes_count': post.likes_count})
    

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        return Comment.objects.filter(post=post)
    
    def perform_create(self, serializer):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        serializer.save(author=self.request.user, post=post)

    def perform_update(self, serializer):
        serializer.save(is_edited=True)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()

        if comment.author != request.user and not request.user.role == 'admin':
            return Response(status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class FollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        target = get_object_or_404(User, id=user_id)

        if target == self.request.user:
            return Response({'detail': 'Vous ne pouvez pas vous suivre vous-même.'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(follower=self.request.user, following=target)
        if not created:
            follow.delete()
            return Response({'following': False})
        return Response({'following': True})
        
    
