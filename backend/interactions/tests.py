from rest_framework.test import APITestCase

from config.test_helpers import client_for, make_user
from posts.models import Post

from .models import Block, Comment, CommentReport, Follow, Like, Report


class LikeTests(APITestCase):
    def setUp(self):
        self.user = make_user('sophie')
        self.api = client_for(self.user)
        self.post = Post.objects.create(author=make_user('lucas'), caption='x')

    def test_like_then_unlike(self):
        first = self.api.post(f'/api/posts/{self.post.id}/like/')
        self.assertEqual(first.data, {'liked': True, 'likes_count': 1})
        second = self.api.post(f'/api/posts/{self.post.id}/like/')
        self.assertEqual(second.data, {'liked': False, 'likes_count': 0})
        self.assertEqual(Like.objects.count(), 0)

    def test_like_unknown_post_returns_404(self):
        self.assertEqual(self.api.post('/api/posts/99999/like/').status_code, 404)

    def test_like_requires_login(self):
        self.assertEqual(self.client.post(f'/api/posts/{self.post.id}/like/').status_code, 401)


class CommentTests(APITestCase):
    def setUp(self):
        self.author = make_user('sophie')
        self.other = make_user('lucas')
        self.post = Post.objects.create(author=self.author, caption='x')
        self.url = f'/api/posts/{self.post.id}/comments/'

    def test_create_comment_and_reply(self):
        api = client_for(self.author)
        parent = api.post(self.url, {'content': 'Super match !'}, format='json')
        self.assertEqual(parent.status_code, 201)
        reply = client_for(self.other).post(self.url, {'content': 'Bravo !', 'parent_id': parent.data['id']}, format='json')
        self.assertEqual(reply.status_code, 201)
        listing = api.get(self.url)
        self.assertEqual(len(listing.data), 1)  # seules les racines sont listées
        self.assertEqual(listing.data[0]['replies'][0]['content'], 'Bravo !')

    def test_empty_comment_is_rejected(self):
        response = client_for(self.author).post(self.url, {'content': ''}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_cannot_edit_someone_elses_comment(self):
        comment = Comment.objects.create(post=self.post, author=self.author, content='original')
        response = client_for(self.other).patch(f'{self.url}{comment.id}/', {'content': 'piraté'}, format='json')
        self.assertEqual(response.status_code, 403)
        comment.refresh_from_db()
        self.assertEqual(comment.content, 'original')

    def test_author_edit_marks_comment_as_edited(self):
        comment = Comment.objects.create(post=self.post, author=self.author, content='original')
        response = client_for(self.author).patch(f'{self.url}{comment.id}/', {'content': 'corrigé'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_edited'])

    def test_delete_rules(self):
        comment = Comment.objects.create(post=self.post, author=self.author, content='x')
        self.assertEqual(client_for(self.other).delete(f'{self.url}{comment.id}/').status_code, 403)
        self.assertEqual(client_for(self.author).delete(f'{self.url}{comment.id}/').status_code, 204)
        other_comment = Comment.objects.create(post=self.post, author=self.other, content='y')
        admin = client_for(make_user('admin', role='admin'))
        self.assertEqual(admin.delete(f'{self.url}{other_comment.id}/').status_code, 204)

    def test_comment_like_toggle(self):
        comment = Comment.objects.create(post=self.post, author=self.author, content='x')
        api = client_for(self.other)
        self.assertEqual(api.post(f'/api/comments/{comment.id}/like/').data, {'liked': True, 'likes_count': 1})
        self.assertEqual(api.post(f'/api/comments/{comment.id}/like/').data, {'liked': False, 'likes_count': 0})


class FollowAndBlockTests(APITestCase):
    def setUp(self):
        self.me, self.other = make_user('sophie'), make_user('lucas')
        self.api = client_for(self.me)

    def test_follow_toggle_and_counters(self):
        self.assertEqual(self.api.post(f'/api/users/{self.other.id}/follow/').data, {'following': True})
        profile = self.api.get(f'/api/users/{self.other.id}/')
        self.assertEqual(profile.data['followers_count'], 1)
        self.assertTrue(profile.data['is_following'])
        followers = self.api.get(f'/api/users/{self.other.id}/followers/')
        self.assertEqual([u['username'] for u in followers.data], ['sophie'])
        self.assertEqual(self.api.post(f'/api/users/{self.other.id}/follow/').data, {'following': False})

    def test_cannot_follow_or_block_yourself(self):
        self.assertEqual(self.api.post(f'/api/users/{self.me.id}/follow/').status_code, 400)
        self.assertEqual(self.api.post(f'/api/users/{self.me.id}/block/').status_code, 400)

    def test_block_removes_follows_both_ways(self):
        Follow.objects.create(follower=self.me, following=self.other)
        Follow.objects.create(follower=self.other, following=self.me)
        self.assertEqual(self.api.post(f'/api/users/{self.other.id}/block/').data, {'blocked': True})
        self.assertEqual(Follow.objects.count(), 0)
        self.assertEqual(self.api.post(f'/api/users/{self.other.id}/block/').data, {'blocked': False})
        self.assertEqual(Block.objects.count(), 0)


class ReportTests(APITestCase):
    def setUp(self):
        self.reporter = make_user('sophie')
        self.post = Post.objects.create(author=make_user('troll'), caption='insulte')
        self.comment = Comment.objects.create(post=self.post, author=self.post.author, content='insulte')
        self.admin = client_for(make_user('admin', role='admin'))

    def test_report_post_once(self):
        api = client_for(self.reporter)
        for _ in range(2):
            self.assertEqual(api.post(f'/api/posts/{self.post.id}/report/', {'reason': 'harassment'}, format='json').status_code, 200)
        self.assertEqual(Report.objects.count(), 1)
        self.assertEqual(Report.objects.get().reason, 'harassment')

    def test_reports_list_is_admin_only(self):
        client_for(self.reporter).post(f'/api/comments/{self.comment.id}/report/', {'reason': 'spam'}, format='json')
        self.assertEqual(client_for(self.reporter).get('/api/reports/').status_code, 403)
        response = self.admin.get('/api/reports/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['comment_reports'][0]['comment_author'], 'troll')

    def test_admin_dismisses_report(self):
        report = Report.objects.create(reporter=self.reporter, post=self.post, reason='spam')
        self.admin.delete(f'/api/reports/?type=post&id={report.id}')
        self.assertFalse(Report.objects.exists())
        self.assertTrue(Post.objects.filter(id=self.post.id).exists())  # le post reste

    def test_deleting_post_removes_its_reports(self):
        Report.objects.create(reporter=self.reporter, post=self.post, reason='spam')
        CommentReport.objects.create(reporter=self.reporter, comment=self.comment, reason='spam')
        self.post.delete()
        self.assertEqual(Report.objects.count() + CommentReport.objects.count(), 0)
