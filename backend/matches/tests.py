from datetime import datetime
from unittest import mock

from rest_framework.test import APITestCase

from config.test_helpers import PARIS, client_for, make_match, make_team, make_user
from standings.models import Standing
from standings.tasks import recalcul_standing

from .models import Match


def run_task_now(*args):
    """Remplace l'envoi à Celery : la tâche s'exécute tout de suite."""
    return recalcul_standing(*args)


class MatchReadTests(APITestCase):
    """Consultation publique des matchs et filtres."""

    def setUp(self):
        self.tfc, self.blagnac = make_team('Toulouse FC'), make_team('Blagnac FC')
        self.castanet = make_team('Castanet US', group='Poule A')
        self.balma = make_team('Balma SC', group='Poule A')
        make_match(self.tfc, self.blagnac)
        make_match(self.blagnac, self.tfc, 1, 1, matchday=2)
        make_match(self.castanet, self.balma)

    def test_matches_are_public(self):
        self.assertEqual(self.client.get('/api/matches/').status_code, 200)

    def test_filters_by_group_and_status(self):
        response = self.client.get('/api/matches/', {'category': 'U18', 'season': '2026/2027', 'group_name': 'Poule B', 'status': 'scheduled'})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['home_team']['name'], 'Toulouse FC')

    def test_dates_are_returned_in_utc(self):
        response = self.client.get('/api/matches/', {'group_name': 'Poule B', 'status': 'scheduled'})
        # 11h00 à Paris le 24/10/2026 (heure d'été) = 09h00 UTC
        self.assertEqual(response.data[0]['date_time'], '2026-10-24T09:00:00Z')

    def test_categories_and_groups_lists(self):
        cats = self.client.get('/api/matches/filters/', {'season': '2026/2027'})
        self.assertEqual(cats.data['categories'], ['U18'])
        groups = self.client.get('/api/matches/groups/', {'season': '2026/2027', 'category': 'U18'})
        self.assertEqual(groups.data['groups'], ['Poule A', 'Poule B'])


class MatchAdminTests(APITestCase):
    """Création, modification et saisie des scores : réservées à l'administrateur."""

    def setUp(self):
        self.admin = client_for(make_user('admin', role='admin'))
        self.user = client_for(make_user('sophie'))
        self.tfc, self.blagnac = make_team('Toulouse FC'), make_team('Blagnac FC')
        self.match = make_match(self.tfc, self.blagnac)

    def new_match_payload(self):
        return {'home_team_id': self.blagnac.id, 'away_team_id': self.tfc.id, 'category': 'U18',
                'season': '2026/2027', 'group_name': 'Poule B', 'matchday': 10,
                'date_time': '2027-01-16T14:00:00Z', 'venue': 'Stade de Blagnac'}

    def test_only_admin_can_create_match(self):
        self.assertEqual(self.client.post('/api/matches/', self.new_match_payload(), format='json').status_code, 401)
        self.assertEqual(self.user.post('/api/matches/', self.new_match_payload(), format='json').status_code, 403)
        response = self.admin.post('/api/matches/', self.new_match_payload(), format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Match.objects.count(), 2)

    def test_admin_can_edit_date_and_user_cannot(self):
        data = {'date_time': '2026-10-24T09:00:00Z', 'venue': 'Stadium TFC'}
        self.assertEqual(self.user.patch(f'/api/matches/{self.match.id}/', data, format='json').status_code, 403)
        self.assertEqual(self.admin.patch(f'/api/matches/{self.match.id}/', data, format='json').status_code, 200)
        self.match.refresh_from_db()
        self.assertEqual(self.match.venue, 'Stadium TFC')

    def test_only_admin_can_delete_match(self):
        self.assertEqual(self.user.delete(f'/api/matches/{self.match.id}/').status_code, 403)
        self.assertEqual(self.admin.delete(f'/api/matches/{self.match.id}/').status_code, 204)

    @mock.patch('matches.views.recalcul_standing.delay', side_effect=run_task_now)
    def test_result_locks_match_and_updates_standings(self, delay):
        response = self.admin.patch(f'/api/matches/{self.match.id}/result/',
                                    {'home_score': 2, 'away_score': 1, 'status': 'finished'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.match.refresh_from_db()
        self.assertEqual((self.match.home_score, self.match.away_score), (2, 1))
        self.assertEqual(self.match.status, 'finished')
        self.assertTrue(self.match.is_locked)
        delay.assert_called_once_with('U18', '2026/2027', 'Poule B')
        winner = Standing.objects.get(team=self.tfc)
        self.assertEqual((winner.points, winner.rank), (3, 1))

    def test_result_forbidden_for_user(self):
        response = self.user.patch(f'/api/matches/{self.match.id}/result/', {'home_score': 5, 'away_score': 0}, format='json')
        self.assertEqual(response.status_code, 403)
        self.match.refresh_from_db()
        self.assertIsNone(self.match.home_score)

    def test_result_on_unknown_match_returns_404(self):
        response = self.admin.patch('/api/matches/99999/result/', {'home_score': 1, 'away_score': 0}, format='json')
        self.assertEqual(response.status_code, 404)

    def test_unlock(self):
        Match.objects.filter(id=self.match.id).update(is_locked=True)
        self.assertEqual(self.user.patch(f'/api/matches/{self.match.id}/unlock/').status_code, 403)
        response = self.admin.patch(f'/api/matches/{self.match.id}/unlock/')
        self.assertEqual(response.data, {'id': self.match.id, 'is_locked': False})
