from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from .models import Post, PostMedia
from .serializers import PostSerializer
from interactions.models import Follow, Block
from django.db.models import Q
import boto3
from botocore.config import Config
import uuid
from django.conf import settings as django_settings



class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        qs = Post.objects.all().select_related(
            'author', 'match__home_team', 'match__away_team'
        ).prefetch_related('medias', 'likes').order_by('-created_at')
        author_id = self.request.query_params.get('author')
        if author_id:
            qs = qs.filter(author_id=author_id)
        else:
            # Exclure les posts des utilisateurs bloqués ET ceux qui ont bloqué l'utilisateur connecté
            if self.request.user.is_authenticated:
                blocked_ids = Block.objects.filter(
                    blocker=self.request.user
                ).values_list('blocked_id', flat=True)
                blocker_ids = Block.objects.filter(
                    blocked=self.request.user
                ).values_list('blocker_id', flat=True)
                hidden_ids = set(list(blocked_ids) + list(blocker_ids))
                qs = qs.exclude(author_id__in=hidden_ids)
        return qs

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
    

class MediaPresignView(APIView):
    """Génère une URL pré-signée pour uploader un fichier directement vers Cloudflare R2."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_name = request.data.get('file_name', 'upload')
        content_type = request.data.get('content_type', 'application/octet-stream')

        ext = file_name.rsplit('.', 1)[-1] if '.' in file_name else 'bin'
        key = f"uploads/{uuid.uuid4()}.{ext}"

        s3 = boto3.client(
            's3',
            endpoint_url=f'https://{django_settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=django_settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=django_settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto',
        )

        upload_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': django_settings.R2_BUCKET_NAME,
                'Key': key,
                'ContentType': content_type,
            },
            ExpiresIn=3600,
        )

        public_url = f"{django_settings.R2_PUBLIC_URL}/{key}"
        return Response({'upload_url': upload_url, 'public_url': public_url})


class SearchView(APIView):
    """Recherche par mot-clé : utilisateurs + publications (équipes / auteurs)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'users': [], 'posts': []})

        from users.models import User

        # Exclure les utilisateurs bloqués dans les deux sens
        blocked_ids = Block.objects.filter(blocker=request.user).values_list('blocked_id', flat=True)
        blocker_ids = Block.objects.filter(blocked=request.user).values_list('blocker_id', flat=True)
        hidden_ids = set(list(blocked_ids) + list(blocker_ids))

        # Utilisateurs dont le pseudo correspond
        users = User.objects.filter(
            username__icontains=q
        ).exclude(id__in=hidden_ids).exclude(id=request.user.id)[:10]

        # Posts : auteur correspond OU équipe dom/ext correspond
        posts = Post.objects.filter(
            Q(author__username__icontains=q) |
            Q(match__home_team__name__icontains=q) |
            Q(match__away_team__name__icontains=q)
        ).exclude(
            author_id__in=hidden_ids
        ).select_related(
            'author', 'match__home_team', 'match__away_team'
        ).prefetch_related('medias', 'likes').order_by('-created_at')[:30]

        users_data = [
            {
                'id': u.id,
                'username': u.username,
                'avatar_url': u.avatar_url,
                'sport_role': u.sport_role,
                'club_name': getattr(u, 'club_name', None),
            }
            for u in users
        ]

        return Response({
            'users': users_data,
            'posts': PostSerializer(posts, many=True, context={'request': request}).data,
        })


class FeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Exclure les posts des utilisateurs bloqués ET ceux qui ont bloqué l'utilisateur connecté
        blocked_ids = Block.objects.filter(
            blocker=request.user
        ).values_list('blocked_id', flat=True)
        blocker_ids = Block.objects.filter(
            blocked=request.user
        ).values_list('blocker_id', flat=True)
        hidden_ids = set(list(blocked_ids) + list(blocker_ids))

        posts = Post.objects.all().select_related(
            'author', 'match__home_team', 'match__away_team'
        ).prefetch_related('medias', 'likes').exclude(
            author_id__in=hidden_ids
        ).order_by('-created_at')

        return Response(PostSerializer(posts, many=True, context={'request': request}).data)
