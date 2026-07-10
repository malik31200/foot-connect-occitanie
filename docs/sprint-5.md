# Sprint 5 — Stabilisation MVP + déploiement VPS

## Objectifs

Finaliser le MVP et le mettre en production sur un VPS Ubuntu. Ce sprint couvre la modération back-office, les logs applicatifs, et le déploiement complet de l'infrastructure.

---

## 1. Modération back-office (React + Vite)

### Ce qu'on construit

Un écran dans l'admin web permettant à l'administrateur de :
- Voir la liste des posts avec auteur, caption, date
- Supprimer un post (et ses médias Cloudinary)
- Voir les commentaires d'un post
- Supprimer un commentaire

### Endpoints backend utilisés

| Méthode | Endpoint | Permission |
|---------|----------|------------|
| GET | `/api/posts/` | admin |
| DELETE | `/api/posts/{id}/` | admin |
| GET | `/api/posts/{id}/comments/` | admin |
| DELETE | `/api/posts/{id}/comments/{comment_id}/` | admin |

### Décisions

- Pas de soft delete (suppression définitive)
- Pas de signalement pour le MVP (V1 Sprint B)
- Pagination côté backend pour ne pas charger tous les posts d'un coup

---

## 2. Logs applicatifs

### Ce qu'on logue

- Erreurs API (4xx/5xx) via middleware Django
- Actions admin : suppression post, suppression commentaire, unlock match
- Synchronisations FFF (déjà dans SYNC_LOG)

### Approche

Utilisation du module `logging` Python natif + configuration dans `settings.py`.
Pas de service externe pour le MVP (Sentry ou similaire en V1).

---

## 3. Déploiement VPS Ubuntu

### Infrastructure cible

```
Internet (HTTPS)
      ↓
   Nginx (reverse proxy + SSL Let's Encrypt)
      ↓
   Gunicorn (WSGI Django)
      ↓
   Django API
      ↓
   PostgreSQL (base de données)
      ↓
   Redis (broker Celery)
      ↓
   Celery Worker + Celery Beat (scraper FFF)
```

### Étapes dans l'ordre

1. Provisionner VPS Ubuntu 22.04 (Hetzner ou OVH — 4-5€/mois)
2. SSH + firewall (ufw : ports 22, 80, 443)
3. Installer PostgreSQL + créer BDD et utilisateur
4. Cloner le repo + virtualenv Python + `pip install`
5. Variables d'environnement (`.env`)
6. `python manage.py migrate`
7. Configurer Gunicorn en service systemd
8. Build back-office React (`npm run build`)
9. Configurer Nginx (proxy `/api` → Gunicorn, statique React)
10. Certbot + SSL Let's Encrypt
11. Installer Redis
12. Configurer Celery Worker + Celery Beat en services systemd
13. Vérifier scraper FFF en production
14. Tests de smoke (login, post, classement)

### Variables d'environnement production

```env
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=ton-domaine.com
DATABASE_URL=postgresql://user:password@localhost:5432/footoccitanie
CLOUDINARY_URL=cloudinary://api_key:api_secret@du7oifrll
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=...
FFF_API_BASE_URL=https://api-dofa.prd-aws.fff.fr
FFF_TOKEN_URL=https://www.fff.fr/api/dofa/token
```

### Commande de mise à jour en production

```bash
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn celery celerybeat
```

---

## 4. Checklist Sprint 5

### Modération back-office
- [ ] Endpoint `DELETE /api/posts/{id}/` (admin only)
- [ ] Écran "Modération" dans l'admin React : liste des posts
- [ ] Bouton supprimer post avec confirmation
- [ ] Voir + supprimer commentaires d'un post
- [ ] Logs actions admin (suppression)

### Logs applicatifs
- [ ] Configuration `logging` dans `settings.py`
- [ ] Log erreurs 4xx/5xx
- [ ] Log actions admin

### Déploiement VPS
- [ ] VPS provisionné (Ubuntu 22.04)
- [ ] PostgreSQL installé + migrations
- [ ] Gunicorn en service systemd
- [ ] Nginx configuré (API + React statique)
- [ ] SSL Let's Encrypt actif
- [ ] Redis installé
- [ ] Celery Worker + Celery Beat en services systemd
- [ ] Scraper FFF vérifié en production
- [ ] URL production mise à jour dans `mobile/src/api/client.js`
- [ ] Tests de smoke OK

---

## Prochaine étape : V1

- Messagerie en temps réel (WebSocket ou polling)
- Notifications push (Expo Notifications)
- Confirmation email + mot de passe oublié
- Suppression de compte (RGPD)
- Signalement de contenu
- Lecture vidéo (build EAS natif)
