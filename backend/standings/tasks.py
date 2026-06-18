from celery import shared_task
from matches.models import Match
from teams.models import Team
from .models import Standing


@shared_task
def recalcul_standing(category, season, group_name):
    # Retrieve all matches finished of this group_name
    matches = Match.objects.filter(
        category=category,
        season=season,
        group_name=group_name,
        status='finished',
        home_score__isnull=False,
    )

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

    # Calculate points and differences, sort by rank
    rows = []
    for team_id, s in stats.items():
        s['points'] = s['won'] * 3 + s['draw']
        s['goal_diff'] = s['goals_for'] - s['goals_against']
        rows.append((team_id, s))

    rows.sort(key=lambda x: (-x[1]['points'], -x[1]['goal_diff'],
                             -x[1]['goals_for']))
    
    # Update or create the ranking lines
    teams = {t.id: t for t in Team.objects.filter(id__in=team_ids)}
    for rank, (team_id, s) in enumerate(rows, start=1):
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