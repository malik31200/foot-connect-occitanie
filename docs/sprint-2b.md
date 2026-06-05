# Sprint 2b — Référentiel sportif (backend API + frontend admin)

## Ce qu'on a construit et pourquoi

---

## 1. Vue d'ensemble

Sprint 2b expose les données synchronisées par le scraper (Sprint 2a) via une API REST complète, et les rend accessibles depuis un back-office admin React.

**Backend :** serializers + views + URLs pour clubs, équipes et matchs.
**Frontend admin :** Login, Dashboard scraper, CRUD Clubs, CRUD Équipes.

---

## 2. Backend — API REST

### Architecture par app

Pour chaque app (`clubs`, `teams`, `matches`), 3 fichiers créés :

```
backend/
├── clubs/
│   ├── serializers.py   ← Club → JSON
│   ├── views.py         ← ClubViewSet (CRUD)
│   └── urls.py          ← router → /api/clubs/
├── teams/
│   ├── serializers.py   ← Team → JSON (avec Club imbriqué)
│   ├── views.py         ← TeamViewSet + filtre ?club_id=
│   └── urls.py          ← router → /api/teams/
└── matches/
    ├── serializers.py   ← Match → JSON (avec Team imbriqué)
    ├── views.py         ← MatchViewSet + /result + /unlock
    └── urls.py          ← router → /api/matches/
```

### Endpoints disponibles

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| GET | `/api/clubs/` | user + admin | Liste tous les clubs |
| POST | `/api/clubs/` | admin | Créer un club |
| PATCH | `/api/clubs/{id}/` | admin | Modifier un club |
| DELETE | `/api/clubs/{id}/` | admin | Supprimer un club |
| GET | `/api/teams/` | user + admin | Liste toutes les équipes |
| GET | `/api/teams/?club_id=5` | user + admin | Équipes d'un club |
| POST | `/api/teams/` | admin | Créer une équipe |
| DELETE | `/api/teams/{id}/` | admin | Supprimer une équipe |
| GET | `/api/matches/` | user + admin | Liste tous les matchs |
| GET | `/api/matches/?status=finished` | user + admin | Matchs filtrés |
| POST | `/api/matches/` | admin | Créer un match manuellement |
| PATCH | `/api/matches/{id}/result/` | admin | Saisir un résultat + verrouiller |
| PATCH | `/api/matches/{id}/unlock/` | admin | Déverrouiller un match |

### Serializers — pattern lecture/écriture

Pour les relations (Team → Club, Match → Team), on utilise deux champs :

```python
club = ClubSerializer(read_only=True)   # lecture : objet complet imbriqué
club_id = PrimaryKeyRelatedField(...)   # écriture : juste l'ID
```

- `GET /api/teams/` → retourne le club complet dans chaque équipe
- `POST /api/teams/` → envoyer `club_id: 5` suffit

### ViewSet — DefaultRouter

```python
router = DefaultRouter()
router.register(r'clubs', ClubViewSet, basename='club')
```

3 lignes génèrent automatiquement 6 endpoints (list, create, retrieve, update, partial_update, destroy).

### Permissions

Lecture (GET) → `IsAuthenticated` (user + admin)
Écriture (POST/PATCH/DELETE) → vérifie `user.role == "admin"` → sinon `403`

### Endpoints spéciaux `matches`

```python
@action(detail=True, methods=['patch'])
def result(self, request, pk=None):
    # Met à jour le score + is_locked = True automatiquement
    # PATCH /api/matches/{id}/result/

@action(detail=True, methods=['patch'])
def unlock(self, request, pk=None):
    # Passe is_locked = False
    # PATCH /api/matches/{id}/unlock/
```

---

## 3. CORS — communication React ↔ Django

Le navigateur bloque les requêtes entre origines différentes (`localhost:5173` → `localhost:8000`).

**Solution :** `django-cors-headers`

```python
# settings.py
INSTALLED_APPS = [..., 'corsheaders', ...]
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
```

---

## 4. Frontend admin — React + Vite

### Structure

```
admin-panel/src/
├── api/
│   └── client.js       ← axios configuré avec JWT automatique
├── pages/
│   ├── Login.jsx        ← connexion admin
│   ├── Dashboard.jsx    ← supervision scraper FFF
│   ├── Clubs.jsx        ← liste + créer + supprimer clubs
│   └── Teams.jsx        ← liste + filtrer + créer + supprimer équipes
└── App.jsx              ← routing + gestion auth
```

### `client.js` — axios avec intercepteur JWT

```javascript
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

Ajoute automatiquement le token JWT à **chaque requête** sans avoir à le faire manuellement dans chaque composant.

### `App.jsx` — routing et authentification

- Vérifie au chargement si un token existe dans `localStorage`
- Si oui → affiche l'app, sinon → affiche `<Login />`
- `BrowserRouter` + `Routes` + `Route` pour la navigation entre pages
- `useNavigate()` pour rediriger après login/logout

### `Login.jsx`

- Formulaire email + mot de passe
- POST vers `/api/auth/login` → stocke `access_token` et `refresh_token` dans `localStorage`
- Composant contrôlé : `value={email}` + `onChange` → React contrôle les champs

### `Dashboard.jsx`

- Charge `/scraper/status` et `/scraper/logs` au montage (`useEffect`)
- Bouton "Forcer une synchronisation" → POST `/scraper/sync` + désactivé pendant 5s (`syncing` state)
- Tableau des 30 dernières synchros

### `Clubs.jsx` et `Teams.jsx`

- Pattern identique : `useEffect` → charge les données → affiche dans un tableau
- Formulaire de création → POST → recharge la liste
- Bouton supprimer → `window.confirm` → DELETE → recharge la liste
- `Teams.jsx` : filtre par club via `GET /api/teams/?club_id=X`

---

## 5. Bugs rencontrés et corrections

| Bug | Cause | Correction |
|-----|-------|------------|
| `Email ou mot de passe incorrect` au login | CORS bloquait les requêtes entre 5173 et 8000 | Ajout `django-cors-headers` |
| `401 Unauthorized` après 15 min | Token JWT expiré | `ACCESS_TOKEN_LIFETIME` → 8h en dev |
| Ville des clubs vide | La FFF ne fournit pas la ville des clubs dans cet endpoint | Comportement normal — saisie manuelle possible |

---

## 6. Commandes utiles

```bash
# Lancer Docker en arrière-plan
docker compose up -d

# Lancer le serveur Vite
cd admin-panel && npm run dev

# Redémarrer Django après modification settings.py
docker compose restart web
```

---

## Prochaine étape : Fin Sprint 2b

- Page `Matches.jsx` — liste avec filtres + saisie résultats
- Sprint 3 — résultats, classements, onglets mobile
