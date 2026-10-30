from collections import Counter
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.db.models import Count, Min
from django.db.models.functions import TruncDate
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from interactions.models import Comment, Like
from messaging.models import Message
from posts.models import Post

from .models import DailyActivity, User

PARIS = ZoneInfo('Europe/Paris')
DAYS = 30


def start_of_day(day):
    return datetime(day.year, day.month, day.day, tzinfo=PARIS)


def count_per_day(queryset, field, since):
    """{date: nombre} pour les objets créés depuis `since`, regroupés par jour (heure de Paris)."""
    rows = (
        queryset.filter(**{f'{field}__gte': since})
        .annotate(day=TruncDate(field, tzinfo=PARIS))
        .values('day')
        .annotate(n=Count('id'))
    )
    return {r['day']: r['n'] for r in rows}


class AdminStatsView(APIView):
    """GET /api/admin/stats/ — statistiques d'utilisation, admin uniquement."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Accès réservé aux administrateurs.'}, status=403)

        today = datetime.now(PARIS).date()
        first_day = today - timedelta(days=DAYS - 1)
        since = start_of_day(first_day)

        users = User.objects.exclude(role='admin')
        activity = DailyActivity.objects.all()

        # --- Courbes jour par jour sur 30 jours
        series_sources = {
            'active': {
                r['date']: r['n']
                for r in activity.filter(date__gte=first_day).values('date').annotate(n=Count('id'))
            },
            'signups': count_per_day(users, 'date_joined', since),
            'posts': count_per_day(Post.objects.all(), 'created_at', since),
            'likes': count_per_day(Like.objects.all(), 'created_at', since),
            'comments': count_per_day(Comment.objects.all(), 'created_at', since),
            'messages': count_per_day(Message.objects.all(), 'created_at', since),
        }
        daily = []
        for i in range(DAYS):
            day = first_day + timedelta(days=i)
            row = {'date': day.isoformat()}
            for name, values in series_sources.items():
                row[name] = values.get(day, 0)
            daily.append(row)

        # --- Utilisateurs actifs
        def distinct_active(days):
            return activity.filter(date__gte=today - timedelta(days=days - 1)).values('user').distinct().count()

        tracking_since = activity.aggregate(d=Min('date'))['d']

        # --- Taux de retour : inscrits il y a 7 à 13 jours, actifs ces 7 derniers jours
        cohort = users.filter(
            date_joined__gte=start_of_day(today - timedelta(days=13)),
            date_joined__lt=start_of_day(today - timedelta(days=6)),
        )
        cohort_size = cohort.count()
        returned = (
            activity.filter(user__in=cohort, date__gte=today - timedelta(days=6))
            .values('user').distinct().count()
        )

        # --- Répartition par rôle
        role_labels = dict(User.SPORT_ROLE_CHOICES)
        roles = [
            {'role': role_labels.get(r['sport_role'], r['sport_role']), 'count': r['n']}
            for r in users.values('sport_role').annotate(n=Count('id')).order_by('-n')
        ]

        # --- Top posts de la semaine
        week_ago = start_of_day(today - timedelta(days=6))
        top_posts = [
            {
                'id': p.id,
                'author': p.author.username,
                'caption': (p.caption or '')[:80],
                'likes': p.likes_count,
                'comments': p.n_comments,
                'match': f'{p.match.home_team.name} - {p.match.away_team.name}' if p.match else None,
                'created_at': p.created_at,
            }
            for p in (
                Post.objects.filter(created_at__gte=week_ago)
                .select_related('author', 'match__home_team', 'match__away_team')
                .annotate(n_comments=Count('comments'))
                .order_by('-likes_count', '-n_comments')[:5]
            )
        ]

        # --- Équipes qui génèrent le plus de posts (30 jours)
        team_counter = Counter()
        for home, away in (
            Post.objects.filter(created_at__gte=since, match__isnull=False)
            .values_list('match__home_team__name', 'match__away_team__name')
        ):
            team_counter[home] += 1
            team_counter[away] += 1
        top_teams = [{'team': name, 'posts': n} for name, n in team_counter.most_common(5)]

        return Response({
            'kpis': {
                'users_total': users.count(),
                'new_users_7d': users.filter(date_joined__gte=week_ago).count(),
                'active_today': series_sources['active'].get(today, 0),
                'active_7d': distinct_active(7),
                'active_30d': distinct_active(30),
                'posts_total': Post.objects.count(),
            },
            'retention': {
                'cohort_size': cohort_size,
                'returned': returned,
            },
            'tracking_since': tracking_since,
            'daily': daily,
            'roles': roles,
            'top_posts': top_posts,
            'top_teams': top_teams,
        })
