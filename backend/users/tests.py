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

