# Sprint 4 — Réseau social (posts, interactions, feed, messagerie, mobile)

## Ce qu'on a construit

Sprint 4 ajoute la couche sociale complète : publications liées à des matchs, likes, commentaires, follow, feed personnalisé, messagerie privée, et tous les écrans mobiles.

**Backend :** app `posts`, app `interactions`, app `messaging`, endpoint feed, profil utilisateur.
**Mobile :** navigation basse (5 onglets), Login/Inscription, Feed, Publier, Profil, Messages, Conversation.

---

## 1. Backend — App `posts`

### Modèles

```python
class Post(models.Model):
    author      → ForeignKey(User)
    match       → ForeignKey(Match)  # OBLIGATOIRE
    caption     → TextField (optionnel)
    likes_count → IntegerField (dénormalisé)
    created_at  → auto

class PostMedia(models.Model):
    post       → ForeignKey(Post, related_name='medias')
    media_type → 'photo' ou 'video'
    media_url  → URL Cloudinary
    order      → entier (ordre carousel)
```

### Serializer

```python
class PostSerializer(ModelSerializer):
    medias = PostMediaSerializer(many=True, read_only=True)
    author_id = IntegerField(source='author.id', read_only=True)
    author_username = CharField(source='author.username', read_only=True)
    match_info = SerializerMethodField()
    fields = ['id', 'author_id', 'author_username', 'match_info', 'caption', 'likes_count', 'medias', 'created_at']
```

### Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/feed/` | Feed personnalisé (following + tous si 0 following) |
| GET/POST | `/api/posts/` | Liste + création post |
| POST | `/api/posts/{id}/like/` | Toggle like/unlike |
| POST | `/api/posts/{id}/comments/` | Ajouter commentaire |
| PATCH | `/api/comments/{id}/` | Modifier commentaire (auteur ou admin) |
| DELETE | `/api/comments/{id}/` | Supprimer commentaire (auteur ou admin) |

---

## 2. Backend — App `interactions`

### Modèles

```python
class Like(models.Model):
    user, post — unique_together

class Comment(models.Model):
    post, author, content, is_edited, created_at, updated_at

class Follow(models.Model):
    follower, following — unique_together, follower != following
```

### Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/users/{id}/follow/` | Toggle follow/unfollow |

---

## 3. Backend — App `messaging`

### Modèles

```python
class Conversation(models.Model):
    user1, user2 → ForeignKey(User)
    created_at, updated_at
    def other_user(self, user) → renvoie l'autre participant

class Message(models.Model):
    conversation → ForeignKey(Conversation)
    sender → ForeignKey(User)
    content, is_read, created_at
```

### Serializers

```python
class MessageSerializer:
    fields: id, sender_username, content, is_read, created_at

class ConversationSerializer:
    other_username → SerializerMethodField (via other_user())
    last_message   → dernier message de la conversation
    unread_count   → messages non lus de l'autre participant
```

### Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/conversations/` | Liste des conversations |
| POST | `/api/conversations/` | Créer ou récupérer une conversation (target_user_id) |
| GET | `/api/conversations/{id}/messages/` | Messages d'une conversation |
| POST | `/api/conversations/{id}/messages/` | Envoyer un message |
| PATCH | `/api/conversations/{id}/read/` | Marquer les messages comme lus |

**Logique anti-doublon** : à la création, on vérifie l'existence d'une conversation (A→B) ET (B→A) avant d'en créer une nouvelle.

---

## 4. Backend — Profil utilisateur

### Endpoint

```
GET /api/users/{id}/
```

Retourne : `id, username, email, role, avatar_url, followers_count, following_count, is_following`

**Décision** : compteurs calculés à la volée (pas de dénormalisation sur User).

---

## 5. Mobile — Architecture navigation

```
RootNavigator
├── AuthNavigator (Stack) — si non connecté
│   ├── LoginScreen
│   └── RegisterScreen
└── MainNavigator (Stack) — si connecté
    ├── Tabs (TabNavigator) — 5 onglets
    │   ├── FeedScreen
    │   ├── MatchesScreen
    │   ├── PublishScreen (FAB or)
    │   ├── MessagesScreen
    │   └── ProfileScreen
    ├── ConversationScreen (stack, pas un onglet)
    └── ProfileScreen (stack, pour profil d'un autre user)
```

**AuthContext** : `token` + `login()` + `logout()` — partagé via React Context.

---

## 6. Mobile — Écrans

### LoginScreen / RegisterScreen
- JWT login → `login(accessToken)` dans AuthContext
- Register → auto-login après inscription

### FeedScreen
- `useFocusEffect` pour re-fetch à chaque navigation vers l'onglet
- Tap sur l'auteur → navigate vers `Profile` avec `{ userId, username }`
- Toggle like → mise à jour locale optimiste du `likes_count`

### PublishScreen
- Sélection photo via `expo-image-picker`
- Upload direct vers Cloudinary (unsigned preset `foot_occitanie`)
- `CLOUD_NAME = 'du7oifrll'` (deux L à la fin)
- Sélection d'un match parmi les 10 premiers de la saison 2025
- POST `/api/posts/` avec `match_id`, `caption`, `medias`

### ProfileScreen
- **Sans params** → propre profil via `/api/auth/me/`
- **Avec `userId`** → profil d'un autre via `/api/users/{id}/` + bouton "Envoyer un message"
- Bouton "Message" → POST `/api/conversations/` → navigate vers `Conversation`

### MessagesScreen
- Liste des conversations avec `other_username`, `last_message`, `unread_count` (badge rouge)
- Tap → navigate vers `ConversationScreen` avec `{ conversationId, username }`

### ConversationScreen
- Bulles : `sender_username === username` (l'autre) → `bubbleOther`, sinon `bubbleMe`
- `KeyboardAvoidingView` avec `behavior='height'` sur Android
- `useFocusEffect` → charge messages + marque comme lus à l'ouverture
- Envoi → POST message → append local + scroll en bas

---

## 7. Flux Cloudinary

```
1. User sélectionne une photo
2. Mobile upload → Cloudinary (FormData: file + upload_preset)
   IMPORTANT: ne pas setter Content-Type manuellement (Axios le gère)
3. Cloudinary retourne secure_url
4. Mobile envoie secure_url à Django via POST /api/posts/
```

---

## 8. Décisions techniques

| Décision | Choix | Raison |
|----------|-------|--------|
| Feed vide (0 following) | Afficher tous les posts | Meilleure UX pour nouveaux utilisateurs |
| likes_count | Dénormalisé sur Post | Évite COUNT SQL à chaque affichage |
| followers/following_count | Calculé à la volée | Évite désync, calculé sur profil seulement |
| Partage | Option A (API native Share) | Aucun modèle backend, suffisant pour MVP |
| Tunnel dev | localhost.run SSH | WSL2 → téléphone physique |

---

## 9. Checklist Sprint 4

- [x] App `posts` : modèles + serializers + vues + urls
- [x] App `interactions` : Like, Comment, Follow + vues + urls
- [x] App `messaging` : Conversation, Message + serializers + vues + urls
- [x] Endpoint `GET /api/feed/`
- [x] Endpoint `GET /api/users/{id}/` (profil + is_following)
- [x] Mobile : AuthContext (login/logout/token)
- [x] Mobile : navigation basse 5 onglets + Auth Flow
- [x] Mobile : LoginScreen + RegisterScreen
- [x] Mobile : FeedScreen (useFocusEffect + like toggle + tap auteur)
- [x] Mobile : PublishScreen (Cloudinary + sélection match)
- [x] Mobile : ProfileScreen (propre profil + profil autre + bouton Message)
- [x] Mobile : MessagesScreen (liste conversations + badge non lus)
- [x] Mobile : ConversationScreen (chat + envoi + marquage lu)
- [x] Navigation : Profile et Conversation dans le Stack principal

---

## Sprint 4.5 — Design system + corrections

### Design system appliqué sur tous les écrans

**Tokens utilisés partout :**
- Rouge Occitan : `#E4002B` (boutons, actif, like)
- Or : `#F5C518` (FAB, avatar, accents)
- Fond : `#F6F3EE`
- Encre : `#1A1614` (texte principal)
- Texte secondaire : `#5C564F`
- Polices : `Anton_400Regular` (titres, scores), `PlusJakartaSans` (UI)
- Dégradé bouton : `['#E4002B', '#FF5A1F']`

### Corrections et nouvelles fonctionnalités

**FeedScreen :**
- Carousel horizontal multi-photos avec dots indicateurs (points blancs)
- Vidéo : placeholder ▶ (lecture vidéo reportée au build natif — expo-av/expo-video crashent dans Expo Go)
- Commentaires : bottom sheet Modal, ajout, suppression (long press sur son commentaire), compteur
- `comments_count` ajouté dans `PostSerializer` (calculé via `obj.comments.count()`)
- Compteurs likes et commentaires mis à jour localement sans rechargement

**PublishScreen :**
- Deux boutons séparés : Photos (multi-sélection) / Vidéo (sélection unique)
- Match lié rendu optionnel (backend : `match = ForeignKey(..., null=True, blank=True)`)
- Upload Cloudinary via `fetch` natif (axios crashait pour les vidéos sur Android)
- `mediaTypes: ['images']` / `['videos']` (remplacement `MediaTypeOptions` déprécié)

**MatchesScreen :**
- Chip "Toutes" supprimé — première poule auto-sélectionnée au chargement
- Évite les doubles classements et la surcharge de matchs

**ConversationScreen :**
- Fix clavier Android : `KeyboardAvoidingView behavior='height'` + `keyboardVerticalOffset={90}`
- `SafeAreaView edges={['bottom']}` pour éviter l'overlap avec la barre de navigation

**App.js / navigation :**
- `useSafeAreaInsets` dans TabNavigator pour corriger la barre d'onglets sur Android
- `softwareKeyboardLayoutMode: "resize"` dans app.json

### Décisions techniques Sprint 4.5

| Décision | Choix | Raison |
|----------|-------|--------|
| Lecture vidéo | Placeholder ▶ | expo-av et expo-video crashent dans Expo Go — sera activé au build EAS |
| Upload vidéo | `fetch` + FormData natif | axios plantait pour les fichiers binaires lourds sur Android |
| Commentaires | Bottom sheet Modal RN | Pas de dépendance externe, simple et suffisant |
| Sélection média | 2 boutons séparés Photos/Vidéo | `allowsMultipleSelection` + vidéo crash sur Android |
| Poule "Toutes" | Supprimée | Provoquait doublons rank 1 dans classement |

---

## Prochaine étape : Sprint 5

- Modération back-office (suppression posts/commentaires depuis l'admin React)
- Logs applicatifs + monitoring minimal
- Tests d'intégration end-to-end
- Déploiement VPS Ubuntu (PostgreSQL, Gunicorn, Nginx, Redis, Celery)
