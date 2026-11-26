from rest_framework.test import APITestCase

from config.test_helpers import client_for, make_match, make_team, make_user


class TeamTests(APITestCase):
    def setUp(self):
        self.user = client_for(make_user('sophie'))
        self.admin = client_for(make_user('admin', role='admin'))
        self.tfc = make_team('Toulouse FC')
        make_team('Ales OL', group='Poule A')

    def test_filter_teams_by_group(self):
        response = self.user.get('/api/teams/', {'category': 'U18', 'group_name': 'Poule B'})
        self.assertEqual([t['name'] for t in response.data], ['Toulouse FC'])

    def test_categories_and_groups(self):
        self.assertEqual(self.user.get('/api/teams/categories/').data, {'categories': ['U18']})
        self.assertEqual(self.user.get('/api/teams/groups/', {'category': 'U18'}).data, {'groups': ['Poule A', 'Poule B']})

    def test_create_team_is_admin_only(self):
        data = {'club_id': self.tfc.club_id, 'name': 'Toulouse FC 2', 'category': 'U18', 'group_name': 'Poule C', 'season': '2026/2027'}
        self.assertEqual(self.user.post('/api/teams/', data, format='json').status_code, 403)
        self.assertEqual(self.admin.post('/api/teams/', data, format='json').status_code, 201)

    def test_set_home_venue_fills_only_empty_venues(self):
        other = make_team('Blagnac FC')
        empty = make_match(self.tfc, other)
        kept = make_match(self.tfc, other, matchday=2, venue='Stade annexe')
        response = self.admin.post(f'/api/teams/{self.tfc.id}/set_home_venue/', {'venue': 'Stadium'}, format='json')
        self.assertEqual(response.data['filled'], 1)
        empty.refresh_from_db(); kept.refresh_from_db()
        self.assertEqual((empty.venue, kept.venue), ('Stadium', 'Stade annexe'))
