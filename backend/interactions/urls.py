from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LikeToggleView, CommentViewSet, FollowToggleView, BlockToggleView, ReportPostView, CommentLikeToggleView, ReportCommentView, ReportsListView


router = DefaultRouter()
router.register(r'posts/(?P<post_id>[^/.]+)/comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('posts/<int:post_id>/like/', LikeToggleView.as_view(), name='like-toggle'),
    path('posts/<int:post_id>/report/', ReportPostView.as_view(), name='report-post'),
    path('users/<int:user_id>/follow/', FollowToggleView.as_view(), name='follow-toggle'),
    path('users/<int:user_id>/block/', BlockToggleView.as_view(), name='block-user'),
    path('comments/<int:comment_id>/like/', CommentLikeToggleView.as_view(), name='comment-like-toggle'),
    path('comments/<int:comment_id>/report/', ReportCommentView.as_view(), name='report-comment'),
    path('reports/', ReportsListView.as_view(), name='reports-list'),
]