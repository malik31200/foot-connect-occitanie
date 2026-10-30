from datetime import datetime
from zoneinfo import ZoneInfo

from django.core.cache import cache
from django.db import IntegrityError
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import DailyActivity

PARIS = ZoneInfo('Europe/Paris')


def record_activity(user):
    """Note que l'utilisateur a utilisé l'appli aujourd'hui (au plus 1 écriture par jour)."""
    if user.role == 'admin':
        return  # on ne compte pas les admins dans les stats
    today = datetime.now(PARIS).date()
    key = f'activity:{user.id}:{today}'
    if cache.get(key):
        return
    try:
        DailyActivity.objects.get_or_create(user=user, date=today)
    except IntegrityError:
        pass  # deux requêtes en même temps : la ligne existe déjà
    cache.set(key, 1, 60 * 60 * 26)


class ActivityJWTAuthentication(JWTAuthentication):
    """Authentification JWT habituelle + enregistrement de l'activité du jour."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            try:
                record_activity(result[0])
            except Exception:
                pass  # les stats ne doivent jamais bloquer une requête
        return result
