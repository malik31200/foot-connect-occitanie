from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, FeedView, SearchView


router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

urlpatterns = router.urls + [
    path('feed/', FeedView.as_view(), name='feed'),
    path('search/', SearchView.as_view(), name='search'),
]
