# Sprint 3 — Résultats, classements et mobile matchs

## Ce qu'on a construit et pourquoi

---

## 1. Vue d'ensemble

Sprint 3 complète la boucle sportive : saisie de résultats → recalcul automatique du classement. Il ajoute aussi les 4 onglets sur mobile avec filtres dynamiques par catégorie et poule.

**Backend :** app `standings` (modèle + tâche Celery), endpoints `/result` et `/unlock`, pagination FFF, correction `parse_status`, endpoints filtres dynamiques.
**Admin :** page Classements avec filtres.
**Mobile :** 4 onglets (À venir, Terminés, Classement, Calendrier) + chips filtres catégorie/poule via React Context.

---

## 2. Backend — App `standings`

### Modèle Standing

```python
class Standing(models.Model):
    team = models.ForeignKey(Team, ...)
    category, season, group_name  # contexte du classement
    played, won, draw, lost       # statistiques
    goals_for, goals_against, goal_diff
    points, rank
    unique_together = [('team', 'category', 'season', 'group_name')]
```

`unique_together` garantit qu'une équipe n'a qu'une seule ligne de classement par contexte (catégorie + saison + poule).

### Tâche Celery `recalcul_standing`

Déclenchée automatiquement après chaque saisie de score (admin) ou détection de résultat (scraper FFF).

```
recalcul_standing(category, season, group_name)
  → SELECT tous les matchs finished de ce contexte
  → Pour chaque match : calcule V/N/D, buts pour/contre, points
  → UPDATE ou CREATE le Standing de chaque équipe
  → Recalcule les rangs (order_by points, goal_diff)
```

Filtre important : `home_score__isnull=False` pour éviter les TypeError sur les matchs sans score.

### Endpoints matchs (Sprint 3)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| PATCH | `/api/matches/{id}/result/` | Saisir score + `is_locked = True` automatique + déclenche recalcul |
| PATCH | `/api/matches/{id}/unlock/` | Repasse `is_locked = False` |
| GET | `/api/standings/` | Liste classement (filtres : category, season, group_name) |
| GET | `/api/matches/filters/` | Liste les catégories distinctes d'une saison |
| GET | `/api/matches/groups/` | Liste les poules d'une catégorie |

### Endpoints filtres dynamiques

```python
@action(detail=False, methods=['get'])
def filters(self, request):
    # GET /api/matches/filters/?season=2025
    # → { "categories": ["Régional 1 M", "U16 Régional 1 M", ...] }

@action(detail=False, methods=['get'])
def groups(self, request):
    # GET /api/matches/groups/?season=2025&category=U14 Régional 1
    # → { "groups": ["POULE A", "POULE B", "POULE C"] }
```

`.values_list('category', flat=True).distinct()` — récupère les valeurs uniques directement en BDD, très léger.

### Correction `parse_status` (scraper)

```python
# Avant : ne détectait que le code "A" de la FFF
# Après : détecte aussi les matchs avec score présent
"status": "finished" if (raw.get("home_score") is not None) else parse_status(raw.get("status", ""))
```

### Pagination FFF

L'API FFF utilise le format Hydra pour la pagination. Avant Sprint 3, seule la première page était récupérée (~5 matchs au lieu de 30+).

```python
while url:
    response = requests.get(url, timeout=10)
    data = response.json()
    all_matches.extend(data.get("hydra:member", []))
    next_page = data.get("hydra:view", {}).get("hydra:next")
    url = f"{FFF_BASE_URL}{next_page}" if next_page else None
```

---

## 3. Admin — Page Standings

`admin-panel/src/pages/Standings.jsx` — tableau de classement avec filtres catégorie/saison/poule.
Ajouté dans `App.jsx` : route `/standings` + lien nav.

Colonnes affichées : # / Équipe / MJ / V / N / D / BP / BC / DB / Pts

---

## 4. Mobile — MatchesScreen avec filtres

### Problème résolu

Avant Sprint 3, les onglets chargeaient TOUS les matchs (2236 au total) → timeout + rien ne s'affichait.
Après Sprint 3 : on charge uniquement les matchs de la catégorie/poule sélectionnée (~20-50 matchs).

### React Context

Mécanisme de partage d'état entre composants sans passer des props à chaque niveau.

```jsx
const FiltersContext = createContext({ category: null, poule: null })

// Dans MatchesScreen (parent) :
<FiltersContext.Provider value={{ category, poule }}>
  <Tab.Navigator>...</Tab.Navigator>
</FiltersContext.Provider>

// Dans chaque onglet (enfant) :
const { category, poule } = useContext(FiltersContext)
```

### Chip (composant réutilisable)

```jsx
function Chip({ label, selected, onPress }) { ... }
```

Utilisé à la fois pour les chips catégorie et les chips poule — évite la duplication de code.

### Chargement en cascade

1. Montage → `GET /api/matches/filters/?season=2025` → charge les catégories
2. Catégorie sélectionnée → `GET /api/matches/groups/?season=2025&category=X` → charge les poules
3. Poule sélectionnée (ou "Toutes") → chaque onglet refait sa requête filtrée

---

## 5. Bugs rencontrés et corrections

| Bug | Cause | Correction |
|-----|-------|------------|
| Onglets "Terminés" et "Calendrier" vides | 2000+ matchs → timeout 10s | Filtres catégorie/poule → ~20 matchs |
| Chip "Toutes" occupe tout l'écran | `ScrollView` sans `flexGrow: 0` | Ajout `flexGrow: 0` dans `chipsRow` |
| 503 sur mobile | Tunnel `localhost.run` tombé | Relancer `ssh -R 80:localhost:8000 localhost.run` |
| `ALLOWED_HOSTS` bloque le tunnel | Variable d'env non rechargée | `docker compose up -d --force-recreate web` |
| `encodeURIComponent` non appelé | Oubli des `()` → la fonction s'affiche dans l'URL | `encodeURIComponent(category)` |

---

## 6. Commandes utiles

```bash
# Recalculer tous les classements manuellement
docker compose exec web python manage.py recalcul_all_standings

# Lancer le tunnel pour le mobile
ssh -R 80:localhost:8000 localhost.run

# Lancer Expo
cd mobile && npx expo start --tunnel
```
