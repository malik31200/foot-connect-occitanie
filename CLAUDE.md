
---

## 0. Statut du projet

| Sprint | Statut | Branche mergée |
|--------|--------|----------------|
| Sprint 0 — Init | ✅ Terminé | `main` |
| Sprint 1 — Auth JWT | ✅ Terminé | `main` |
| Sprint 2a — Scraper FFF | ✅ Terminé | `main` |
| Sprint 2b — Référentiel sportif | ✅ Terminé | `main` |
| Sprint 3 — Résultats + classements | ✅ Terminé | `main` |
| Sprint 4 — Réseau social complet | ✅ Terminé | `main` (PR #5) |
| Sprint 5 — Stabilisation + déploiement VPS | 🚧 En cours | `feature/sprint-5-deploy` |

**Branche active :** `feature/sprint-5-deploy`
**Documentation sprints :** `docs/`

---

## 1. Cadrage produit

### 1.1 Vision

Foot Occitanie est une plateforme mobile dédiée au football amateur en Occitanie, combinant suivi sportif (matchs, résultats, classements) et réseau social (posts, interactions, messagerie). L'administration du contenu sportif se fait via un back-office web réservé aux administrateurs. Les données sportives sont synchronisées automatiquement depuis l'API de la Fédération Française de Football (FFF).

### 1.2 Objectifs

- Centraliser l'information sportive locale (calendrier, résultats, classement).
- Synchroniser automatiquement les données FFF (matchs, résultats, classements).
- Créer une communauté active autour des clubs et des matchs.
- Proposer une expérience moderne, simple et mobile-first.
- Offrir un outil d'administration fiable pour la gestion sportive.

### 1.3 Personas

- **Users (application mobile)** :
    - **Supporter** : suit son club/catégorie, consulte résultats et classement.
    - **Joueur** : suit son équipe, publie du contenu match, interagit avec la communauté.
    - **Dirigeant/Coach** : consulte calendrier, résultats et visibilité club.
- **Administrateur (back-office web)** : gère référentiel sportif, surveille la synchronisation FFF et modère les contenus.

### 1.4 Périmètre MVP (obligatoire)

- Authentification (register/login/JWT).
- Synchronisation automatique des données FFF (matchs, résultats, clubs, équipes).
- Page Matchs unique avec onglets : À venir, Terminés, Classement, Calendrier.
- Gestion clubs/équipes/matchs/résultats côté admin (back-office web).
- Classements par catégorie/poule/saison.
- Réseau social de base : posts, likes, commentaires et follow.
- Espace admin de modération et supervision scraper.

### 1.5 Périmètre V1 (évolution)

- Messagerie privée complète (conversations + messages + lu/non lu).
- Notifications (in-app/push selon faisabilité).
- Modération avancée (signalement, blocage, journal d'actions).
- Amélioration UX mobile et performance.
- Synchronisation FFF toutes les 15 min les jours de matchs.

### 1.6 Hors périmètre actuel

- Streaming live vidéo.
- Chat de groupe.
- e-commerce.
- Interface web publique pour les utilisateurs (mobile uniquement).

---

## 2. User Stories et priorisation MoSCoW

### 2.1 User Stories

- En tant que visiteur, je veux créer un compte pour accéder aux fonctionnalités de la plateforme.
- En tant qu'utilisateur, je veux me connecter pour consulter mon espace personnel.
- En tant qu'utilisateur, je veux consulter les matchs à venir et terminés par catégorie.
- En tant qu'utilisateur, je veux voir le classement par catégorie/poule/saison.
- En tant qu'utilisateur, je veux voir le calendrier complet de la première à la dernière journée.
- En tant qu'utilisateur, je veux publier une photo/vidéo liée à un match.
- En tant qu'utilisateur, je veux liker, commenter et partager des publications.
- En tant qu'utilisateur, je veux follow ou unfollow d'autres utilisateurs.
- En tant qu'utilisateur, je veux envoyer et recevoir des messages privés.
- En tant qu'admin, je veux gérer clubs, équipes, matchs et résultats via le back-office web.
- En tant qu'admin, je veux corriger ou compléter les données importées depuis la FFF.
- En tant qu'admin, je veux voir les logs de synchronisation FFF pour détecter les erreurs.
- En tant qu'admin, je veux modérer les contenus publiés.

### 2.2 Priorisation MoSCoW

#### Must Have (indispensable MVP)

- Authentification JWT (register/login/refresh/me)
- Scraper FFF : synchronisation automatique clubs, équipes, matchs, résultats
- Page Matchs unique : À venir / Terminés / Classement / Calendrier
- Gestion admin : clubs, équipes, matchs, résultats (back-office web)
- Correction manuelle possible des données FFF par l'admin
- Dashboard supervision scraper (logs, statut, dernière synchro)
- Classement par catégorie/poule/saison
- Publications (photo/vidéo) + likes + commentaires
- Modération de base (suppression post/commentaire)
- Système de follow entre utilisateurs

#### Should Have (important)

- Feed personnalisé basé sur abonnements et récence
- Messagerie privée (création conversation + envoi message)
- Synchronisation FFF toutes les 15 min les week-ends

#### Could Have (souhaitable)

- Notifications push / in-app
- Statistiques avancées équipes/joueurs
- Recherche avancée (club, équipe, utilisateur, catégorie)
- Signalement de contenu par les utilisateurs

#### Won't Have for now (hors périmètre)

- Streaming live vidéo
- Chat de groupe
- Marketplace
- Interface web publique pour les utilisateurs

---

## 3. Spécifications fonctionnelles

### 3.1 Écrans — Application mobile (React Native)

Accessible à tous les utilisateurs :

- Écran d'authentification (inscription / connexion)
- Accueil (feed personnalisé)
- Page Matchs (liste + résultats + classement + calendrier + détails d'un match)
- Page Publier (création de post photo/vidéo)
- Profil utilisateur
- Messagerie privée (liste conversations + chat)

### 3.2 Écrans — Back-office admin (React + Vite)

Accessible uniquement aux administrateurs :

- Login admin
- Dashboard supervision scraper FFF (statut, logs, dernière synchro, erreurs)
- Gestion des clubs (CRUD + données FFF importées)
- Gestion des équipes (CRUD)
- Création et modification des matchs
- Saisie ou correction des résultats
- Modération des posts et commentaires
- Dashboard classements

### 3.3 Page Matchs (écran central — mobile)

La page Matchs regroupe sur un seul écran :

- **À venir** : prochains matchs avec détails (date, heure, lieu).
- **Terminés** : matchs joués avec score final.
- **Classement** : tableau de classement.
- **Calendrier** : toutes les journées (de la J1 à la dernière journée).

Filtres disponibles :

- Catégorie (U14 à Seniors)
- Poule / groupe
- Saison

Comportement attendu :

- Le changement de filtre (catégorie, poule, saison) met à jour les 4 onglets.
- L'onglet "Terminés" affiche les matchs joués avec score final.
- L'onglet "Calendrier" affiche toutes les journées dans l'ordre chronologique.
- L'onglet "Classement" affiche le classement correspondant aux filtres actifs.

### 3.4 Supervision scraper FFF (back-office admin)

L'admin dispose d'un dashboard de supervision avec :

- Statut de la dernière synchronisation (succès / échec / en cours)
- Date et heure de la dernière synchro réussie
- Nombre de matchs importés / mis à jour lors de la dernière synchro
- Liste des erreurs détectées (ex: match en conflit avec données manuelles)
- Bouton "Forcer une synchronisation manuelle"
- Historique des 30 dernières synchronisations

---

## 4. Modèle de données (BDD)

### 4.1 Tables principales

- `USER` : comptes utilisateurs (fan, joueur, dirigeant, admin)
- `CLUB` : clubs de football
- `TEAM` : équipes d'un club par catégorie
- `MATCH` : rencontres planifiées ou terminées
- `STANDING` : classement par catégorie / saison / poule
- `POST` : publications photo/vidéo
- `COMMENT` : commentaires des posts
- `LIKE` : likes des posts
- `FOLLOW` : abonnements entre utilisateurs
- `CONVERSATION` : conversations privées entre 2 utilisateurs
- `MESSAGE` : messages privés d'une conversation
- `SYNC_LOG` : historique des synchronisations FFF

### 4.2 Relations clés

- Un `CLUB` possède plusieurs `TEAM`.
- Une `TEAM` appartient à une `catégorie` et une `poule`.
- Un `MATCH` relie 2 équipes (`home_team`, `away_team`).
- Un `MATCH` peut avoir plusieurs `POST`.
- Un `POST` appartient à un `USER` et est **obligatoirement lié** à un `MATCH`.
- Un `POST` possède plusieurs `COMMENT` et `LIKE`.
- Un `FOLLOW` relie un utilisateur suiveur à un utilisateur suivi.
- Une `CONVERSATION` relie 2 utilisateurs.
- Une `CONVERSATION` contient plusieurs `MESSAGE`.
- `STANDING` est lié à `TEAM` + contexte (`catégorie`, `saison`, `poule`).
- `SYNC_LOG` enregistre chaque exécution du scraper FFF.

### 4.3 Champs recommandés (minimum)

#### USER

- id, username, email, password_hash, role (`user|admin`), avatar_url, created_at

#### CLUB

- id, name, city, logo_url, fff_id, created_at

#### TEAM

- id, club_id, name, category, group_name, season, fff_id, created_at

#### MATCH

- id, category, season, group_name, matchday, date_time, venue, status (`scheduled|finished|postponed`), home_team_id, away_team_id, home_score, away_score, source (`fff|manual`), fff_id, is_locked (booléen), created_at, updated_at

#### STANDING

- id, team_id, category, season, group_name, played, won, draw, lost, goals_for, goals_against, goal_diff, points, rank, updated_at

#### POST

- id, author_id, match_id, caption, likes_count, created_at
- Note : un post peut contenir plusieurs médias (photos et/ou vidéo). Les médias sont stockés dans `POST_MEDIA`.

#### POST_MEDIA

- id, post_id, media_type (`photo|video`), media_url, order (entier pour l'ordre du carousel), created_at

#### COMMENT

- id, post_id, author_id, content, is_edited, created_at, updated_at

#### LIKE

- id, post_id, user_id, created_at

#### FOLLOW

- id, follower_id, following_id, created_at

#### CONVERSATION

- id, user1_id, user2_id, created_at, updated_at

#### MESSAGE

- id, conversation_id, sender_id, content, is_read, created_at

#### SYNC_LOG

- id, started_at, finished_at, status (`success|failure|partial`), clubs_synced, teams_synced, matches_synced, results_synced, errors_count, error_details (JSON), created_at

### 4.4 Contraintes d'intégrité

- `LIKE` : unicité (`post_id`, `user_id`)
- `FOLLOW` : unicité (`follower_id`, `following_id`)
- `FOLLOW` : interdire `follower_id = following_id`
- `CONVERSATION` : unicité de la paire utilisateur (A,B) et (B,A)
- `MATCH` : interdire même équipe en domicile et extérieur
- `MATCH` : si `is_locked = true`, le scraper ne peut pas écraser les données
- `STANDING` : unicité (`team_id`, `category`, `season`, `group_name`)
- `COMMENT` : contenu non vide
- `POST` : `match_id` obligatoire (non nullable)
- `CLUB` : unicité `fff_id`
- `TEAM` : unicité `fff_id`
- `MATCH` : unicité `fff_id`

### 4.5 Index recommandés (performance)

- `MATCH(category, season, group_name, date_time)`
- `MATCH(status, date_time)`
- `MATCH(fff_id)`
- `STANDING(category, season, group_name, rank)`
- `POST(created_at)`
- `POST(match_id)`
- `COMMENT(post_id, created_at)`
- `MESSAGE(conversation_id, created_at)`
- `FOLLOW(follower_id)` et `FOLLOW(following_id)`
- `SYNC_LOG(started_at)`

---

## 5. Contrat API (REST)

### 5.1 Règles générales

- Base URL : `/api`
- Format : JSON (`application/json`)
- Auth : JWT Bearer (`Authorization: Bearer <access_token>`)
- Rôles : `user`, `admin`
- Dates : format ISO 8601

### 5.2 Authentification

#### POST `/api/auth/register`

- Permission : publique
- Body : `{ "username": "malik", "email": "m@x.com", "password": "******" }`
- Réponse 201 : `{ "id": 1, "username": "malik", "email": "m@x.com" }`

#### POST `/api/auth/login`

- Permission : publique
- Body : `{ "email": "m@x.com", "password": "******" }`
- Réponse 200 : `{ "access": "jwt_access", "refresh": "jwt_refresh" }`

#### POST `/api/auth/refresh`

- Permission : publique (avec refresh token)
- Body : `{ "refresh": "jwt_refresh" }`
- Réponse 200 : `{ "access": "new_jwt_access" }`

#### GET `/api/auth/me`

- Permission : user/admin connecté
- Réponse 200 : `{ "id": 1, "username": "malik", "email": "m@x.com", "role": "user" }`

### 5.3 Matchs et classements

#### GET `/api/matches?category=&season=&group=&status=`

- Permission : user/admin
- Réponse 200 : liste des matchs avec home_team, away_team, date_time, venue, status, scores, source

#### POST `/api/matches`

- Permission : admin — créer un match manuellement
- Body : home_team_id, away_team_id, category, season, group_name, matchday, date_time, venue

#### PATCH `/api/matches/{id}/result`

- Permission : admin — saisir ou corriger un résultat
- Body : `{ "home_score": 2, "away_score": 1, "status": "finished" }`
- Effet : `is_locked = true` + déclenchement recalcul classement (Celery)

#### PATCH `/api/matches/{id}/unlock`

- Permission : admin — déverrouiller pour permettre au scraper de mettre à jour
- Body : aucun
- Réponse 200 : `{ "id": 10, "is_locked": false }`

#### GET `/api/standings?category=&season=&group=`

- Permission : user/admin
- Réponse 200 : liste classement avec rank, team, played, won, draw, lost, goals_for, goals_against, goal_diff, points

### 5.4 Scraper FFF (admin uniquement)

#### GET `/api/scraper/status`

- Permission : admin
- Réponse 200 : `{ "last_sync": "2026-05-10T14:00:00Z", "status": "success", "matches_synced": 42, "errors_count": 0 }`

#### POST `/api/scraper/sync`

- Permission : admin — forcer une synchronisation immédiate
- Body : aucun
- Réponse 202 : `{ "message": "Synchronisation lancée", "task_id": "abc-123" }`

#### GET `/api/scraper/logs`

- Permission : admin — historique des 30 dernières synchronisations
- Réponse 200 : liste des SYNC_LOG

### 5.5 Réseau social

#### GET `/api/feed`

- Permission : user/admin — feed personnalisé (posts des utilisateurs suivis + récence)

#### POST `/api/posts`

- Permission : user/admin — `match_id` obligatoire
- Body : `{ "match_id": 10, "caption": "Belle victoire !", "medias": [{ "media_type": "photo", "media_url": "https://res.cloudinary.com/..." }, { "media_type": "photo", "media_url": "https://res.cloudinary.com/..." }] }`
- Un post peut contenir 1 vidéo ou plusieurs photos (carousel scrollable). Les médias sont stockés dans `PostMedia` avec un champ `order`.

#### POST `/api/posts/{id}/like`

- Permission : user/admin — toggle like/unlike

#### POST `/api/posts/{id}/comments`

- Permission : user/admin
- Body : `{ "content": "Super match !" }`

#### PATCH `/api/comments/{id}`

- Permission : auteur ou admin
- Body : `{ "content": "Super match, bravo !" }`

#### DELETE `/api/comments/{id}`

- Permission : auteur ou admin

#### POST `/api/users/{id}/follow`

- Permission : user/admin — toggle follow/unfollow

#### GET `/api/users/{id}/`

- Permission : user/admin — profil d'un utilisateur
- Réponse inclut les compteurs calculés à la volée (Option B choisie pour le MVP) :
  - `followers_count` : `Follow.objects.filter(following=user).count()`
  - `following_count` : `Follow.objects.filter(follower=user).count()`
- Décision : pas de champs dénormalisés sur `User` pour éviter les problèmes de synchronisation. Calculé à chaque appel profil uniquement (pas dans le feed).

### 5.6 Messagerie privée

#### GET `/api/conversations`

- Permission : user/admin — liste des conversations

#### POST `/api/conversations`

- Permission : user/admin
- Body : `{ "target_user_id": 7 }`

#### GET `/api/conversations/{id}/messages`

- Permission : participant de la conversation

#### POST `/api/conversations/{id}/messages`

- Permission : participant de la conversation
- Body : `{ "content": "Salut, prêt pour le match ?" }`
- Réponse 201 : `{ "id": 42, "content": "...", "created_at": "..." }`

#### PATCH `/api/conversations/{id}/read`

- Permission : participant de la conversation
- But : marquer tous les messages non lus comme lus
- Body : aucun
- Réponse 200 : `{ "marked_read": 5 }`

### 5.7 Erreurs standard

- `400` : données invalides
- `401` : non authentifié
- `403` : accès interdit
- `404` : ressource introuvable
- `409` : conflit (doublon like/follow)
- `422` : règle métier non respectée
- `500` : erreur serveur

Format : `{ "code": "VALIDATION_ERROR", "detail": "Le champ match_id est obligatoire." }`

---

## 6. Architecture technique

### 6.1 Vue d'ensemble

- **Application mobile** : React Native + Expo (iOS/Android) — tous les utilisateurs
- **Back-office web** : React + Vite — administrateurs uniquement
- **Backend API** : Django + DRF — logique métier + sécurité + endpoints

Tous les services backend tournent sur un **VPS Ubuntu géré manuellement**. Les données sportives sont synchronisées automatiquement depuis l'API FFF via un scraper Celery.

### 6.2 Stack technique complète

|Brique|Technologie|Rôle|
|---|---|---|
|Mobile|React Native + Expo|Application iOS et Android|
|Back-office|React + Vite|Interface admin web|
|Backend|Django + DRF|API REST, logique métier|
|Auth|JWT simplejwt|Access token + refresh token|
|Scraper|Celery + requests|Synchronisation API FFF|
|Serveur WSGI|Gunicorn|Fait tourner Django en production|
|Reverse proxy|Nginx|Routage HTTP/HTTPS + SSL|
|SSL/HTTPS|Let's Encrypt + Certbot|Certificat gratuit auto-renouvelable|
|BDD locale|PostgreSQL via Docker|Développement local|
|BDD production|PostgreSQL sur VPS|Installé et géré manuellement|
|Médias|Cloudinary|Photos et vidéos|
|Tâches async|Celery + Redis|Scraping FFF, classements, notifs|
|Planificateur|Celery Beat|Déclenchement automatique scraper|
|Serveur|VPS Ubuntu (Hetzner ou OVH)|Toute l'infrastructure|
|Mobile build|Expo EAS|Build et soumission stores|

### 6.3 Architecture backend Django — apps métier

- `users` : comptes, rôles, profils, auth JWT
- `clubs` : gestion des clubs
- `teams` : équipes, catégories, poules
- `matches` : calendrier, résultats, statuts match
- `standings` : calcul et lecture des classements
- `scraper` : synchronisation API FFF, logs, gestion conflits
- `posts` : publications médias liées aux matchs
- `interactions` : likes, commentaires, follows
- `messaging` : conversations et messages privés
- `moderation` : suppression contenus, blocage, signalements (V1)

### 6.4 Architecture du scraper FFF

#### Source de données

```
URL base   : https://api-dofa.fff.fr
Auth       : aucune (API publique, pas de token requis)
Format     : JSON (API Hydra/JSON-LD)
Région     : Occitanie (cg_no=77)
Catégories : U14, U16, U18, Seniors
```

#### Logique de synchronisation

```
Pour chaque match récupéré depuis la FFF :

  Si fff_id inconnu en BDD :
    → INSERT avec source = "fff"

  Si fff_id connu ET is_locked = false :
    → UPDATE (score, statut, date...)

  Si fff_id connu ET is_locked = true :
    → NE PAS ÉCRASER
    → Logger un avertissement dans SYNC_LOG
```

Le champ `is_locked` protège les données corrigées manuellement. L'admin peut déverrouiller via `PATCH /api/matches/{id}/unlock`.

#### Fréquence (Celery Beat)

```
Lundi → Vendredi  : une fois par jour (6h00)
Samedi → Dimanche : 6 fois par jour (toutes les 4 heures)
À la demande      : via back-office admin
```

#### Données synchronisées

- Clubs (nom, ville, fff_id)
- Équipes (catégorie, poule, saison, fff_id)
- Matchs (date, heure, lieu, statut, équipes)
- Résultats (scores)
- Déclenchement recalcul classement si nouveau résultat

### 6.5 Flux de données

#### Flux A — Synchronisation FFF (automatique)

1. Celery Beat déclenche `sync_fff` selon le planning.
2. Le scraper récupère un token Bearer depuis `fff.fr/api/dofa/token`.
3. Requêtes vers `api-dofa.prd-aws.fff.fr` pour chaque catégorie Occitanie.
4. Pour chaque match : INSERT si nouveau, UPDATE si non verrouillé, skip si verrouillé.
5. Si nouveau résultat → tâche `recalcul_standing` déclenchée.
6. Résultat enregistré dans `SYNC_LOG`.

#### Flux B — Correction manuelle admin

1. Admin constate une erreur dans les données FFF.
2. Admin corrige via `PATCH /api/matches/{id}/result`.
3. `is_locked` passe automatiquement à `true`.
4. Le scraper ne peut plus écraser cette donnée.
5. Admin peut déverrouiller via `PATCH /api/matches/{id}/unlock` si besoin.

#### Flux C — Publication d'un post

1. User choisit un match (obligatoire) + média.
2. Upload vers Cloudinary depuis le mobile.
3. Cloudinary retourne une `media_url`.
4. Création du post via Django (`match_id`, `media_url`, `caption`).
5. Retour dans le feed.

#### Flux D — Messagerie privée

1. User crée ou récupère une conversation.
2. Envoi de message via `POST /api/conversations/{id}/messages`.
3. Lecture via `GET /api/conversations/{id}/messages`.

#### Flux E — Marquage messages comme lus

1. User ouvre une conversation.
2. Front déclenche immédiatement `PATCH /api/conversations/{id}/read`.
3. Tous les messages non lus de l'autre participant passent à `is_read = true`.
4. Compteur mis à jour côté front.

### 6.6 Tâches asynchrones (Celery)

|Tâche|Déclencheur|Description|
|---|---|---|
|`sync_fff`|Celery Beat|Synchronisation complète API FFF|
|`sync_fff_forced`|Admin back-office|Synchronisation immédiate forcée|
|`recalcul_standing`|Nouveau résultat FFF ou manuel|Recalcul classement|
|`send_notification`|Interactions|Notifications in-app (V1)|
|`cleanup_sync_logs`|Hebdomadaire|Purge logs > 90 jours|

Broker : Redis — Planificateur : Celery Beat (obligatoire dès le MVP)

### 6.7 Conteneurisation Docker (développement local uniquement)

Services :

- `web` : Django API
- `db` : PostgreSQL
- `redis` : broker Celery
- `celery_worker` : tâches async
- `celery_beat` : planificateur (obligatoire — scraper FFF)

Commande : `docker compose up --build` Note : Docker est utilisé **uniquement en local**. En production tout est installé manuellement sur le VPS.

### 6.8 Déploiement — VPS Ubuntu (production)

#### Fournisseur recommandé

- **Hetzner** (4€/mois) ou **OVH** (5€/mois) — Ubuntu 22.04 LTS, 2 vCPU, 4 GB RAM

#### Architecture sur le VPS

```
Internet (HTTPS)
      ↓
   Nginx                 ← reverse proxy + SSL Let's Encrypt
      ↓
   Gunicorn              ← serveur WSGI Django
      ↓
   Django API            ← application backend
      ↓
   PostgreSQL            ← base de données
      ↓
   Redis                 ← broker Celery
      ↓
   Celery Worker         ← tâches async
      ↓
   Celery Beat           ← planificateur scraper FFF
```

#### Services installés sur le VPS

| Service       | Rôle                  | Géré par                 |
| ------------- | --------------------- | ------------------------ |
| Ubuntu 22.04  | OS                    | Manuellement             |
| PostgreSQL    | BDD production        | systemd                  |
| Python + venv | Environnement Django  | Manuellement             |
| Gunicorn      | Serveur WSGI          | systemd                  |
| Nginx         | Reverse proxy + HTTPS | systemd                  |
| Certbot       | SSL Let's Encrypt     | cron auto-renouvellement |
| Redis         | Broker Celery         | systemd                  |
| Celery Worker | Tâches async          | systemd                  |
| Celery Beat   | Planificateur scraper | systemd                  |
| Build React   | Back-office statique  | Servi par Nginx          |

#### Étapes de déploiement

1. Connexion SSH au VPS
2. Installation PostgreSQL + création BDD et utilisateur
3. Clone du repo GitHub Django
4. Installation dépendances Python dans un virtualenv
5. Configuration variables d'environnement (`.env`)
6. Migrations Django (`python manage.py migrate`)
7. Configuration Gunicorn comme service systemd
8. Build back-office React (`npm run build`)
9. Configuration Nginx (reverse proxy + fichiers React statiques)
10. Installation Certbot + certificat SSL Let's Encrypt
11. Installation et configuration Redis
12. Configuration Celery Worker comme service systemd
13. Configuration Celery Beat comme service systemd
14. Vérification scraper FFF en production (lancement manuel + logs)

#### Mise à jour en production

```bash
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn
sudo systemctl restart celery
sudo systemctl restart celerybeat
```

#### Variables d'environnement production

```
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=ton-domaine.com
DATABASE_URL=postgresql://user:password@localhost:5432/footoccitanie
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=...
FFF_API_BASE_URL=https://api-dofa.prd-aws.fff.fr
FFF_TOKEN_URL=https://www.fff.fr/api/dofa/token
FFF_REGION=Occitanie
```

---

## 7. Sécurité

### 7.1 Authentification JWT

- `access token` (durée courte) + `refresh token` (durée longue).
- Renouvellement via `/api/auth/refresh`.
- Déconnexion : blacklist du refresh token.

### 7.2 Autorisation (rôles et permissions DRF)

- `user` : matchs/classements, publier, liker, commenter, follow, messagerie.
- `admin` : gérer clubs/équipes/matchs, superviser scraper, modérer.
- Endpoints scraper (`/api/scraper/*`) réservés aux admins.
- Endpoints admin bloqués aux non-admin (`403`).

### 7.3 Sécurisation API

- Validation stricte des entrées.
- Rate limiting sur endpoints sensibles (`login`, `comments`, `messages`).
- Pagination obligatoire sur listes volumineuses.

### 7.4 Sécurité scraper FFF

- Token FFF en variable d'environnement, jamais en dur.
- Renouvellement automatique si token expiré.
- Timeout sur les requêtes HTTP vers l'API FFF.
- Retry automatique (max 3 tentatives) en cas d'échec réseau.
- Respect du rate limiting FFF (délai entre requêtes).

### 7.5 Sécurité des médias (Cloudinary)

- Upload signé (clé API jamais exposée côté mobile).
- Formats autorisés : images et vidéos uniquement.
- Limite de taille fichier.
- Compression automatique vidéos (durée max 60s).

### 7.6 Sécurité serveur VPS

- SSH par clé uniquement (mot de passe désactivé).
- Firewall `ufw` : ports 22, 80, 443 uniquement.
- Mises à jour automatiques (`unattended-upgrades`).
- Sauvegardes PostgreSQL planifiées (cron quotidien).

### 7.7 Protection des données personnelles (RGPD)

- Collecte minimale des données nécessaires.
- Droit de suppression de compte.
- Secrets toujours en variables d'environnement, jamais dans le code.

### 7.8 Bonnes pratiques opérationnelles

- HTTPS obligatoire en production.
- Rotation régulière des clés/secrets.
- Monitoring des erreurs et alertes de sécurité.
- Mises à jour régulières des dépendances.

---

## 8. Qualité logicielle

### 8.1 Stratégie de tests

#### Backend (Django / DRF)

- Tests unitaires : modèles, services, logique scraper
- Tests API : endpoints, permissions, validations
- Tests intégration : auth, publication, résultat → classement, synchro FFF
- Tests scraper : mock API FFF — cas INSERT / UPDATE / skip (is_locked)

#### Back-office admin (React + Vite)

- Tests unitaires composants (formulaires, tableaux, dashboard scraper)
- Tests intégration (CRUD, supervision scraper)

#### Mobile (React Native + Expo)

- Tests unitaires composants critiques
- Tests E2E : login, matchs, publier, commenter, messagerie

### 8.2 Jeux de tests prioritaires (MVP)

- Auth : register/login/refresh/me
- Scraper : synchro réussie, INSERT nouveau match, UPDATE non verrouillé, skip verrouillé
- Matchs : consultation + filtres catégorie/poule/saison
- Résultats : saisie admin + verrouillage automatique + unlock
- Classement : recalcul après résultat FFF ou manuel
- Post : création avec match_id obligatoire
- Interactions : like/commentaire (create/update/delete)
- Permissions : user vs admin, endpoints scraper
- Messagerie : conversation + message + marquage lu

### 8.3 Logs applicatifs

À logger :

- Erreurs API (4xx/5xx)
- Actions admin (match, score, modération, unlock)
- Tâches Celery (début, succès, échec)
- Synchronisations FFF complètes (dans SYNC_LOG)
- Conflits scraper (match verrouillé non écrasé)
- Événements sécurité (échecs login, accès refusés)

### 8.4 Monitoring & observabilité

- Disponibilité API (uptime)
- Temps de réponse endpoints critiques
- Santé Celery Worker, Celery Beat, Redis
- Alerte si scraper FFF en échec 3 fois consécutives

### 8.5 Critères qualité de livraison

- Zéro endpoint critique sans test
- Scraper testé avec mock API FFF
- Permissions validées
- Aucun secret en dur dans le code
- CI : lint + tests + build
- Documentation à jour

---

## 9. Roadmap d'exécution (MVP → V1)

### 9.1 Backlog priorisé — MVP

#### Sprint 0 — Initialisation projet

- Initialiser Django + DRF + JWT
- Initialiser back-office React + Vite
- Initialiser mobile React Native + Expo
- Docker local (web, db, redis, celery_worker, celery_beat)
- Configurer `.env` (dev/staging/prod)
- Repos GitHub + CI basique
- Tester manuellement l'API FFF (token + premières requêtes)

#### Sprint 1 — Authentification et base utilisateur

- Register / login / refresh / me
- Modèle USER + rôles (`user`, `admin`)
- Permissions DRF de base
- Écrans auth mobile + login admin back-office

#### Sprint 2a — Scraper FFF (backend pur)

- App Django `scraper` : token FFF, requêtes API, parsing JSON
- Logique INSERT / UPDATE / skip (is_locked)
- Synchro clubs, équipes, matchs depuis FFF Occitanie
- SYNC_LOG + enregistrement résultats
- Endpoint `POST /api/scraper/sync` (forcer synchro manuelle)
- Endpoint `GET /api/scraper/status` et `GET /api/scraper/logs`
- Celery Beat : planning automatique (1x/jour en semaine, 6x/jour le week-end)
- Tests : synchro réussie, INSERT nouveau match, UPDATE non verrouillé, skip verrouillé (mock API FFF)

#### Sprint 2b — Référentiel sportif (frontend admin + mobile)

- CRUD clubs/équipes back-office (React + Vite)
- Création matchs manuels (back-office)
- Page Matchs mobile : liste avec filtres catégorie/poule/saison (données scraper)

#### Sprint 3 — Résultats et classements

- Saisie/correction score (back-office) + is_locked automatique
- Endpoint `PATCH /api/matches/{id}/result` et `PATCH /api/matches/{id}/unlock`
- Statuts matchs (scheduled / finished / postponed)
- Recalcul classement via tâche Celery (`recalcul_standing`)
- Onglets Matchs mobile : À venir / Terminés / Classement / Calendrier
- Dashboard supervision scraper (statut, logs, erreurs, bouton forcer synchro)
- Tests : saisie résultat, verrouillage automatique, unlock, recalcul classement

#### Sprint 4 — Social de base

- Upload Cloudinary depuis mobile
- Création post (match obligatoire + média)
- Configurer Cloudinary
- Feed mobile
- Like (toggle)
- Commentaire (create/update/delete)
- Follow/unfollow
- Profil utilisateur
- Tests : création post, like, commentaire, follow, permissions

#### Sprint 5 — Stabilisation MVP + déploiement VPS

- Modération de base (back-office)
- Logs applicatifs + monitoring minimal
- Correctifs UX mobile
- Tests d'intégration end-to-end (auth → post → classement)
- Déploiement VPS Ubuntu :
    - PostgreSQL + migrations
    - Gunicorn + systemd
    - Nginx + SSL Let's Encrypt
    - Back-office React (build statique Nginx)
    - Redis + Celery Worker + Celery Beat en production
    - Vérification scraper FFF en production
    - Tests de smoke
    - Provisionner VPS Ubuntu (SSH, firewall, dépendances système)

---

### 9.2 Backlog priorisé — V1

#### V1 Sprint A — Compte utilisateur, conformité et messagerie

- Confirmation email à l'inscription
- Mot de passe oublié / réinitialisation
- Suppression de compte (RGPD)
- Journalisation consentement (CGU + Politique confidentialité)
- Messagerie privée complète : conversations, messages, statut lu/non lu

#### V1 Sprint B — Notifications et modération avancée

- Notifications in-app (push si faisable)
- Signalement de contenu
- Blocage utilisateur
- Journal d'actions admin (audit)

#### V1 Sprint B bis — Partage de publications (2 options à choisir)

- **Option A (MVP)** : partage externe via l'API native React Native `Share` → ouvre le menu système du téléphone (WhatsApp, SMS, copier lien…). Aucun modèle en base requis.
- **Option B (V1)** : repost interne (comme un Retweet) → modèle `SHARE` (id, user_id, post_id, created_at) + le post reposté apparaît dans le feed des abonnés.
- MVP implémenté avec Option A (bouton partage sans backend).

#### V1 Sprint C — Automatisation, sécurité et performance

- Scraper FFF toutes les 15 min les week-ends (Celery Beat)
- Optimisation performances API/mobile
- Renforcement sécurité VPS (fail2ban, audit logs)
- Sauvegardes automatiques PostgreSQL
- Observabilité renforcée (logs, métriques, alertes scraper)

---

### 9.3 Définition de "Done" (DoD)

Une fonctionnalité est "Done" si :

- Règles métier implémentées
- Permissions respectées
- Tests passants (scraper testé avec mock API FFF)
- Lint/build passants en CI
- Documentation mise à jour
- Validation fonctionnelle effectuée

# Foot Occitanie — Diagrammes techniques


---

## 1. Architecture globale

```mermaid
graph TB
    subgraph FRONTENDS["Frontends"]
        MOBILE["React Native + Expo\nApplication mobile iOS/Android"]
        ADMIN["React + Vite\nBack-office admin web"]
    end

    subgraph BACKEND["Backend — Django REST Framework"]
        API["Django API\nLogique métier + permissions"]
        CELERY["Celery Worker\nTâches asynchrones"]
        BEAT["Celery Beat\nPlanificateur scraper"]
    end

    subgraph SERVICES["Services internes — VPS Ubuntu"]
        PG["PostgreSQL\nBase de données"]
        REDIS["Redis\nBroker Celery"]
    end

    subgraph EXTERNES["Services externes"]
        CLOUD["Cloudinary\nPhotos et vidéos"]
        FFF["API FFF\napi-dofa.prd-aws.fff.fr"]
    end

    MOBILE -->|"JWT + HTTPS"| API
    ADMIN -->|"JWT + HTTPS"| API
    API --> PG
    API --> REDIS
    CELERY --> PG
    CELERY --> REDIS
    BEAT --> CELERY
    CELERY -->|"Scraping"| FFF
    MOBILE -->|"Upload direct"| CLOUD
```

---

## 2. Architecture VPS — serveur de production

```mermaid
graph TB
    INTERNET["Internet HTTPS"]

    subgraph VPS["VPS Ubuntu — Hetzner / OVH"]
        NGINX["Nginx\nReverse proxy + SSL Let's Encrypt"]
        GUNICORN["Gunicorn\nServeur WSGI"]
        DJANGO["Django API"]
        REACT_BUILD["React Build statique\nBack-office admin"]
        PG["PostgreSQL"]
        REDIS["Redis"]
        CW["Celery Worker"]
        CB["Celery Beat"]
    end

    CLOUDINARY["Cloudinary\nService externe"]
    FFF_API["API FFF\nService externe"]

    INTERNET --> NGINX
    NGINX -->|"/api/*"| GUNICORN
    NGINX -->|"/admin/*"| REACT_BUILD
    GUNICORN --> DJANGO
    DJANGO --> PG
    DJANGO --> REDIS
    REDIS --> CW
    CB --> CW
    CW -->|"Scraping"| FFF_API
    CW --> PG
```

---

## 3. Schéma base de données (ERD)

```mermaid
erDiagram
    USER {
        uuid id PK
        string username
        string email
        string password_hash
        string role
        string avatar_url
        timestamp created_at
    }

    CLUB {
        uuid id PK
        string name
        string city
        string logo_url
        string fff_id
        timestamp created_at
    }

    TEAM {
        uuid id PK
        uuid club_id FK
        string name
        string category
        string group_name
        string season
        string fff_id
        timestamp created_at
    }

    MATCH {
        uuid id PK
        uuid home_team_id FK
        uuid away_team_id FK
        string category
        string season
        string group_name
        int matchday
        timestamp date_time
        string venue
        string status
        int home_score
        int away_score
        string source
        string fff_id
        boolean is_locked
        timestamp created_at
        timestamp updated_at
    }

    STANDING {
        uuid id PK
        uuid team_id FK
        string category
        string season
        string group_name
        int played
        int won
        int draw
        int lost
        int goals_for
        int goals_against
        int goal_diff
        int points
        int rank
        timestamp updated_at
    }

    POST {
        uuid id PK
        uuid author_id FK
        uuid match_id FK
        string media_type
        string media_url
        string caption
        int likes_count
        timestamp created_at
    }

    COMMENT {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        string content
        boolean is_edited
        timestamp created_at
        timestamp updated_at
    }

    LIKE {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        timestamp created_at
    }

    FOLLOW {
        uuid id PK
        uuid follower_id FK
        uuid following_id FK
        timestamp created_at
    }

    CONVERSATION {
        uuid id PK
        uuid user1_id FK
        uuid user2_id FK
        timestamp created_at
        timestamp updated_at
    }

    MESSAGE {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        string content
        boolean is_read
        timestamp created_at
    }

    SYNC_LOG {
        uuid id PK
        timestamp started_at
        timestamp finished_at
        string status
        int clubs_synced
        int teams_synced
        int matches_synced
        int results_synced
        int errors_count
        json error_details
        timestamp created_at
    }

    CLUB ||--o{ TEAM : "possède"
    TEAM ||--o{ MATCH : "reçoit (dom.)"
    TEAM ||--o{ MATCH : "visite (ext.)"
    TEAM ||--o{ STANDING : "classement"
    USER ||--o{ POST : "publie"
    MATCH ||--o{ POST : "inspire"
    POST ||--o{ COMMENT : "reçoit"
    POST ||--o{ LIKE : "reçoit"
    USER ||--o{ COMMENT : "écrit"
    USER ||--o{ LIKE : "donne"
    USER ||--o{ FOLLOW : "suit"
    USER ||--o{ FOLLOW : "est suivi"
    USER ||--o{ CONVERSATION : "participe"
    CONVERSATION ||--o{ MESSAGE : "contient"
    USER ||--o{ MESSAGE : "envoie"
```

---

## 4. Flux authentification JWT

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Mobile as Mobile / Front
    participant API as Django API
    participant DB as PostgreSQL

    Note over User,DB: INSCRIPTION
    User->>Mobile: Remplit le formulaire
    Mobile->>API: POST /api/auth/register
    API->>DB: INSERT USER
    DB-->>API: USER créé
    API-->>Mobile: 201 — profil utilisateur

    Note over User,DB: CONNEXION
    User->>Mobile: Email + mot de passe
    Mobile->>API: POST /api/auth/login
    API->>DB: Vérif email + hash password
    DB-->>API: USER trouvé
    API-->>Mobile: 200 — access_token (15min) + refresh_token (7j)
    Mobile->>Mobile: Stocke les tokens en mémoire sécurisée

    Note over User,DB: REQUÊTE AUTHENTIFIÉE
    User->>Mobile: Ouvre le feed
    Mobile->>API: GET /api/feed + Bearer access_token
    API->>API: Vérifie signature JWT
    API->>DB: Requête données feed
    DB-->>API: Posts
    API-->>Mobile: 200 — données feed

    Note over User,DB: RENOUVELLEMENT TOKEN
    Mobile->>API: POST /api/auth/refresh + refresh_token
    API->>API: Vérifie refresh token
    API-->>Mobile: 200 — nouveau access_token
```

---

## 5. Flux scraper FFF

```mermaid
flowchart TD
    BEAT["Celery Beat\n(planificateur)"]
    BEAT -->|"1x/jour semaine\n(6x/jour week-end)"| TASK

    TASK["Tâche sync_fff\nCelery Worker"]
    TASK -->|"GET token"| TOKEN["www.fff.fr/api/dofa/token"]
    TOKEN -->|"Bearer token"| TASK
    TASK -->|"GET matchs Occitanie"| FFF["api-dofa.prd-aws.fff.fr"]
    FFF -->|"JSON matchs/résultats"| PARSE

    PARSE["Parsing JSON\nclubs, équipes, matchs"]
    PARSE --> CHECK

    CHECK{{"fff_id\nexiste en BDD ?"}}

    CHECK -->|"NON"| INSERT["INSERT MATCH\nsource = fff"]
    CHECK -->|"OUI"| LOCK

    LOCK{{"is_locked\n= true ?"}}

    LOCK -->|"NON"| UPDATE["UPDATE MATCH\nscore, statut, date"]
    LOCK -->|"OUI"| SKIP["SKIP\nLog avertissement"]

    INSERT --> RESULT_CHECK
    UPDATE --> RESULT_CHECK

    RESULT_CHECK{{"Nouveau\nrésultat ?"}}
    RESULT_CHECK -->|"OUI"| STANDING["Tâche recalcul_standing\nCelery"]
    RESULT_CHECK -->|"NON"| LOG

    STANDING --> LOG
    SKIP --> LOG
    LOG["SYNC_LOG\nstatus, counts, errors"]
```

---

## 6. Flux publication d'un post

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Mobile as React Native
    participant Cloud as Cloudinary
    participant API as Django API
    participant DB as PostgreSQL

    User->>Mobile: Choisit un match + sélectionne média
    Mobile->>Cloud: Upload fichier (photo ou vidéo)
    Cloud->>Cloud: Compression + stockage S3
    Cloud-->>Mobile: media_url sécurisée

    Mobile->>API: POST /api/posts\nmatch_id + media_url + caption
    API->>API: Vérifie match_id obligatoire\n+ permissions user
    API->>DB: INSERT POST
    DB-->>API: POST créé
    API-->>Mobile: 201 — post créé

    Note over Mobile: Retour dans le feed
    Note over Cloud,API: Django ne transit jamais le fichier\nIl reçoit uniquement la media_url
```

---

## 7. Flux mise à jour résultat et classement

```mermaid
sequenceDiagram
    actor Admin as Administrateur
    participant BO as Back-office React
    participant API as Django API
    participant DB as PostgreSQL
    participant CELERY as Celery Worker

    Note over Admin,CELERY: SAISIE MANUELLE PAR ADMIN
    Admin->>BO: Saisit le score du match
    BO->>API: PATCH /api/matches/{id}/result\nhome_score + away_score + status
    API->>DB: UPDATE MATCH\nstatus = finished\nis_locked = true
    DB-->>API: MATCH mis à jour
    API->>CELERY: Déclenche tâche recalcul_standing
    API-->>BO: 200 — match mis à jour

    CELERY->>DB: SELECT matchs de la saison\npour home_team et away_team
    DB-->>CELERY: Historique matchs
    CELERY->>CELERY: Calcule pts, V/N/D\nbuts pour/contre, diff
    CELERY->>DB: UPDATE STANDING\nrank, points, played...
    DB-->>CELERY: STANDING mis à jour

    Note over Admin,CELERY: RÉSULTAT FFF — MATCH VERROUILLÉ
    API->>DB: Scraper tente UPDATE
    DB-->>API: is_locked = true → SKIP
    API->>DB: INSERT SYNC_LOG\navertissement conflit
```

---

## 8. Flux messagerie privée

```mermaid
sequenceDiagram
    actor UserA as Utilisateur A
    actor UserB as Utilisateur B
    participant Mobile as React Native
    participant API as Django API
    participant DB as PostgreSQL

    Note over UserA,DB: CRÉER OU RÉCUPÉRER UNE CONVERSATION
    UserA->>Mobile: Clique sur profil de B
    Mobile->>API: POST /api/conversations\ntarget_user_id = B
    API->>DB: Vérifie si conversation A-B existe
    DB-->>API: Conversation existante ou créée
    API-->>Mobile: 200/201 — conversation_id

    Note over UserA,DB: ENVOYER UN MESSAGE
    UserA->>Mobile: Tape et envoie un message
    Mobile->>API: POST /api/conversations/{id}/messages\ncontent
    API->>DB: INSERT MESSAGE\nis_read = false\nsender_id = A
    DB-->>API: MESSAGE créé
    API-->>Mobile: 201 — message

    Note over UserB,DB: OUVRIR LA CONVERSATION (User B)
    UserB->>Mobile: Ouvre la conversation
    Mobile->>API: GET /api/conversations/{id}/messages
    API->>DB: SELECT messages
    DB-->>API: Liste messages
    API-->>Mobile: 200 — messages

    Mobile->>API: PATCH /api/conversations/{id}/read
    API->>DB: UPDATE MESSAGE\nSET is_read = true\nWHERE sender_id != B\nAND is_read = false
    DB-->>API: N messages marqués lus
    API-->>Mobile: 200 — marked_read: N
    Mobile->>Mobile: Compteur non lus remis à 0
```

---

## 9. Flux correction manuelle admin (is_locked)

```mermaid
flowchart TD
    A["Admin constate une erreur\ndans les données FFF"]
    A --> B["PATCH /api/matches/{id}/result\nhome_score + away_score"]
    B --> C["Django\nmet à jour MATCH"]
    C --> D["is_locked = true\nautomatiquement"]
    D --> E["Tâche Celery\nrecalcul_standing"]
    E --> F["Classement mis à jour"]

    D --> G{{"Admin veut\nré-autoriser FFF ?"}}
    G -->|"OUI"| H["PATCH /api/matches/{id}/unlock"]
    H --> I["is_locked = false"]
    I --> J["Prochain scraper FFF\npourra mettre à jour"]

    G -->|"NON"| K["Données manuelles\nprotégées définitivement"]
```

---

## 10. Architecture Django — apps et dépendances

```mermaid
graph LR
    subgraph DJANGO["Django Project"]
        USERS["users\ncomptes, rôles, JWT"]
        CLUBS["clubs\ngestion clubs"]
        TEAMS["teams\néquipes, catégories"]
        MATCHES["matches\ncalendrier, résultats"]
        STANDINGS["standings\nclassements"]
        SCRAPER["scraper\nAPI FFF, SYNC_LOG"]
        POSTS["posts\npublications médias"]
        INTERACTIONS["interactions\nlikes, comments, follows"]
        MESSAGING["messaging\nconversations, messages"]
        MODERATION["moderation\nsuppression, blocage (V1)"]
    end

    USERS --> POSTS
    USERS --> INTERACTIONS
    USERS --> MESSAGING
    CLUBS --> TEAMS
    TEAMS --> MATCHES
    MATCHES --> STANDINGS
    MATCHES --> POSTS
    SCRAPER --> CLUBS
    SCRAPER --> TEAMS
    SCRAPER --> MATCHES
    SCRAPER --> STANDINGS
    POSTS --> INTERACTIONS
```

---

## 11. Roadmap sprints MVP

```mermaid
gantt
    title Roadmap MVP — Foot Occitanie
    dateFormat  YYYY-MM-DD
    section Sprint 0
    Init Django + Docker           :s0a, 2025-09-01, 5d
    Init React + Expo              :s0b, 2025-09-01, 5d
    Config VPS + GitHub CI         :s0c, 2025-09-03, 4d
    Test manuel API FFF            :s0d, 2025-09-05, 2d

    section Sprint 1
    Auth register/login/JWT        :s1a, 2025-09-08, 5d
    Modèle USER + permissions      :s1b, 2025-09-08, 4d
    Écrans auth mobile             :s1c, 2025-09-10, 5d

    section Sprint 2
    App scraper + logique FFF      :s2a, 2025-09-15, 7d
    Celery Beat planning           :s2b, 2025-09-17, 3d
    CRUD clubs/équipes back-office :s2c, 2025-09-19, 5d
    Page Matchs mobile             :s2d, 2025-09-22, 4d

    section Sprint 3
    Saisie résultats + is_locked   :s3a, 2025-09-29, 4d
    Recalcul classement Celery     :s3b, 2025-09-30, 4d
    Onglets Matchs mobile          :s3c, 2025-10-02, 5d
    Dashboard supervision scraper  :s3d, 2025-10-04, 3d

    section Sprint 4
    Upload Cloudinary + posts      :s4a, 2025-10-13, 5d
    Feed mobile                    :s4b, 2025-10-15, 4d
    Likes + commentaires           :s4c, 2025-10-17, 4d
    Follow + profil                :s4d, 2025-10-20, 3d

    section Sprint 5
    Modération back-office         :s5a, 2025-10-27, 3d
    Tests backend + mobile         :s5b, 2025-10-28, 5d
    Déploiement VPS complet        :s5c, 2025-11-01, 5d
```

---

## 13. Design — Référence visuelle (Sprint 4)

Le dossier `Design/` contient le handoff complet créé par Claude Design :
- `Design/prototype/` — fichiers `.dc.html` (prototypes interactifs, à ouvrir dans un navigateur pour visualiser)
- `Design/screenshots/` — captures PNG des 13 écrans
- `Design/README.md` — spec complète (design tokens, comportements, composants par écran)

**Règle impérative :** Ne jamais copier le code des `.dc.html` dans le codebase. Ces fichiers utilisent un format interne (`support.js`) qui n'est pas du React Native. **Recréer chaque écran avec des composants React Native natifs** (`View`, `Text`, `Image`, `FlatList`, `TouchableOpacity`, `StyleSheet`, etc.).

### Design tokens à utiliser partout (Sprint 4+)

**Couleurs :**
- Rouge Occitan : `#E4002B` (primaire, actif, accents)
- Dégradé bouton rouge : `linear-gradient(95deg, #E4002B, #FF5A1F)`
- Or : `#F5C518` (FAB, croix occitane, accents)
- Fond écrans clairs : `#F6F3EE`
- Fond champs : `#F4F1EC`
- Encre (texte principal) : `#1A1614`
- Texte secondaire : `#5C564F`
- Vert succès : `#22A05A`

**Typographie :**
- Anton (Google Fonts) — titres, scores, logo, nombres (`text-transform: uppercase`)
- Plus Jakarta Sans (Google Fonts, 400→800) — toute l'UI

**Navigation basse (5 onglets) :** Accueil · Matchs · Publier (FAB or central) · Messages · Profil
- Actif : rouge `#E4002B` / Inactif : `#A8A29B`
- Sur le Feed (fond sombre) : barre translucide `rgba(14,11,10,.72)`
- Hauteur barre : 78–80px

### Écrans à implémenter (Sprint 4)
1. Connexion + Inscription (auth mobile JWT)
2. Feed (vidéos façon Reels, like, commentaires overlay)
3. Matchs (restyler `MatchesScreen.js` aux design tokens)
4. Publier (upload Cloudinary + création post)
5. Messages (liste conversations)
6. Conversation (chat privé)
7. Profil + Modifier le profil

---

## 12. Priorisation MoSCoW
quadrantChart title Priorisation fonctionnalités — Impact vs Effort x-axis Effort faible --> Effort élevé y-axis Impact faible --> Impact élevé quadrant-1 Faire en premier quadrant-2 Planifier quadrant-3 Reconsidérer quadrant-4 Déléguer ou reporter Auth JWT: [0.2, 0.95] Scraper FFF: [0.65, 0.90] Page Matchs: [0.35, 0.88] Classements: [0.40, 0.82] Posts médias: [0.50, 0.80] Likes/commentaires: [0.25, 0.75] Follow: [0.30, 0.70] Feed personnalisé: [0.55, 0.72] Back-office CRUD: [0.45, 0.85] Messagerie privée: [0.60, 0.60] Notifications push: [0.70, 0.55] Recherche avancée: [0.65, 0.40] Stats avancées: [0.75, 0.35] Signalement: [0.50, 0.45]'"'