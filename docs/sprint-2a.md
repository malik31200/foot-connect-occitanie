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
└── admin.py     ← Interface admin Django
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

def get_matches(cp_no, phase_number, poule_number):
    # Retourne tous les matchs d'une compétition / phase / poule
```

**Pourquoi pas de try/except ici ?**
`client.py` laisse les exceptions remonter volontairement. C'est `tasks.py` qui les attrape et les écrit dans `SyncLog`. Si on avalait les erreurs ici, le log ne saurait pas qu'une synchro a échoué.

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

**Pourquoi `parse_datetime` est nécessaire ?**
La FFF envoie la date et l'heure dans deux champs séparés avec des formats différents. On ne peut pas les stocker tels quels dans notre champ `date_time`.

---

## 6. `service.py` — Logique métier

### `sync_matches()`

Orchestre toute la synchronisation :
1. Récupère les compétitions via `client.py`
2. Pour chaque compétition → phases → poules → matchs
3. Pour chaque match → `_sync_single_match()`
4. Retourne un dict `stats` avec les compteurs

### `_sync_single_match(data, stats)`

Applique la logique INSERT / UPDATE / skip :

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
Si le club existe → retourne l'existant. S'il n'existe pas → le crée.

**Pourquoi `is_locked` ?**
L'admin peut corriger manuellement un résultat via le back-office. Django met automatiquement `is_locked = True`. Le scraper ne peut plus écraser cette correction. L'admin peut déverrouiller via `PATCH /api/matches/{id}/unlock`.

---

## 7. `tasks.py` — Tâche Celery

```python
@shared_task
def sync_fff():
    # 1. Crée un SyncLog avec status="partial" (avant de commencer)
    # 2. Appelle service.sync_matches()
    # 3. Met à jour le SyncLog avec le résultat
    # 4. Retourne les stats
```

**Pourquoi créer le SyncLog avant la synchro ?**
Si Django crashe au milieu, l'entrée existe quand même avec `finished_at=None`. L'admin voit qu'une synchro a démarré mais ne s'est jamais terminée.

**Les trois statuts possibles :**
- `"success"` → `errors_count == 0`
- `"partial"` → synchro terminée mais avec des erreurs sur certains matchs
- `"failure"` → `sync_matches()` a planté complètement

---

## 8. `views.py` — Endpoints API

### `POST /api/scraper/sync`
```python
task = sync_fff.delay()
return Response({"task_id": task.id}, status=202)
```
`.delay()` envoie la tâche à Celery **sans attendre** la fin. Django répond `202 Accepted` immédiatement.

### `GET /api/scraper/status`
```python
log = SyncLog.objects.order_by("-started_at").first()
```
Récupère le dernier SyncLog (tri décroissant par date).

### `GET /api/scraper/logs`
```python
logs = SyncLog.objects.order_by("-started_at")[:30]
```
Les 30 dernières synchros. `[:30]` = `LIMIT 30` en SQL.

**Sécurité :** tous les endpoints vérifient `user.role == "admin"` et retournent `403` sinon.

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

## 10. Lancer et tester

```bash
# Démarrer tous les services
docker compose up --build

# Forcer une synchro manuelle (dans un autre terminal)
curl -X POST http://localhost:8000/api/scraper/sync \
  -H "Authorization: Bearer <access_token>"

# Vérifier le statut
curl http://localhost:8000/api/scraper/status \
  -H "Authorization: Bearer <access_token>"

# Voir les logs
curl http://localhost:8000/api/scraper/logs \
  -H "Authorization: Bearer <access_token>"
```

---

## 11. Structure des fichiers scraper

```
backend/scraper/
├── models.py       ← SyncLog (table SYNC_LOG)
├── client.py       ← HTTP vers api-dofa.fff.fr
├── parser.py       ← Nettoyage JSON FFF → dict propre
├── service.py      ← INSERT / UPDATE / skip + compteurs
├── tasks.py        ← @shared_task sync_fff
├── views.py        ← sync_view, status_view, logs_view
├── urls.py         ← /sync /status /logs
└── admin.py        ← À faire (Sprint 2a suite)
```

---

## Prochaine étape : Suite Sprint 2a

- Enregistrer `SyncLog` dans l'interface admin Django (`admin.py`)
- Lancer Docker et tester la synchro FFF en conditions réelles
- Écrire les tests : synchro réussie, INSERT nouveau match, UPDATE non verrouillé, skip verrouillé (mock API FFF)
