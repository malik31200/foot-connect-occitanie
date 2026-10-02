from itertools import groupby

from celery import shared_task
from matches.models import Match
from teams.models import Team
from .models import Standing


@shared_task
def recalcul_standing(category, season, group_name):
    # Retrieve all matches finished of this group_name
    matches = list(Match.objects.filter(
        category=category,
        season=season,
        group_name=group_name,
        status='finished',
        home_score__isnull=False,
    ))

    # Collects the IDs of all teams in the group_name
    team_ids = set()
    for match in matches:
        team_ids.add(match.home_team_id)
        team_ids.add(match.away_team_id)

    stats = {}
    for team_id in team_ids:
        stats[team_id] = {
            'played': 0, 'won': 0, 'draw': 0, 'lost': 0,
            'goals_for': 0, 'goals_against': 0,
        }

    # Calculate the stats for each team
    for match in matches:
        h = match.home_team_id
        a = match.away_team_id
        hg = match.home_score
        ag = match.away_score

        stats[h]['played'] += 1
        stats[h]['goals_for'] += hg
        stats[h]['goals_against'] += ag

        stats[a]['played'] += 1
        stats[a]['goals_for'] += ag
        stats[a]['goals_against'] += hg

        if hg > ag:
            stats[h]['won'] += 1
            stats[a]['lost'] += 1
        elif hg < ag:
            stats[a]['won'] += 1
            stats[h]['lost'] += 1
        else:
            stats[h]['draw'] += 1
            stats[a]['draw'] += 1

    # Calculate points and overall goal difference
    for team_id, s in stats.items():
        s['points'] = s['won'] * 3 + s['draw']
        s['goal_diff'] = s['goals_for'] - s['goals_against']

    def head_to_head_stats(team_subset_ids):
        """Points / diff / buts marqués calculés uniquement sur les matchs
        opposant les équipes à égalité de points entre elles (règle FFF :
        confrontation directe avant différence de buts générale)."""
        h2h = {tid: {'points': 0, 'goal_diff': 0, 'goals_for': 0} for tid in team_subset_ids}
        for match in matches:
            h, a = match.home_team_id, match.away_team_id
            if h in team_subset_ids and a in team_subset_ids:
                hg, ag = match.home_score, match.away_score
                h2h[h]['goals_for'] += hg
                h2h[h]['goal_diff'] += hg - ag
                h2h[a]['goals_for'] += ag
                h2h[a]['goal_diff'] += ag - hg
                if hg > ag:
                    h2h[h]['points'] += 3
                elif hg < ag:
                    h2h[a]['points'] += 3
                else:
                    h2h[h]['points'] += 1
                    h2h[a]['points'] += 1
        return h2h

    # Classement : d'abord par points, puis au sein de chaque groupe de
    # points égaux, par confrontation directe (mini-classement entre les
    # équipes à égalité), et seulement en dernier recours par différence
    # de buts générale / buts marqués.
    all_team_ids = sorted(stats.keys(), key=lambda tid: -stats[tid]['points'])

    ranked_team_ids = []
    for _points, group_iter in groupby(all_team_ids, key=lambda tid: stats[tid]['points']):
        group_ids = list(group_iter)
        if len(group_ids) > 1:
            h2h = head_to_head_stats(set(group_ids))
            group_ids.sort(key=lambda tid: (
                -h2h[tid]['points'],
                -h2h[tid]['goal_diff'],
                -h2h[tid]['goals_for'],
                -stats[tid]['goal_diff'],
                -stats[tid]['goals_for'],
            ))
        ranked_team_ids.extend(group_ids)

    # Update or create the ranking lines
    teams = {t.id: t for t in Team.objects.filter(id__in=team_ids)}
    for rank, team_id in enumerate(ranked_team_ids, start=1):
        s = stats[team_id]
        Standing.objects.update_or_create(
            team=teams[team_id],
            category=category,
            season=season,
            group_name=group_name,
            defaults={
                'played': s['played'],
                'won': s['won'],
                'draw': s['draw'],
                'lost': s['lost'],
                'goals_for': s['goals_for'],
                'goals_against': s['goals_against'],
                'goal_diff': s['goal_diff'],
                'points': s['points'],
                'rank': rank,
            }
        )
