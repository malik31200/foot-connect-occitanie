import logging
from clubs.models import Club
from teams.models import Team
from matches.models import Match
from . import client, parser

logger = logging.getLogger(__name__)


def sync_matches():
    stats = {
        "clubs_synced": 0,
        "teams_synced": 0,
        "matches_synced": 0,
        "results_synced": 0,
        "errors_count": 0,
        "error_details": [],
    }

    competitions = client.get_competitions()

    for comp in competitions:
        cp_no = comp["cp_no"]
        phases = comp.get("phases", [])

        for phase in phases:
            phase_number = phase["number"]
            poules = phase.get("poules", [])

            for poule in poules:
                poule_number = poule["stage_number"]

                try:
                    raw_matches = client.get_matches(cp_no, phase_number, poule_number)

                except Exception as e:
                    stats["errors_count"] += 1
                    stats["error_details"].append(str(e))
                    continue

                for raw in raw_matches:
                    try:
                        data = parser.parse_match(raw)
                        _sync_single_match(data, stats)
                    except Exception as e:
                        stats["errors_count"] += 1
                        stats["error_details"].append(str(e))

    return stats

def _sync_single_match(data, stats):
    home_club, created = Club.objects.get_or_create(
        fff_id=data["home_club"]["fff_id"],
        defaults={
            "name": data["home_club"]["name"],
            "logo_url": data["home_club"]["logo_url"],
        },
    )
    if created:
        stats["clubs_synced"] += 1

    away_club, created = Club.objects.get_or_create(
        fff_id=data["away_club"]["fff_id"],
        defaults={
            "name": data["away_club"]["name"],
            "logo_url": data["away_club"]["logo_url"],
        },
    )
    if created:
        stats["clubs_synced"] += 1

    home_team, created = Team.objects.get_or_create(
        fff_id=data["home_team"]["fff_id"],
        defaults={
            "club": home_club,
            "name": data["home_team"]["name"],
            "category": data["home_team"]["category"],
            "group_name": data["home_team"]["group_name"],
            "season": data["home_team"]["season"],
        },
    )
    if created:
        stats["teams_synced"] += 1

    away_team, created = Team.objects.get_or_create(
        fff_id=data["away_team"]["fff_id"],
        defaults={
            "club": away_club,
            "name": data["away_team"]["name"],
            "category": data["away_team"]["category"],
            "group_name": data["away_team"]["group_name"],
            "season": data["away_team"]["season"],
        },
    )
    if created:
        stats["teams_synced"] += 1

    existing = Match.objects.filter(fff_id=data["fff_id"]).first()

    if existing is None:
        Match.objects.create(
            fff_id=data["fff_id"],
            home_team=home_team,
            away_team=away_team,
            category=data["category"],
            season=data["season"],
            group_name=data["group_name"],
            matchday=data["matchday"],
            date_time=data["date_time"],
            venue=data["venue"],
            status=data["status"],
            home_score=data["home_score"],
            away_score=data["away_score"],
            source="fff",
        )
        stats["matches_synced"] += 1
        if data["home_score"] is not None:
            stats["results_synced"] +=1

    elif not existing.is_locked:
        existing.status = data["status"]
        existing.date_time = data["date_time"]
        existing.venue = data["venue"]
        existing.home_score = data["home_score"]
        existing.away_score = data["away_score"]
        existing.save()
        stats["matches_synced"] += 1
        if data["home_score"] is not None:
            stats["results_synced"] += 1

    else:
        logger.warning("Match %s is locked - skipping FFF update", data["fff_id"])


    
