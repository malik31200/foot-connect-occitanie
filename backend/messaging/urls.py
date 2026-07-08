from django.urls import path
from .views import ConversationListView, MessageListView, MarkReadView

urlpatterns = [
    path('conversations/', ConversationListView.as_view()),
    path('conversations/<int:conversation_id>/messages/', MessageListView.as_view()),
    path('conversations/<int:conversation_id>/read/', MarkReadView.as_view()),
    
]
