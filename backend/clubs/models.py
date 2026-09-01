from django.db import models


class Club(models.Model):
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100, blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    fff_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    stadium = models.CharField(max_length=300, blank=True, null=True, help_text="Adresse complète du stade")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.city})"
    