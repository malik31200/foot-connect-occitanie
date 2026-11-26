from rest_framework.test import APITestCase

from config.test_helpers import client_for, make_user

from .models import Club


class ClubTests(APITestCase):
    def setUp(self):
        self.user = client_for(make_user('sophie'))
        self.admin = client_for(make_user('admin', role='admin'))

    def test_clubs_require_login(self):
        self.assertEqual(self.client.get('/api/clubs/').status_code, 401)
        self.assertEqual(self.user.get('/api/clubs/').status_code, 200)

    def test_crud_is_admin_only(self):
        data = {'name': 'Balma SC', 'city': 'Balma'}
        self.assertEqual(self.user.post('/api/clubs/', data, format='json').status_code, 403)
        created = self.admin.post('/api/clubs/', data, format='json')
        self.assertEqual(created.status_code, 201)
        club_id = created.data['id']
        self.assertEqual(self.user.patch(f'/api/clubs/{club_id}/', {'city': 'X'}, format='json').status_code, 403)
        self.assertEqual(self.admin.patch(f'/api/clubs/{club_id}/', {'stadium': 'Stade Municipal'}, format='json').status_code, 200)
        self.assertEqual(self.user.delete(f'/api/clubs/{club_id}/').status_code, 403)
        self.assertEqual(self.admin.delete(f'/api/clubs/{club_id}/').status_code, 204)
        self.assertFalse(Club.objects.exists())
