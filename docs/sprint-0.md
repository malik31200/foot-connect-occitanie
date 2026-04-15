# Sprint 0 — Initialisation du projet

## Ce qu'on a mis en place et pourquoi

---

## 1. Structure du projet

```
foot-connect-occitanie/
├── backend/        ← API Django (logique métier, base de données, scraper)
├── admin-panel/    ← Back-office React + Vite (interface administrateur)
├── mobile/         ← Application React Native + Expo (utilisateurs)
├── docs/           ← Documentation du projet
├── docker-compose.yml
├── .gitignore
└── CLAUDE.md
```

**Pourquoi cette structure ?**
Chaque partie du projet est indépendante : elle a ses propres dépendances, son propre serveur, et son propre déploiement. Séparer dès le début évite la confusion et reflète ce qu'on trouve dans les vrais projets professionnels.

---

## 2. Backend Django

### Installation

Depuis `backend/`, avec l'environnement virtuel activé :

```bash
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework djangorestframework-simplejwt python-decouple dj-database-url psycopg2-binary celery redis
pip freeze > requirements.txt
```

**Rôle de chaque bibliothèque :**

| Bibliothèque | Rôle |
|---|---|
| `django` | Framework web Python — URLs, modèles, ORM, vues |
| `djangorestframework` | Transforme Django en API REST (serializers, viewsets, permissions) |
| `djangorestframework-simplejwt` | Gestion des tokens JWT (login, refresh, logout) |
| `python-decouple` | Lit les variables depuis le fichier `.env` |
| `dj-database-url` | Parse l'URL de connexion PostgreSQL depuis le `.env` |
| `psycopg2-binary` | Driver Python pour parler à PostgreSQL |
| `celery` | Gestionnaire de tâches asynchrones (scraper FFF, recalcul classements) |
| `redis` | Client Python pour Redis (broker Celery) |

### Création du projet

```bash
django-admin startproject config .
```

Le dossier s'appelle `config` par convention : il ne contient que la configuration globale (settings, urls, wsgi). Le `.` évite de créer un sous-dossier inutile.

### Fichiers créés

```
backend/
├── config/
│   ├── __init__.py    ← démarre Celery au lancement de Django
│   ├── celery.py      ← configuration de Celery
│   ├── settings.py    ← configuration Django (BDD, apps, JWT...)
│   ├── urls.py        ← routes globales de l'API
│   ├── asgi.py        ← point d'entrée ASGI (déploiement async)
│   └── wsgi.py        ← point d'entrée WSGI (Gunicorn en prod)
├── manage.py          ← outil CLI Django (migrations, runserver...)
├── requirements.txt   ← liste des dépendances Python
├── Dockerfile         ← image Docker pour le service web
├── .env               ← variables d'environnement (jamais committé)
├── .gitignore
└── .dockerignore
```

---

## 3. Variables d'environnement (`.env`)

**Règle fondamentale : aucun secret dans le code.**

Le fichier `.env` contient toutes les valeurs sensibles ou spécifiques à l'environnement. Il est listé dans `.gitignore` — il ne sera jamais envoyé sur GitHub.

```env
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://footuser:footpassword@db:5432/footoccitanie
REDIS_URL=redis://redis:6379/0
FFF_API_BASE_URL=https://api-dofa.fff.fr
FFF_REGION_CODE=77
```

**Pourquoi `@db` et pas `@localhost` dans DATABASE_URL ?**
Dans Docker, chaque service s'appelle par son nom défini dans `docker-compose.yml`. Le service PostgreSQL s'appelle `db`, donc les autres conteneurs l'atteignent via `db`. Même logique pour `redis://redis:6379/0`.

Dans `settings.py`, Django lit ces valeurs avec `python-decouple` :

```python
from decouple import config
import dj_database_url

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')

DATABASES = {
    'default': dj_database_url.config(default=config('DATABASE_URL'))
}
```

---

## 4. Celery

Celery gère les tâches qui s'exécutent en dehors du cycle requête/réponse HTTP :
- Synchronisation FFF (scraper)
- Recalcul des classements après un résultat
- Envoi de notifications (V1)

### `config/celery.py`

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

`autodiscover_tasks()` trouve automatiquement les fichiers `tasks.py` dans chaque app Django.

### `config/__init__.py`

```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

Ce fichier garantit que Celery est initialisé dès que Django démarre.

### Dans `settings.py`

```python
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
```

Redis sert de **broker** : il reçoit les tâches envoyées par Django et les distribue aux workers Celery.

---

## 5. Docker (développement local uniquement)

Docker permet de lancer PostgreSQL et Redis sans les installer directement sur la machine. Tous les services tournent dans des conteneurs isolés.

### `docker-compose.yml`

```yaml
services:
  db:        ← PostgreSQL (base de données)
  redis:     ← Redis (broker Celery)
  web:       ← Django API
  celery_worker: ← exécute les tâches async
  celery_beat:   ← planificateur (déclenche le scraper FFF automatiquement)
```

### Commandes utiles

```bash
# Démarrer tous les services (première fois)
docker compose up --build

# Démarrer sans rebuild
docker compose up

# Arrêter
Ctrl+C

# Voir les logs d'un service spécifique
docker compose logs web
docker compose logs celery_worker
```

**Note importante :** Docker est utilisé uniquement en développement local. En production sur le VPS, tout sera installé manuellement (PostgreSQL, Redis, Gunicorn, Celery).

---

## 6. Back-office admin (React + Vite)

```bash
cd admin-panel
npm create vite@latest . -- --template react
```

Vite est un bundler moderne et rapide. Le template `react` crée un projet React minimal en JavaScript.

Structure générée :
```
admin-panel/
├── src/
│   ├── App.jsx       ← composant racine
│   └── main.jsx      ← point d'entrée
├── index.html
├── package.json
└── vite.config.js
```

---

## 7. Application mobile (React Native + Expo)

```bash
cd mobile
npx create-expo-app@latest . --template blank
```

Expo est un framework autour de React Native qui simplifie le développement mobile. Le template `blank` donne le strict minimum en JavaScript.

Structure générée :
```
mobile/
├── App.js        ← composant racine
├── app.json      ← configuration Expo (nom, icône, splash...)
├── index.js      ← point d'entrée
└── assets/       ← icônes et images
```

---

## 8. API FFF — découverte

L'URL documentée initialement (`api-dofa.prd-aws.fff.fr`) n'est pas accessible publiquement. La bonne URL est :

```
https://api-dofa.fff.fr
```

**Endpoints validés :**

```bash
# Championnats Occitanie
GET https://api-dofa.fff.fr/api/compets?cg_no=77&competition_type=CH&groups[]=compet_light

# Coupes Occitanie
GET https://api-dofa.fff.fr/api/compets?cg_no=77&competition_type=CP&groups[]=compet_light
```

**Points clés :**
- `cg_no=77` : code de la Ligue Occitanie de Football
- Pas d'authentification requise — API publique
- Format de réponse : JSON (API Hydra/JSON-LD)
- Exemple de données retournées : `cp_no`, `name`, `phases`, `groups` (POULE A, POULE B...)

---

## 9. Git — commits du Sprint 0

```
c4e41f5  Sprint 0 : init Django + Docker (web, db, redis, celery)
8d03000  Sprint 0 : init back-office React/Vite + mobile Expo
[dernier] Sprint 0 : correction URL API FFF (api-dofa.fff.fr, pas de token)
```

**Règles Git appliquées :**
- Jamais `git add .` en aveugle — on ajoute fichier par fichier
- `.env` et `venv/` toujours dans `.gitignore`
- `celerybeat-schedule` (fichier généré par Celery) dans `.gitignore`
- `node_modules/` ignoré dans `admin-panel/` et `mobile/`

---

## Prochaine étape : Sprint 1 — Authentification

On va créer le modèle `User` personnalisé dans Django avec les rôles `user` et `admin`, puis implémenter les endpoints :

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
