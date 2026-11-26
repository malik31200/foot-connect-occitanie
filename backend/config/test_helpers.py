"""Fonctions communes aux tests de l'API."""
from datetime import datetime
from zoneinfo import ZoneInfo

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from clubs.models import Club
from matches.models import Match
from teams.models import Team
from users.models import User

PARIS = ZoneInfo('Europe/Paris')
PASSWORD = 'Football2026!'


def make_user(username, role='user', **extra):
    return User.objects.create_user(
        username=username, email=f'{username}@example.com', password=PASSWORD, role=role, **extra
    )


def client_for(user=None):
    """Client API, connecté avec un jeton JWT si un utilisateur est donné."""
    client = APIClient()
    if user is not None:
        token = RefreshToken.for_user(user).access_token
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


def make_team(name, category='U18', group='Poule B', season='2026/2027'):
    club = Club.objects.create(name=name, city='Toulouse')
    return Team.objects.create(club=club, name=name, category=category, group_name=group, season=season)


def make_match(home, away, home_score=None, away_score=None, **extra):
    status = 'finished' if home_score is not None else 'scheduled'
    return Match.objects.create(
        home_team=home, away_team=away,
        category=home.category, season=home.season, group_name=home.group_name,
        matchday=extra.pop('matchday', 1),
        date_time=extra.pop('date_time', datetime(2026, 10, 24, 11, 0, tzinfo=PARIS)),
        status=status, home_score=home_score, away_score=away_score, **extra,
    )
