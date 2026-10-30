from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User

class AuthTests(APITestCase):
    def test_register(self):
        data = {
            'username': 'testuser',
            'email': 'test@test.com',
            'password': 'Test1234!'
        }
        response = self.client.post('/api/auth/register', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'test@test.com')
        self.assertEqual(response.data['role'], 'user')

    def test_login(self):
        User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='Test1234!'
        )

        data = {'email': 'test@test.com', 'password': 'Test1234!'}
        response = self.client.post('/api/auth/login', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_bad_password(self):
        User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='Test1234!'
        )

        data = {'email': 'test@test.com', 'password': 'Bad_password'}
        response = self.client.post('/api/auth/login', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_authentifie(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='Test1234!'
        )

        self.client.force_authenticate(user=user)
        response = self.client.get('/api/auth/me')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'],'test@test.com' )

    def test_me_no_authenticated(self):
        response = self.client.get('/api/auth/me')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)



class StatsTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.user = User.objects.create_user(username='joueur', email='j@test.com', password='Test1234!')
        self.admin = User.objects.create_user(username='admin', email='a@test.com', password='Test1234!', role='admin')

    def auth(self, user):
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_activity_recorded_once_per_day(self):
        from .models import DailyActivity
        self.auth(self.user)
        self.client.get('/api/auth/me/')
        self.client.get('/api/auth/me/')
        self.assertEqual(DailyActivity.objects.filter(user=self.user).count(), 1)

    def test_admin_activity_not_recorded(self):
        from .models import DailyActivity
        self.auth(self.admin)
        self.client.get('/api/auth/me/')
        self.assertEqual(DailyActivity.objects.count(), 0)

    def test_stats_admin_only(self):
        self.auth(self.user)
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_stats_content(self):
        self.auth(self.user)
        self.client.get('/api/auth/me/')  # le joueur utilise l'appli aujourd'hui
        self.auth(self.admin)
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['kpis']['users_total'], 1)  # admin exclu
        self.assertEqual(response.data['kpis']['active_today'], 1)
        self.assertEqual(len(response.data['daily']), 30)
        self.assertEqual(response.data['daily'][-1]['active'], 1)
        self.assertEqual(response.data['daily'][-1]['signups'], 1)
