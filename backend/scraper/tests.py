from unittest.mock import patch
from django.test import TestCase
from matches.models import Match
from scraper.models import SyncLog
from scraper import service


FAKE_COMP = [{
    "cp_no": 434763,
    "phases": [{
        "number": 1,
        "groups": [{"stage_number": 1}],
    }],
}]

RAW_MATCH = {
    "ma_no": 99999,
    "competition": {"cp_no": 434763, "season": 2025, "name": "Test Compet"},
    "phase": {"number": 1},
    "poule": {"name": "POULE A", "stage_number": 1},
    "poule_journee": {"number": 5},
    "home": {
        "club": {"cl_no": 9001, "logo": "https://example.com/a.jpg"},
        "short_name": "CLUB HOME",
        "number": 1,
    },
    "away": {
        "club": {"cl_no": 9002, "logo": "https://example.com/b.jpg"},
        "short_name": "CLUB AWAY",
        "number": 1,
    },
    "terrain": {"name": "STADE TEST", "city": "MONTPELLIER"},
    "status": "A",
    "date": "2025-10-05T00:00:00+00:00",
    "time": "15H00",
    "home_score": 2,
    "away_score": 1,
}

class ScraperServiceTest(TestCase):

    @patch('scraper.service.client.get_matches', return_value=[RAW_MATCH])
    @patch('scraper.service.client.get_competitions', return_value=FAKE_COMP)
    def test_insert_new_match(self, mock_comps, mock_matches):
        stats = service.sync_matches()
        self.assertEqual(Match.objects.count(), 1)
        self.assertEqual(stats["matches_synced"], 1)
        match = Match.objects.first()
        self.assertEqual(match.fff_id, "99999")
        self.assertEqual(match.home_score, 2)
        self.assertEqual(match.source, "fff")

    @patch('scraper.service.client.get_matches', return_value=[RAW_MATCH])
    @patch('scraper.service.client.get_competitions', return_value=FAKE_COMP)
    def test_update_unlocked_match(self, mock_comps, mock_matches):
        service.sync_matches()
        match = Match.objects.get(fff_id="99999")
        match.home_score = 0
        match.is_locked = False
        match.save()

        updated_raw = {**RAW_MATCH, "home_score": 3}
        with patch('scraper.service.client.get_matches', return_value=[updated_raw]):
            service.sync_matches()

        match.refresh_from_db()
        self.assertEqual(match.home_score, 3)

    @patch('scraper.service.client.get_matches', return_value=[RAW_MATCH])
    @patch('scraper.service.client.get_competitions', return_value=FAKE_COMP)
    def test_skip_locked_match(self, mock_comps, mock_matches):
        service.sync_matches()
        match = Match.objects.get(fff_id="99999")
        match.home_score = 99
        match.is_locked = True
        match.save()

        updated_raw = {**RAW_MATCH, "home_score": 3}
        with patch('scraper.service.client.get_matches', return_value=[updated_raw]):
            service.sync_matches()

        match.refresh_from_db()
        self.assertEqual(match.home_score, 99)

    @patch('scraper.service.client.get_matches', return_value=[RAW_MATCH])
    @patch('scraper.service.client.get_competitions', return_value=FAKE_COMP)
    def test_service_does_not_create_synclog(self, mock_comps, mock_matches):
        service.sync_matches()
        self.assertEqual(SyncLog.objects.count(), 0)
