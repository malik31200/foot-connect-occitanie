from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    SPORT_ROLE_CHOICES = [
        ('joueur', 'Joueur'),
        ('coach', 'Coach'),
        ('supporter', 'Supporter'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    sport_role = models.CharField(max_length=20, choices=SPORT_ROLE_CHOICES, default='supporter')
    avatar_url = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email