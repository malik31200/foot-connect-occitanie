from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from .models import Post, PostMedia
from .serializers import PostSerializer
from interactions.models import Follow



class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Post.objects.all().select_related('author', 'match__home_team', 'match__away_team').prefetch_related('medias', 'likes')

    def create(self, request, *args, **kwargs):
        medias_data  = request.data.get('medias', [])
        if not medias_data:
            return Response({'detail': 'Au moins un média est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        
        match_id = request.data.get('match_id')
        
        post = Post.objects.create(
            author=request.user,
            match_id=match_id,
            caption=request.data.get('caption', '')
        )

        for i, media in enumerate(medias_data):
            PostMedia.objects.create(
                post=post,
                media_type=media.get('media_type'),
                media_url=media.get('media_url'),
                order=i
            )

        return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        # Only author or admin can to delete a post
        if post.author != request.user and request.user.role != 'admin':
            return Response(status=403)
        post.delete()
        return Response(status=204)
    

class FeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        following_ids = Follow.objects.filter(
            follower=request.user
        ).values_list('following', flat=True)

        if following_ids:
            posts = Post.objects.filter(author__in=following_ids)
        else:
            posts = Post.objects.all()

        posts = posts.select_related(
            'author', 'match__home_team', 'match__away_team'
        ).prefetch_related('medias', 'likes').order_by('-created_at')

        return Response(PostSerializer(posts, many=True, context={'request': request}).data)
