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
        response = self.client.post('/api/auth/register/', data, format='json')
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
        response = self.client.post('/api/auth/login/', data, format='json')
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
        response = self.client.post('/api/auth/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_authentifie(self):
        user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='Test1234!'
        )

        self.client.force_authenticate(user=user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'],'test@test.com' )

    def test_me_no_authenticated(self):
        response = self.client.get('/api/auth/me/')
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


class AccountTests(APITestCase):
    """Compte utilisateur : inscription, connexion, profil, mot de passe, suppression."""

    def setUp(self):
        from config.test_helpers import make_user, client_for
        self.make_user, self.client_for = make_user, client_for
        self.user = make_user('sophie')

    def test_register_rejects_duplicate_email_and_weak_password(self):
        data = {'username': 'autre', 'email': 'sophie@example.com', 'password': '1234'}
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data)
        self.assertIn('password', response.data)

    def test_password_is_hashed_in_database(self):
        self.assertNotEqual(self.user.password, 'Football2026!')
        self.assertTrue(self.user.check_password('Football2026!'))

    def test_refresh_token_returns_new_access_token(self):
        login = self.client.post('/api/auth/login/', {'email': 'sophie@example.com', 'password': 'Football2026!'}, format='json')
        response = self.client.post('/api/auth/refresh/', {'refresh': login.data['refresh']}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_invalid_token_is_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer jeton-invalide')
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_update_profile(self):
        client = self.client_for(self.user)
        response = client.patch('/api/auth/me/', {'sport_role': 'coach', 'club_name': 'Blagnac FC'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['sport_role'], 'coach')

    def test_user_cannot_promote_himself_admin(self):
        client = self.client_for(self.user)
        client.patch('/api/auth/me/', {'role': 'admin'}, format='json')
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'user')

    def test_delete_account_removes_all_personal_data(self):
        from posts.models import Post
        from interactions.models import Comment
        post = Post.objects.create(author=self.user, caption='souvenir')
        Comment.objects.create(post=post, author=self.user, content='bravo')
        response = self.client_for(self.user).delete('/api/auth/me/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(email='sophie@example.com').exists())
        self.assertEqual(Post.objects.count(), 0)
        self.assertEqual(Comment.objects.count(), 0)

    def test_forgot_password_same_answer_whether_email_exists_or_not(self):
        from unittest import mock
        from .models import PasswordResetToken
        with mock.patch('users.views.send_reset_email', return_value=True) as send:
            known = self.client.post('/api/auth/forgot-password/', {'email': 'sophie@example.com'}, format='json')
            unknown = self.client.post('/api/auth/forgot-password/', {'email': 'inconnu@example.com'}, format='json')
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(send.call_count, 1)
        self.assertEqual(PasswordResetToken.objects.filter(user=self.user).count(), 1)

    def test_reset_password_with_valid_code(self):
        from .models import PasswordResetToken
        PasswordResetToken.objects.create(user=self.user, code='482913')
        data = {'email': 'sophie@example.com', 'code': '482913', 'new_password': 'NouveauMdp2026!'}
        response = self.client.post('/api/auth/reset-password/', data, format='json')
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NouveauMdp2026!'))
        self.assertFalse(PasswordResetToken.objects.exists())  # code à usage unique

    def test_reset_password_rejects_wrong_or_expired_code(self):
        from datetime import timedelta
        from django.utils import timezone
        from .models import PasswordResetToken
        token = PasswordResetToken.objects.create(user=self.user, code='482913')
        wrong = self.client.post('/api/auth/reset-password/', {'email': 'sophie@example.com', 'code': '000000', 'new_password': 'NouveauMdp2026!'}, format='json')
        self.assertEqual(wrong.status_code, 400)
        PasswordResetToken.objects.filter(id=token.id).update(created_at=timezone.now() - timedelta(minutes=16))
        expired = self.client.post('/api/auth/reset-password/', {'email': 'sophie@example.com', 'code': '482913', 'new_password': 'NouveauMdp2026!'}, format='json')
        self.assertEqual(expired.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Football2026!'))

    def test_public_profile_does_not_expose_email(self):
        other = self.make_user('lucas')
        response = self.client_for(self.user).get(f'/api/users/{other.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('email', response.data)
        self.assertEqual(response.data['username'], 'lucas')


class AdminUserTests(APITestCase):
    """Gestion des utilisateurs par l'administrateur."""

    def setUp(self):
        from config.test_helpers import make_user, client_for
        self.client_for = client_for
        self.admin = make_user('admin', role='admin')
        self.user = make_user('sophie')

    def test_user_list_is_admin_only(self):
        self.assertEqual(self.client_for(self.user).get('/api/auth/admin/users/').status_code, 403)
        response = self.client_for(self.admin).get('/api/auth/admin/users/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_banned_user_cannot_log_in(self):
        response = self.client_for(self.admin).patch(f'/api/auth/admin/users/{self.user.id}/', {'action': 'ban'}, format='json')
        self.assertEqual(response.status_code, 200)
        login = self.client.post('/api/auth/login/', {'email': 'sophie@example.com', 'password': 'Football2026!'}, format='json')
        self.assertEqual(login.status_code, 401)

    def test_admin_cannot_ban_himself(self):
        response = self.client_for(self.admin).patch(f'/api/auth/admin/users/{self.admin.id}/', {'action': 'ban'}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_non_admin_cannot_delete_user(self):
        other = User.objects.create_user(username='lucas', email='lucas@example.com', password='Football2026!')
        response = self.client_for(self.user).delete(f'/api/auth/admin/users/{other.id}/')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(User.objects.filter(id=other.id).exists())
