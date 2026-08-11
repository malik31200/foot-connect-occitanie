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

- Erreurs Django (WARNING+) → `backend/logs/django.log`
- Erreurs scraper FFF → même fichier
- Synchronisations FFF → `SYNC_LOG` en base (déjà en place)

### Approche

Module `logging` Python natif configuré dans `settings.py` avec :
- **Formatter** `verbose` : `[date] LEVEL app : message`
- **Handler** `file` : écrit dans `backend/logs/django.log` (WARNING+)
- **Handler** `console` : affiche dans le terminal
- **Loggers** : `django` et `scraper` branchés sur les deux handlers

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

## 4. Corrections et améliorations Sprint 5

### PublishScreen (mobile)
- Recherche de match par nom d'équipe (filtre client-side sur `home_team.name` / `away_team.name`)
- Suppression de la limite `.slice(0, 10)` — tous les matchs disponibles
- Filtre `?status=scheduled` au lieu de `?season=2025` (indépendant de la saison)

### Back-office admin
- Proxy Vite configuré dans `vite.config.js` (résout le problème WSL2 localhost → réseau)
- `client.js` : baseURL passée à `/api` (URL relative, plus de `localhost:8000` en dur)
- `Login.jsx` : utilise désormais `client` (plus d'axios direct + trailing slash)

### Scraper FFF
- API FFF passée en accès privé (403) depuis juin 2026
- Architecture scraper en place — opérationnel dès réouverture de l'API
- Données saisies manuellement via admin panel en attendant

---

## 5. Checklist Sprint 5

### Modération back-office
- [x] Endpoint `DELETE /api/posts/{id}/` (admin only)
- [x] Écran "Modération" dans l'admin React : liste des posts avec compteur commentaires
- [x] Bouton supprimer post avec confirmation
- [x] Voir + supprimer commentaires d'un post (toggle, try/catch)
- [ ] Logs actions admin (suppression) — à faire en V1

### Logs applicatifs
- [x] Configuration `logging` dans `settings.py`
- [x] Log erreurs Django (WARNING+) → `backend/logs/django.log`
- [x] Log erreurs scraper → même fichier
- [ ] Log actions admin explicites — à faire en V1

### Déploiement VPS
- [ ] VPS provisionné (Ubuntu 22.04 — Hetzner, vérification compte en cours)
- [ ] SSH + firewall ufw
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
