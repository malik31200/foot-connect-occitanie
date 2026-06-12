from datetime import datetime, timezone


def parse_status(fff_status):
    if fff_status == "A":
        return "finished"
    if fff_status in ("P", "postponed"):
        return "postponed"
    return "scheduled"


def parse_datetime(date_str, time_str):
    # Combines FFF date "2025-09-06T00:00:00+00:00" and time "18H00" into a datetime
    date_part = date_str[:10]
    time_part = time_str.replace("H", ":").zfill(5)
    dt = datetime.strptime(f"{date_part} {time_part}", "%Y-%m-%d %H:%M")
    return dt.replace(tzinfo=timezone.utc)


def parse_match(raw):
    #Extracts all relevant fields from a raw FFF match dict
    home = raw["home"]
    away = raw["away"]
    competition = raw["competition"]
    terrain = raw.get("terrain") or {}

    home_club_fff_id = str(home["club"]["cl_no"])
    away_club_fff_id = str(away["club"]["cl_no"])
    cp_no = competition["cp_no"]

    home_team_fff_id = f"{home_club_fff_id}_{home['number']}_{cp_no}"
    away_team_fff_id = f"{away_club_fff_id}_{away['number']}_{cp_no}"

    venue = None
    if terrain.get("name"):
        venue = f"{terrain['name']}, {terrain.get('city', '')}"

    return {
        "fff_id": str(raw["ma_no"]),
        "category": competition["name"],
        "season": str(competition["season"]),
        "group_name": raw["poule"]["name"],
        "matchday": raw["poule_journee"]["number"],
        "date_time": parse_datetime(raw["date"], raw["time"]),
        "venue": venue,
        "status": "finished" if (raw.get("home_score") is not None) else parse_status(raw.get("status", "")),
        "home_score": raw.get("home_score"),
        "away_score": raw.get("away_score"),
        "home_club": {
            "fff_id": home_club_fff_id,
            "name": home["short_name"],
            "logo_url": home["club"].get("logo"),
        },
        "away_club": {
            "fff_id": away_club_fff_id,
            "name": away["short_name"],
            "logo_url": away["club"].get("logo"),
        },
        "home_team": {
            "fff_id": home_team_fff_id,
            "name": home["short_name"],
            "category": competition["name"],
            "group_name": raw["poule"]["name"],
            "season": str(competition["season"]),
        },
        "away_team": {
            "fff_id": away_team_fff_id,
            "name": away["short_name"],
            "category": competition["name"],
            "group_name": raw["poule"]["name"],
            "season": str(competition["season"]),
        }
    }