from rest_framework.test import APITestCase

from config.test_helpers import client_for, make_user

from .models import Conversation, Message


class MessagingTests(APITestCase):
    def setUp(self):
        self.sophie, self.lucas, self.intrus = make_user('sophie'), make_user('lucas'), make_user('intrus')
        self.api = client_for(self.sophie)

    def open_conversation(self):
        return self.api.post('/api/conversations/', {'target_user_id': self.lucas.id}, format='json')

    def test_conversation_is_created_once_whoever_starts_it(self):
        first = self.open_conversation()
        self.assertEqual(first.status_code, 201)
        again = client_for(self.lucas).post('/api/conversations/', {'target_user_id': self.sophie.id}, format='json')
        self.assertEqual(again.data['id'], first.data['id'])
        self.assertEqual(Conversation.objects.count(), 1)

    def test_cannot_message_yourself(self):
        response = self.api.post('/api/conversations/', {'target_user_id': self.sophie.id}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_send_and_read_messages(self):
        conv = self.open_conversation().data['id']
        sent = self.api.post(f'/api/conversations/{conv}/messages/', {'content': 'Prêt pour le match ?'}, format='json')
        self.assertEqual(sent.status_code, 201)
        lucas = client_for(self.lucas)
        self.assertEqual(lucas.get('/api/conversations/').data[0]['unread_count'], 1)
        messages = lucas.get(f'/api/conversations/{conv}/messages/')
        self.assertEqual(messages.data[0]['content'], 'Prêt pour le match ?')
        self.assertEqual(lucas.patch(f'/api/conversations/{conv}/read/').data, {'marked_read': 1})
        self.assertTrue(Message.objects.get().is_read)

    def test_sender_own_messages_are_not_marked_read(self):
        conv = self.open_conversation().data['id']
        self.api.post(f'/api/conversations/{conv}/messages/', {'content': 'Salut'}, format='json')
        self.assertEqual(self.api.patch(f'/api/conversations/{conv}/read/').data, {'marked_read': 0})

    def test_outsider_cannot_read_or_write(self):
        conv = self.open_conversation().data['id']
        intrus = client_for(self.intrus)
        self.assertEqual(intrus.get(f'/api/conversations/{conv}/messages/').status_code, 403)
        self.assertEqual(intrus.post(f'/api/conversations/{conv}/messages/', {'content': 'x'}, format='json').status_code, 403)
        self.assertEqual(intrus.get('/api/conversations/').data, [])

    def test_empty_message_is_rejected(self):
        conv = self.open_conversation().data['id']
        response = self.api.post(f'/api/conversations/{conv}/messages/', {'content': ''}, format='json')
        self.assertEqual(response.status_code, 400)
