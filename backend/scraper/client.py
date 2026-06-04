import requests
from django.conf import settings

FFF_BASE_URL = settings.FFF_API_BASE_URL
REGION_CODE = settings.FFF_REGION_CODE


def get_competitions():
    # Returns all championship competitions for Occitanie (cg_no=77)
    url = f"{FFF_BASE_URL}/api/compets"
    params = {
        "cg_no": REGION_CODE,
        "competition_type": "CH",
        "groups[]": "compet_light",
    }
    response = requests.get(url, params=params, timeout=10)
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
    # Returns all matches for a given competition / phase / group
    url = f"{FFF_BASE_URL}/api/compets/{cp_no}/phases/{phase_number}/poules/{poule_number}/matchs"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json().get("hydra:member", [])