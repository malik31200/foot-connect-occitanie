from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from posts.models import Post
from users.models import User
from .models import Like, Comment, Follow, Block, Report, CommentLike, CommentReport
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
        # Seulement les commentaires de premier niveau (pas les réponses)
        return Comment.objects.filter(post=post, parent=None).select_related('author').prefetch_related('likes', 'replies__author', 'replies__likes')

    def perform_create(self, serializer):
        post = get_object_or_404(Post, id=self.kwargs['post_id'])
        parent_id = self.request.data.get('parent_id')
        parent = None
        if parent_id:
            parent = get_object_or_404(Comment, id=parent_id, post=post)
        serializer.save(author=self.request.user, post=post, parent=parent)

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
        
    


class BlockToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.id == user_id:
            return Response({'detail': 'Impossible de se bloquer soi-même.'}, status=status.HTTP_400_BAD_REQUEST)
        target = get_object_or_404(User, id=user_id)
        block, created = Block.objects.get_or_create(blocker=request.user, blocked=target)
        if not created:
            block.delete()
            return Response({'blocked': False})
        # Retirer les follows dans les deux sens
        Follow.objects.filter(follower=request.user, following=target).delete()
        Follow.objects.filter(follower=target, following=request.user).delete()
        return Response({'blocked': True})


class ReportPostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        reason = request.data.get('reason', 'inappropriate')
        Report.objects.get_or_create(
            reporter=request.user,
            post=post,
            defaults={'reason': reason}
        )
        return Response({'detail': 'Contenu signalé. Notre équipe va examiner ce signalement.'})


class CommentLikeToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        like, created = CommentLike.objects.get_or_create(user=request.user, comment=comment)
        if not created:
            like.delete()
            return Response({'liked': False, 'likes_count': comment.likes.count()})
        return Response({'liked': True, 'likes_count': comment.likes.count()})


class ReportCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        reason = request.data.get('reason', 'inappropriate')
        CommentReport.objects.get_or_create(
            reporter=request.user,
            comment=comment,
            defaults={'reason': reason}
        )
        return Response({'detail': 'Commentaire signalé. Notre équipe va examiner ce signalement.'})


def is_admin(user):
    return user.is_authenticated and user.role == 'admin'


class ReportsListView(APIView):
    """Liste tous les signalements (posts + commentaires) — admin uniquement."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'}, status=403)
        post_reports = Report.objects.select_related('reporter', 'post', 'post__author').order_by('-created_at')
        comment_reports = CommentReport.objects.select_related('reporter', 'comment', 'comment__author', 'comment__post').order_by('-created_at')
        post_data = [{
            'id': r.id, 'type': 'post', 'reason': r.reason,
            'reporter': r.reporter.username, 'created_at': r.created_at,
            'post_id': r.post.id, 'post_author': r.post.author.username,
            'post_caption': r.post.caption or '',
        } for r in post_reports]
        comment_data = [{
            'id': r.id, 'type': 'comment', 'reason': r.reason,
            'reporter': r.reporter.username, 'created_at': r.created_at,
            'comment_id': r.comment.id, 'comment_author': r.comment.author.username,
            'comment_content': r.comment.content, 'post_id': r.comment.post.id,
        } for r in comment_reports]
        return Response({'post_reports': post_data, 'comment_reports': comment_data})

    def delete(self, request):
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'}, status=403)
        report_type = request.query_params.get('type')
        report_id = request.query_params.get('id')
        if report_type == 'post':
            Report.objects.filter(id=report_id).delete()
        elif report_type == 'comment':
            CommentReport.objects.filter(id=report_id).delete()
        return Response({'detail': 'Signalement supprimé.'})
