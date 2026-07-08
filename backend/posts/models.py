from django.db import models
from django.conf import settings
from matches.models import Match


class Post(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='posts')
    caption = models.TextField(blank=True)
    likes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
            return f"{self.author} - {self.match}"
        
class PostMedia(models.Model):
    MEDIA_TYPES  = [('photo', 'Photo'), ('video', 'Video')]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='medias')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    media_url = models.URLField()
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.media_type} #{self.order} - Post {self.post.id}"
