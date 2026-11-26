from rest_framework.test import APITestCase

from config.test_helpers import client_for, make_match, make_team, make_user
from interactions.models import Block

from .models import Post, PostMedia

PHOTO = {'media_type': 'photo', 'media_url': 'https://pub-test.r2.dev/uploads/photo.jpg'}


class PublishTests(APITestCase):
    """Publication d'un post photo ou vidéo lié à un match."""

    def setUp(self):
        self.user = make_user('sophie')
        self.api = client_for(self.user)
        self.match = make_match(make_team('Toulouse FC'), make_team('Blagnac FC'))

    def test_publish_requires_login(self):
        response = self.client.post('/api/posts/', {'match_id': self.match.id, 'medias': [PHOTO]}, format='json')
        self.assertEqual(response.status_code, 401)

    def test_publish_post_linked_to_match(self):
        data = {'match_id': self.match.id, 'caption': 'Belle victoire !', 'medias': [PHOTO, {**PHOTO, 'media_url': 'https://pub-test.r2.dev/uploads/2.jpg'}]}
        response = self.api.post('/api/posts/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['match_info']['home_team'], 'Toulouse FC')
        self.assertEqual(response.data['author_username'], 'sophie')
        self.assertEqual([m['order'] for m in response.data['medias']], [0, 1])
        self.assertEqual(PostMedia.objects.count(), 2)

    def test_publish_without_media_is_rejected(self):
        response = self.api.post('/api/posts/', {'match_id': self.match.id, 'caption': 'x'}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Post.objects.count(), 0)

    def test_posts_of_a_profile(self):
        Post.objects.create(author=self.user, caption='a')
        Post.objects.create(author=make_user('lucas'), caption='b')
        response = self.client.get('/api/posts/', {'author': self.user.id})
        self.assertEqual([p['caption'] for p in response.data], ['a'])


class DeletePostTests(APITestCase):
    """Seul l'auteur ou un administrateur peut supprimer un post."""

    def setUp(self):
        self.author = make_user('sophie')
        self.post = Post.objects.create(author=self.author, caption='photo du match')

    def test_other_user_cannot_delete(self):
        response = client_for(make_user('lucas')).delete(f'/api/posts/{self.post.id}/')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Post.objects.filter(id=self.post.id).exists())

    def test_author_can_delete(self):
        self.assertEqual(client_for(self.author).delete(f'/api/posts/{self.post.id}/').status_code, 204)
        self.assertFalse(Post.objects.exists())

    def test_admin_can_delete(self):
        response = client_for(make_user('admin', role='admin')).delete(f'/api/posts/{self.post.id}/')
        self.assertEqual(response.status_code, 204)

    def test_editing_a_post_is_not_allowed(self):
        response = client_for(self.author).patch(f'/api/posts/{self.post.id}/', {'caption': 'x'}, format='json')
        self.assertEqual(response.status_code, 405)


class FeedAndSearchTests(APITestCase):
    """Fil d'actualité et recherche, sans les utilisateurs bloqués."""

    def setUp(self):
        self.me = make_user('sophie')
        self.friend = make_user('lucas')
        self.blocked = make_user('troll')
        match = make_match(make_team('Toulouse FC'), make_team('Blagnac FC'))
        Post.objects.create(author=self.friend, match=match, caption='ancien')
        Post.objects.create(author=self.friend, caption='récent')
        Post.objects.create(author=self.blocked, caption='indésirable')
        Block.objects.create(blocker=self.me, blocked=self.blocked)

    def test_feed_requires_login(self):
        self.assertEqual(self.client.get('/api/feed/').status_code, 401)

    def test_feed_newest_first_without_blocked_users(self):
        response = client_for(self.me).get('/api/feed/')
        self.assertEqual([p['caption'] for p in response.data], ['récent', 'ancien'])

    def test_blocked_user_does_not_see_my_posts_either(self):
        Post.objects.create(author=self.me, caption='mon post')
        captions = [p['caption'] for p in client_for(self.blocked).get('/api/feed/').data]
        self.assertNotIn('mon post', captions)

    def test_search_by_team_and_username(self):
        api = client_for(self.me)
        by_team = api.get('/api/search/', {'q': 'toulouse'})
        self.assertEqual([p['caption'] for p in by_team.data['posts']], ['ancien'])
        by_user = api.get('/api/search/', {'q': 'luc'})
        self.assertEqual([u['username'] for u in by_user.data['users']], ['lucas'])
        hidden = api.get('/api/search/', {'q': 'troll'})
        self.assertEqual(hidden.data['users'], [])

    def test_search_needs_two_characters(self):
        response = client_for(self.me).get('/api/search/', {'q': 'a'})
        self.assertEqual(response.data, {'users': [], 'posts': []})


class MediaPresignTests(APITestCase):
    """URL d'envoi signée vers Cloudflare R2."""

    def test_presign_requires_login(self):
        self.assertEqual(self.client.post('/api/media/presign/', {'file_name': 'a.jpg'}, format='json').status_code, 401)

    def test_presign_returns_signed_upload_url_and_public_url(self):
        response = client_for(make_user('sophie')).post('/api/media/presign/', {'file_name': 'photo.jpg', 'content_type': 'image/jpeg'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('X-Amz-Signature=', response.data['upload_url'])
        self.assertIn('X-Amz-Expires=3600', response.data['upload_url'])
        self.assertTrue(response.data['public_url'].endswith('.jpg'))
        self.assertNotIn('photo', response.data['public_url'])  # nom de fichier aléatoire
