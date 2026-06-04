# Sprint 2a — Scraper FFF (backend)

## Ce qu'on a construit et pourquoi

---

## 1. Vue d'ensemble

Sprint 2a implémente la synchronisation automatique des données FFF. Sans ce scraper, l'application n'a aucune donnée sportive — pas de matchs, pas de clubs, pas de classements.

**Ce que fait le scraper :**
1. Se connecte à l'API publique FFF (`api-dofa.fff.fr`)
2. Récupère tous les championnats d'Occitanie (cg_no=77)
3. Pour chaque match : INSERT si nouveau, UPDATE si non verrouillé, SKIP si verrouillé
4. Enregistre le résultat dans `SYNC_LOG`
5. Se déclenche automatiquement via Celery Beat

**Endpoints construits :**

| Méthode | Endpoint | Accès | Description |
|---------|----------|-------|-------------|
| POST | `/api/scraper/sync` | Admin | Forcer une synchronisation immédiate |
| GET | `/api/scraper/status` | Admin | Résumé de la dernière synchro |
| GET | `/api/scraper/logs` | Admin | Historique des 30 dernières synchros |

**Résultat en production :** 2236 matchs synchronisés lors du premier test.

---

## 2. Exploration de l'API FFF

### URL de base
```
https://api-dofa.fff.fr
```
API publique, aucune authentification requise. Format Hydra/JSON-LD.

### Endpoints utilisés

```bash
# Liste des championnats Occitanie
GET /api/compets?cg_no=77&competition_type=CH&groups[]=compet_light

# Matchs d'une poule
GET /api/compets/{cp_no}/phases/{phase}/poules/{poule}/matchs
```

**Pourquoi `competition_type=CH` et pas `CP` ?**
`CH` = Championnat, `CP` = Coupe. On ne synchronise que les championnats.

### Particularité du format JSON-LD

Avec `groups[]=compet_light`, la FFF retourne un **tableau JSON** au lieu du format standard :

```json
// Format standard (hydra:member)
{"hydra:member": [{...}, {...}]}

// Format compet_light (tableau JSON-LD)
["/api/contexts/Compet", "/api/compets", "hydra:Collection", [{...}, {...}]]
```

**Solution dans `client.py`** : détecter si la réponse est une liste et extraire le bon élément :
```python
if isinstance(data, list):
    for item in data:
        if isinstance(item, list):
            return item
    return []
return data.get("hydra:member", [])
```

### Particularité des poules

Dans la réponse `compet_light`, les poules s'appellent `"groups"` (pas `"poules"`) :
```json
"phases": [{"number": 1, "groups": [{"stage_number": 1, "name": "POULE A"}]}]
```

Dans `service.py` : `phase.get("groups", [])` et non `phase.get("poules", [])`.

### Structure d'un match FFF

Champs clés utilisés par le scraper :

| Champ FFF | Notre BDD |
|-----------|-----------|
| `ma_no` | `Match.fff_id` |
| `competition.name` | `Match.category` |
| `competition.season` | `Match.season` |
| `poule.name` | `Match.group_name` |
| `poule_journee.number` | `Match.matchday` |
| `date` + `time` | `Match.date_time` |
| `terrain.name + city` | `Match.venue` |
| `status` ("A"→finished) | `Match.status` |
| `home_score` | `Match.home_score` |
| `away_score` | `Match.away_score` |
| `home.club.cl_no` | `Club.fff_id` |
| `home.short_name` | `Club.name` |
| `home.club.logo` | `Club.logo_url` |

**Identifiant synthétique pour les équipes :**
L'API FFF n'a pas d'ID direct pour une équipe dans cet endpoint. On construit :
```
fff_id = "{cl_no}_{team_number}_{cp_no}"
```
Exemple : `"285_1_434763"` = première équipe du club 285 dans la compétition 434763.

---

## 3. Architecture du scraper

```
backend/scraper/
├── models.py    ← SyncLog (historique des synchros)
├── client.py    ← Requêtes HTTP vers l'API FFF
├── parser.py    ← Extraction et nettoyage des données JSON
├── service.py   ← Logique INSERT / UPDATE / skip (is_locked)
├── tasks.py     ← Tâches Celery (sync_fff)
├── views.py     ← Endpoints API
├── urls.py      ← Routage
├── admin.py     ← Interface admin Django (SyncLog)
└── tests.py     ← 4 tests (INSERT, UPDATE, skip, SyncLog)
```

**Chaîne d'appels :**
```
Celery Beat → tasks.py → service.py → client.py (requête FFF)
                                    → parser.py (nettoyage JSON)
                                    → Club / Team / Match (BDD)
                                    → SyncLog (résultat)
```

---

## 4. `client.py` — Requêtes HTTP

```python
def get_competitions():
    # Retourne tous les championnats Occitanie (cg_no=77)
    # Gère le format JSON-LD tableau retourné par compet_light

def get_matches(cp_no, phase_number, poule_number):
    # Retourne tous les matchs d'une compétition / phase / poule
```

**Pourquoi pas de try/except ici ?**
`client.py` laisse les exceptions remonter. C'est `tasks.py` qui les attrape et les écrit dans `SyncLog`.

**Rate limiting FFF :** un `time.sleep(1)` dans `service.py` évite que la FFF refuse les connexions après trop de requêtes rapides.

---

## 5. `parser.py` — Nettoyage des données

```python
def parse_status(fff_status):
    # "A" (Archivé) → "finished", tout le reste → "scheduled"

def parse_datetime(date_str, time_str):
    # Combine "2025-09-06T00:00:00+00:00" et "18H00" → datetime UTC

def parse_match(raw):
    # Transforme un match brut FFF en dict propre pour la BDD
```

---

## 6. `service.py` — Logique métier

### `sync_matches()`

Orchestre toute la synchronisation :
1. Récupère les compétitions via `client.py`
2. Pour chaque compétition → phases → poules → matchs
3. Pour chaque match → `_sync_single_match()`
4. Retourne un dict `stats` avec les compteurs

### Logique INSERT / UPDATE / skip

```
fff_id inconnu en BDD         → INSERT  (source="fff")
fff_id connu + is_locked=False → UPDATE  (score, statut, date)
fff_id connu + is_locked=True  → SKIP    (logger.warning)
```

**`get_or_create`** — méthode Django utilisée pour Club et Team :
```python
club, created = Club.objects.get_or_create(
    fff_id="285",           # cherche par cette clé unique
    defaults={"name": ...}  # crée avec ces valeurs si absent
)
```

**Pourquoi `is_locked` ?**
L'admin peut corriger manuellement un résultat. Django met `is_locked = True` automatiquement. Le scraper ne peut plus écraser cette correction. L'admin déverrouille via `PATCH /api/matches/{id}/unlock`.

---

## 7. `tasks.py` — Tâche Celery

```python
@shared_task
def sync_fff():
    # 1. Crée un SyncLog avec status="partial" (avant de commencer)
    # 2. Appelle service.sync_matches()
    # 3. Met à jour le SyncLog avec le résultat
```

**Pourquoi créer le SyncLog avant la synchro ?**
Si Django crashe au milieu, l'entrée existe avec `finished_at=None`. L'admin voit qu'une synchro a démarré mais ne s'est jamais terminée.

**Les trois statuts :**
- `"success"` → `errors_count == 0`
- `"partial"` → synchro terminée mais avec des erreurs sur certains matchs
- `"failure"` → `sync_matches()` a planté complètement

---

## 8. `views.py` — Endpoints API

**Sécurité :** tous les endpoints vérifient `user.role == "admin"` et retournent `403` sinon.

- `POST /api/scraper/sync` → `.delay()` envoie la tâche à Celery sans attendre, répond `202`
- `GET /api/scraper/status` → dernier SyncLog (`order_by("-started_at").first()`)
- `GET /api/scraper/logs` → 30 derniers SyncLogs (`[:30]` = `LIMIT 30`)

---

## 9. Planification Celery Beat (`settings.py`)

```python
CELERY_BEAT_SCHEDULE = {
    "sync-fff-weekdays": {
        "task": "scraper.tasks.sync_fff",
        "schedule": crontab(hour=0, minute=0, day_of_week="1-5"),
    },
    "sync-fff-weekends": {
        "task": "scraper.tasks.sync_fff",
        "schedule": crontab(minute=0, hour="14,16,18,20,22,0", day_of_week="6,0"),
    },
}
```

| Période | Fréquence | Raison |
|---------|-----------|--------|
| Lundi–Vendredi | 1x/jour à minuit | Peu de matchs en semaine |
| Samedi–Dimanche | 6x/jour | Journées de championnat |

---

## 10. Bugs rencontrés et corrections

| Bug | Cause | Correction |
|-----|-------|------------|
| `ModuleNotFoundError: No module named 'requests'` | `requests` absent de `requirements.txt` | Ajouté `requests==2.32.3` |
| `AttributeError: 'Settings' object has no attribute 'FFF_API_BASE_URL'` | Variables FFF non déclarées dans `settings.py` | Ajouté `FFF_API_BASE_URL` et `FFF_REGION_CODE` via `config()` |
| `'list' object has no attribute 'get'` | `compet_light` retourne un tableau JSON-LD et non `{"hydra:member": [...]}` | Détection `isinstance(data, list)` dans `client.py` |
| `'list' object has no attribute 'get'` (2e fois) | Celery worker utilisait l'ancien code (pas de hot-reload) | `docker compose restart celery_worker` |
| Poules non trouvées | Clé `"poules"` incorrecte, l'API retourne `"groups"` | Corrigé dans `service.py` |
| 92 erreurs de connexion refusée | Rate limiting FFF (trop de requêtes rapides) | `time.sleep(1)` entre chaque appel `get_matches` |

---

## 11. Tests

4 tests passants :

```
test_insert_new_match            — nouveau fff_id → match créé en BDD
test_update_unlocked_match       — is_locked=False → score mis à jour
test_skip_locked_match           — is_locked=True → score préservé
test_service_does_not_create_synclog — service.py ne crée pas de SyncLog (c'est tasks.py)
```

```bash
docker compose exec web python manage.py test scraper
```

Résultat attendu :
```
Found 4 test(s).
....
Ran 4 tests in 6.1s
OK
```

---

## 12. Commandes utiles

```bash
# Démarrer tous les services
docker compose up --build

# Lancer les migrations
docker compose exec web python manage.py migrate

# Créer un superuser et lui donner le rôle admin
docker compose exec web python manage.py createsuperuser
docker compose exec web python manage.py shell -c \
  "from users.models import User; u = User.objects.get(email='admin@test.com'); u.role = 'admin'; u.save()"

# Redémarrer le worker Celery (nécessaire après modification du code)
docker compose restart celery_worker

# Lancer les tests
docker compose exec web python manage.py test scraper
```

---

## Prochaine étape : Sprint 2b — Frontend admin + mobile

- CRUD clubs/équipes back-office (React + Vite)
- Page Matchs mobile : liste avec filtres catégorie/poule/saison
