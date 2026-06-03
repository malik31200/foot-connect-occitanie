# Classement en temps réel depuis l'API FFF

## Objectif

Afficher le classement d'une équipe directement depuis l'API FFF, sans attendre un scraping manuel.

---

## 1. L'endpoint FFF pour les classements

L'API FFF expose les classements par compétition / phase / poule :

```
GET https://api-dofa.fff.fr/api/compets/{cp_no}/phases/{phase}/poules/{poule}/classement
```

Exemple concret (Régional 1 Seniors JET) :
```
GET https://api-dofa.fff.fr/api/compets/434763/phases/1/poules/1/classement
```

**Comment trouver `cp_no`, `phase`, `poule` pour ton club ?**

Étape 1 — Récupère les compétitions du club :
```
GET https://api-dofa.fff.fr/api/clubs/11641/matchs?sa_no=2025
```
Dans chaque match tu as `competition.cp_no`, `phase.number`, `poule.stage_number`.

Étape 2 — Teste l'URL de classement avec ces valeurs dans le terminal :
```bash
curl -s "https://api-dofa.fff.fr/api/compets/434763/phases/1/poules/1/classement" | python3 -m json.tool
```

La réponse contient `hydra:member` avec une liste de lignes de classement :
```json
{
  "hydra:member": [
    {
      "rank": 1,
      "team": { "short_name": "LUNEL GC", "club": { "cl_no": 285 } },
      "played": 20,
      "won": 14,
      "draw": 3,
      "lost": 3,
      "goals_for": 42,
      "goals_against": 18,
      "points": 45
    },
    ...
  ]
}
```

---

## 2. Stratégie — ne pas appeler la FFF à chaque requête

Appeler la FFF à chaque chargement de page est une mauvaise idée :
- La FFF peut être lente ou down
- Risque de rate limiting
- Inutile : le classement ne change pas toutes les secondes

**Solution : cache côté Django**

Django peut mettre en cache la réponse pendant N minutes. Si le cache est valide → retourne les données locales. Sinon → appelle la FFF et met en cache.

```
Navigateur → Django → Cache valide ? → OUI → retourne les données
                                      → NON → appelle FFF → met en cache → retourne
```

---

## 3. Implémentation Django

### `settings.py` — activer le cache en mémoire

```python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}
```

En production sur le VPS, remplace par Redis :
```python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
    }
}
```

### `views.py` — vue qui proxie le classement FFF avec cache

```python
import requests
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

FFF_BASE = "https://api-dofa.fff.fr"
CACHE_TIMEOUT = 15 * 60  # 15 minutes


@api_view(['GET'])
@permission_classes([AllowAny])
def classement_view(request):
    cp_no = request.query_params.get('cp_no')
    phase = request.query_params.get('phase', '1')
    poule = request.query_params.get('poule', '1')

    if not cp_no:
        return Response({'error': 'cp_no requis'}, status=400)

    cache_key = f"classement_{cp_no}_{phase}_{poule}"
    data = cache.get(cache_key)

    if data is None:
        try:
            url = f"{FFF_BASE}/api/compets/{cp_no}/phases/{phase}/poules/{poule}/classement"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json().get("hydra:member", [])
            cache.set(cache_key, data, CACHE_TIMEOUT)
        except requests.RequestException as e:
            return Response({'error': str(e)}, status=502)

    return Response(data)
```

### `urls.py` — brancher l'endpoint

```python
path('api/classement/', classement_view),
```

Résultat :
```
GET /api/classement/?cp_no=434763&phase=1&poule=1
```

---

## 4. Implémentation Next.js

### Affichage statique (Server Component)

Si le classement n'a pas besoin d'être mis à jour pendant la navigation :

```tsx
// app/equipes/[id]/classement/page.tsx
export default async function ClassementPage({ params }) {
  const res = await fetch(
    `http://backend:8000/api/classement/?cp_no=434763&phase=1&poule=1`,
    { next: { revalidate: 900 } }  // Next.js revalide toutes les 15 min
  )
  const rows = await res.json()

  return (
    <table>
      <thead>
        <tr>
          <th>Rang</th><th>Équipe</th><th>J</th><th>V</th>
          <th>N</th><th>D</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.rank}>
            <td>{row.rank}</td>
            <td>{row.team.short_name}</td>
            <td>{row.played}</td>
            <td>{row.won}</td>
            <td>{row.draw}</td>
            <td>{row.lost}</td>
            <td><strong>{row.points}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

`next: { revalidate: 900 }` = Next.js garde la page en cache 15 min côté serveur, puis re-fetch automatiquement. Pas besoin de JavaScript côté client.

### Affichage dynamique avec auto-refresh (Client Component)

Si tu veux que le classement se mette à jour sans recharger la page (ex: pendant un match) :

```tsx
'use client'
import { useEffect, useState } from 'react'

export default function ClassementLive({ cpNo, phase = 1, poule = 1 }) {
  const [rows, setRows] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchClassement = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/classement/?cp_no=${cpNo}&phase=${phase}&poule=${poule}`
    )
    const data = await res.json()
    setRows(data)
    setLastUpdate(new Date())
  }

  useEffect(() => {
    fetchClassement()
    // Rafraîchit toutes les 5 minutes
    const interval = setInterval(fetchClassement, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [cpNo])

  return (
    <div>
      <table>
        {/* même tableau que ci-dessus */}
      </table>
      {lastUpdate && (
        <p>Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</p>
      )}
    </div>
  )
}
```

---

## 5. Trouver les cp_no de toutes les équipes de JET

Lance ce script Python une seule fois pour identifier les compétitions actives :

```bash
docker compose exec backend python manage.py shell
```

```python
import requests

matches = []
url = "https://api-dofa.fff.fr/api/clubs/11641/matchs?sa_no=2025"
while url:
    r = requests.get("https://api-dofa.fff.fr" + url if url.startswith('/') else url)
    data = r.json()
    matches += data['hydra:member']
    url = data.get('hydra:view', {}).get('hydra:next')

# Affiche les compétitions uniques
seen = set()
for m in matches:
    c = m['competition']
    key = (c['cp_no'], m['phase']['number'], m['poule']['stage_number'])
    if key not in seen:
        seen.add(key)
        print(f"cp_no={c['cp_no']}  phase={m['phase']['number']}  poule={m['poule']['stage_number']}  → {c['name']}")
```

Résultat attendu :
```
cp_no=434763  phase=1  poule=1  → Régional 1 M - ESCATES
cp_no=434820  phase=1  poule=2  → U17 Régional 1
cp_no=...
```

Note ces valeurs — tu les passes en paramètre à `/api/classement/`.

---

## 6. Résumé des choix

| Besoin | Solution |
|---|---|
| Classement mis à jour toutes les 15 min | Server Component + `revalidate: 900` |
| Classement qui se rafraîchit pendant un match | Client Component + `setInterval` |
| Ne pas surcharger la FFF | Cache Django 15 min |
| Pas de Celery dans ce projet | Cache mémoire suffit (pas Redis) |
