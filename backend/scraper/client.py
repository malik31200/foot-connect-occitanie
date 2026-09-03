import requests
from django.conf import settings

FFF_BASE_URL = settings.FFF_API_BASE_URL
REGION_CODE = settings.FFF_REGION_CODE


def _make_session():
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/140.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Referer": "https://www.fff.fr/",
    })
    return session


def get_competitions():
    # Returns all championship competitions for Occitanie (cg_no=77)
    session = _make_session()
    url = f"{FFF_BASE_URL}/api/compets"
    params = {
        "cg_no": REGION_CODE,
        "competition_type": "CH",
        "groups[]": "compet_light",
    }
    response = session.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()
    # compet_light returns JSON-LD array format instead of {"hydra:member": [...]}
    if isinstance(data, list):
        for item in data:
            if isinstance(item, list):
                return item
        return []
    return data.get("hydra:member", [])


def get_matches(cp_no, phase_number, poule_number):
    # Fetches all pages of matches for a given competition / phase / group
    session = _make_session()
    url = f"{FFF_BASE_URL}/api/compets/{cp_no}/phases/{phase_number}/poules/{poule_number}/matchs"
    all_matches = []

    while url:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        all_matches.extend(data.get("hydra:member", []))
        next_page = data.get("hydra:view", {}).get("hydra:next")
        url = f"{FFF_BASE_URL}{next_page}" if next_page else None
    return all_matches
