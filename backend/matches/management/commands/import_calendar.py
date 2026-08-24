"""
Importe un calendrier FFF copié-collé depuis occitanie.fff.fr.

Usage :
    python manage.py import_calendar <fichier.txt> --category U18 --season "2026/2027" --group "Poule A"

Options :
    --dry-run       Affiche ce qui serait importé sans rien écrire en base
    --skip-j1       Ignore la Journée 1 (déjà importée manuellement)
    --create-teams  Crée automatiquement les clubs et équipes manquants
"""

import re
import datetime
import unicodedata
from zoneinfo import ZoneInfo
from pathlib import Path
from django.core.management.base import BaseCommand
from matches.models import Match
from teams.models import Team
from clubs.models import Club


def normalize(s):
    """Supprime accents, apostrophes, met en minuscule — pour comparaison floue."""
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    s = s.lower().replace("'", " ").replace("-", " ")
    return ' '.join(s.split())


def find_team(fff_name, all_teams):
    """
    Cherche une équipe parmi all_teams par comparaison normalisée.
    Retourne la liste des équipes qui matchent.
    """
    key = normalize(fff_name)
    words = [w for w in key.split() if len(w) >= 2]
    if not words:
        return []
    result = []
    for team in all_teams:
        db_norm = normalize(team.name)
        hits = sum(1 for w in words if w in db_norm)
        threshold = len(words) if len(words) <= 3 else 3
        if hits >= threshold:
            result.append(team)
    return result


def find_club(fff_name, all_clubs):
    """
    Cherche un club existant par comparaison normalisée (même algo que find_team).
    Retourne la liste des clubs qui matchent.
    """
    key = normalize(fff_name)
    words = [w for w in key.split() if len(w) >= 2]
    if not words:
        return []
    result = []
    for club in all_clubs:
        db_norm = normalize(club.name)
        hits = sum(1 for w in words if w in db_norm)
        threshold = len(words) if len(words) <= 3 else 3
        if hits >= threshold:
            result.append(club)
    return result


PARIS = ZoneInfo('Europe/Paris')

MOIS = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
    'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
    'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
}

SKIP_PATTERNS = [
    'Logo', 'Ligue', 'District', 'Connexion', 'Accueil', 'Compétitions',
    'Formations', 'Arbitrage', 'Médias', 'Documents', 'Phase', 'Unique',
    'Poule', 'Résultats', 'Agenda', 'Classement', 'Calendrier',
    'Recherche', 'Par journée', 'Par date', 'Par équipe', 'Valider',
    'CHAMPIONNAT', 'COUPE', 'Sélectionnez', 'CGU', 'Mentions',
    'Données', 'Cookies', 'FFF', 'fff', 'Footclubs', 'Football',
    'Programme', 'FAFA', 'Labels', 'Fiches', 'Santé', 'Scores',
    'Joueurs', 'Portail', 'formations', 'Liens', 'Messagerie',
    'Documents officiels', 'LIGUE DE FOOTBALL', 'accent du sud',
    'Pratiques', 'Technique', 'Clubs', 'Billetterie', 'Boutique',
    'jj/mm/aaaa', 'E-learning', 'enfants', 'Féminin', 'FFFFFFFFFFFF',
]


def is_junk(line):
    stripped = line.strip()
    if not stripped:
        return False
    for pat in SKIP_PATTERNS:
        if pat.lower() in stripped.lower():
            return True
    if len(stripped) <= 2 and stripped != '-':
        return True
    return False


def parse_date(line):
    line = line.strip()
    m = re.search(
        r'(\d{1,2})\s+(\w+)\s+(\d{4})\s*[-–]\s*(\d{1,2})[Hh:](\d{2})',
        line, re.IGNORECASE
    )
    if not m:
        return None
    day_num = int(m.group(1))
    month_str = m.group(2).lower()
    year = int(m.group(3))
    hour = int(m.group(4))
    minute = int(m.group(5))
    month = MOIS.get(month_str)
    if not month:
        return None
    try:
        dt = datetime.datetime(year, month, day_num, hour, minute)
        return dt.replace(tzinfo=PARIS)
    except ValueError:
        return None


def parse_file(filepath, skip_j1=False):
    text = Path(filepath).read_text(encoding='utf-8', errors='replace')
    lines = text.splitlines()

    matches = []
    current_journee = None
    current_date = None
    buffer = []
    in_data = False

    def flush_buffer():
        teams = [l.strip() for l in buffer if l.strip() and l.strip() != '-']
        if len(teams) >= 2 and current_date and current_journee:
            matches.append({
                'journee':   current_journee,
                'date_time': current_date,
                'home':      teams[0],
                'away':      teams[1],
            })
        buffer.clear()

    i = 0
    while i < len(lines):
        raw = lines[i]
        line = raw.strip()

        m_j = re.match(r'^Journée\s+(\d+)$', line, re.IGNORECASE)
        if m_j:
            flush_buffer()
            current_journee = int(m_j.group(1))
            in_data = True
            i += 1
            continue

        if not in_data:
            i += 1
            continue

        if line.lower() in ('fff', 'le foot amateur') or 'FFFFFFFFFFFF' in line:
            flush_buffer()
            break

        parsed_dt = parse_date(line)
        if parsed_dt:
            flush_buffer()
            current_date = parsed_dt
            i += 1
            continue

        if is_junk(raw) and line != '-':
            i += 1
            continue

        if not line:
            i += 1
            continue

        if in_data:
            buffer.append(line)

        i += 1

    flush_buffer()

    if skip_j1:
        matches = [m for m in matches if m['journee'] != 1]

    return matches


class Command(BaseCommand):
    help = 'Importe un calendrier FFF copié depuis occitanie.fff.fr'

    def _get_or_create_club(self, fff_name, all_clubs):
        """
        Cherche un club existant par matching flou.
        Si trouvé → réutilise. Sinon → crée.
        """
        found = find_club(fff_name, all_clubs)
        if len(found) == 1:
            return found[0]
        # Plusieurs matchs ou aucun → crée un nouveau club
        club = Club.objects.create(name=fff_name, city='', logo_url='')
        all_clubs.append(club)
        return club

    def add_arguments(self, parser):
        parser.add_argument('fichier', type=str, help='Chemin vers le fichier .txt')
        parser.add_argument('--category',      required=True, help='Ex: U18')
        parser.add_argument('--season',        required=True, help='Ex: 2026/2027')
        parser.add_argument('--group',         required=True, help='Ex: Poule A')
        parser.add_argument('--dry-run',       action='store_true')
        parser.add_argument('--skip-j1',       action='store_true',
                            help='Ignore la Journée 1 (déjà importée)')
        parser.add_argument('--create-teams',  action='store_true',
                            help='Crée automatiquement les clubs et équipes manquants')

    def handle(self, *args, **options):
        filepath     = options['fichier']
        category     = options['category']
        season       = options['season']
        group        = options['group']
        dry_run      = options['dry_run']
        skip_j1      = options['skip_j1']
        create_teams = options['create_teams']

        if not Path(filepath).exists():
            self.stdout.write(self.style.ERROR(f'Fichier introuvable : {filepath}'))
            return

        self.stdout.write(f'📂 Lecture de {filepath}…')
        raw_matches = parse_file(filepath, skip_j1=skip_j1)
        self.stdout.write(f'   → {len(raw_matches)} matchs détectés\n')

        created = skipped_dup = skipped_team = teams_created = 0
        errors = []
        teams_to_create = set()  # pour dry-run avec --create-teams

        all_teams = list(Team.objects.filter(
            category__iexact=category, season=season
        ))
        all_clubs = list(Club.objects.all())  # pour fuzzy-match clubs existants
        self.stdout.write(f'   → {len(all_teams)} équipes trouvées en base pour {category} {season}\n')

        for m in raw_matches:
            home_name = m['home']
            away_name = m['away']

            home_candidates = find_team(home_name, all_teams)
            away_candidates = find_team(away_name, all_teams)

            # ── Mode SANS create-teams : comportement d'origine ──────────────
            if not create_teams:
                if len(home_candidates) != 1 or len(away_candidates) != 1:
                    msg = (
                        f'J{m["journee"]} — Équipe non trouvée : '
                        f'"{home_name}" ({len(home_candidates)}) vs '
                        f'"{away_name}" ({len(away_candidates)})'
                    )
                    self.stdout.write(self.style.WARNING(f'  ⚠️  {msg}'))
                    errors.append(msg)
                    skipped_team += 1
                    continue
                home_team = home_candidates[0]
                away_team = away_candidates[0]

            # ── Mode AVEC create-teams ────────────────────────────────────────
            else:
                # Ambigu = plusieurs résultats → on ne sait pas laquelle choisir
                if len(home_candidates) > 1 or len(away_candidates) > 1:
                    msg = (
                        f'J{m["journee"]} — Ambigu : '
                        f'"{home_name}" ({len(home_candidates)}) vs '
                        f'"{away_name}" ({len(away_candidates)})'
                    )
                    self.stdout.write(self.style.WARNING(f'  ⚠️  {msg}'))
                    errors.append(msg)
                    skipped_team += 1
                    continue

                if dry_run:
                    # Simule la création sans rien écrire
                    if not home_candidates:
                        teams_to_create.add(home_name)
                    if not away_candidates:
                        teams_to_create.add(away_name)
                    h = home_candidates[0].name if home_candidates else f'[NEW] {home_name}'
                    a = away_candidates[0].name if away_candidates else f'[NEW] {away_name}'
                    self.stdout.write(
                        f'  [DRY] J{m["journee"]:02d} '
                        f'{m["date_time"].strftime("%d/%m %H:%M")} {h} vs {a}'
                    )
                    created += 1
                    continue  # pas de doublon-check en dry-run

                # Création réelle des équipes manquantes
                if not home_candidates:
                    club = self._get_or_create_club(home_name, all_clubs)
                    home_team = Team.objects.create(
                        club=club, name=home_name,
                        category=category, group_name=group, season=season,
                    )
                    all_teams.append(home_team)
                    teams_created += 1
                    self.stdout.write(f'  🆕 Équipe créée : {home_name} (club: {club.name})')
                else:
                    home_team = home_candidates[0]

                if not away_candidates:
                    club = self._get_or_create_club(away_name, all_clubs)
                    away_team = Team.objects.create(
                        club=club, name=away_name,
                        category=category, group_name=group, season=season,
                    )
                    all_teams.append(away_team)
                    teams_created += 1
                    self.stdout.write(f'  🆕 Équipe créée : {away_name} (club: {club.name})')
                else:
                    away_team = away_candidates[0]

            # ── Doublon ? ────────────────────────────────────────────────────
            if Match.objects.filter(
                home_team=home_team, away_team=away_team,
                date_time=m['date_time']
            ).exists():
                self.stdout.write(
                    f'  ⏭  J{m["journee"]} {home_name} vs {away_name} — déjà en base'
                )
                skipped_dup += 1
                continue

            label = (
                f'  J{m["journee"]:02d} {m["date_time"].strftime("%d/%m %H:%M")} '
                f'{home_team.name} vs {away_team.name}'
            )

            if dry_run:
                self.stdout.write(f'  [DRY] {label}')
            else:
                Match.objects.create(
                    home_team=home_team,
                    away_team=away_team,
                    category=category,
                    season=season,
                    group_name=group,
                    matchday=m['journee'],
                    date_time=m['date_time'],
                    status='scheduled',
                    source='manual',
                )
                self.stdout.write(f'  ➕{label}')
            created += 1

        # ── Résumé ───────────────────────────────────────────────────────────
        mode = '[DRY-RUN] ' if dry_run else ''
        self.stdout.write('')

        if dry_run and create_teams and teams_to_create:
            self.stdout.write(self.style.SUCCESS(
                f'{mode}🆕 {len(teams_to_create)} équipes seraient créées :'
            ))
            for t in sorted(teams_to_create):
                self.stdout.write(f'       • {t}')

        if not dry_run and teams_created:
            self.stdout.write(self.style.SUCCESS(
                f'🆕 {teams_created} équipes créées'
            ))

        self.stdout.write(self.style.SUCCESS(
            f'{mode}✅ {created} créés — '
            f'{skipped_dup} doublons — '
            f'{skipped_team} équipes introuvables'
        ))

        if errors:
            self.stdout.write(self.style.WARNING('\nÉquipes à corriger :'))
            for e in errors:
                self.stdout.write(f'  • {e}')
