from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    SPORT_ROLE_CHOICES = [
        ('joueur', 'Joueur'),
        ('coach', 'Coach'),
        ('supporter', 'Supporter'),
        ('club', 'Dirigeant de club'),
        ('partenaire', 'Partenaire'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    sport_role = models.CharField(max_length=20, choices=SPORT_ROLE_CHOICES, default='supporter')
    avatar_url = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return timezone.now() < self.created_at + timedelta(minutes=15)

    def __str__(self):
        return f"Reset token for {self.user.email}"
