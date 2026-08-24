"""
Fusionne les clubs en double créés par --create-teams.

Cas 1 : Club MAJUSCULES vs club FFF casse mixte (ex: "L UNION ST JEAN FC" → "L'Union St Jean FC")
Cas 2 : Club réserve "XYZ 2" vs club principal "XYZ" (ex: "ALES OL 2" → "ALES OL")

Usage :
    python manage.py merge_duplicate_clubs [--dry-run]
"""

import re
import unicodedata
from django.core.management.base import BaseCommand
from clubs.models import Club
from teams.models import Team


def normalize(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    s = s.lower().replace("'", " ").replace("-", " ")
    return ' '.join(s.split())


def is_auto_created(name):
    """Retourne True si le nom est en MAJUSCULES (auto-créé depuis les .txt)."""
    stripped = name.strip()
    return stripped == stripped.upper() and any(c.isalpha() for c in stripped)


def fuzzy_match(name, candidates):
    """Retourne les candidats dont le nom normalisé correspond à name."""
    key = normalize(name)
    words = [w for w in key.split() if len(w) >= 2]
    if not words:
        return []
    result = []
    for c in candidates:
        db_norm = normalize(c.name)
        hits = sum(1 for w in words if w in db_norm)
        threshold = len(words) if len(words) <= 3 else 3
        if hits >= threshold:
            result.append(c)
    return result


class Command(BaseCommand):
    help = 'Fusionne les clubs en double (MAJUSCULES vs FFF, et clubs réserve "2")'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        mode = '[DRY-RUN] ' if dry_run else ''
        total_deleted = total_merged = 0

        # ── CAS 1 : MAJUSCULES → casse mixte FFF ─────────────────────────────
        self.stdout.write('── Cas 1 : clubs MAJUSCULES vs clubs FFF (casse mixte) ──')
        all_clubs = list(Club.objects.all())
        auto_clubs  = [c for c in all_clubs if is_auto_created(c.name)]
        proper_clubs = [c for c in all_clubs if not is_auto_created(c.name)]

        self.stdout.write(f'{len(auto_clubs)} clubs MAJUSCULES / {len(proper_clubs)} clubs FFF\n')

        deleted1 = merged1 = 0
        for club in auto_clubs:
            candidates = fuzzy_match(club.name, proper_clubs)
            if len(candidates) > 1:
                self.stdout.write(self.style.WARNING(
                    f'  ⚠️  Ambigu "{club.name}" → {[c.name for c in candidates]}'
                ))
                continue
            if len(candidates) == 0:
                continue

            real_club = candidates[0]
            teams = Team.objects.filter(club=club)
            count = teams.count()
            self.stdout.write(f'{mode}🔀 "{club.name}" → "{real_club.name}" ({count} équipe(s))')
            if not dry_run:
                teams.update(club=real_club)
                club.delete()
                deleted1 += 1
            merged1 += count

        self.stdout.write(self.style.SUCCESS(
            f'{mode}✅ Cas 1 : {deleted1} clubs supprimés — {merged1} équipes re-liées\n'
        ))
        total_deleted += deleted1
        total_merged  += merged1

        # ── CAS 2 : "XYZ 2" → "XYZ" (clubs réserve) ─────────────────────────
        self.stdout.write('── Cas 2 : clubs réserve "NOM 2" → club principal "NOM" ──')
        # Recharge après les suppressions du cas 1
        all_clubs = list(Club.objects.all())

        reserve_pattern = re.compile(r'^(.+?)\s+2\s*$')
        deleted2 = merged2 = 0

        for club in all_clubs:
            m = reserve_pattern.match(club.name.strip())
            if not m:
                continue
            parent_name = m.group(1).strip()

            # Cherche le club parent parmi tous les autres clubs
            candidates = [
                c for c in all_clubs
                if c.id != club.id and normalize(c.name) == normalize(parent_name)
            ]
            # Si pas de match exact, essaie le fuzzy
            if not candidates:
                candidates = fuzzy_match(
                    parent_name,
                    [c for c in all_clubs if c.id != club.id]
                )
                # Exclut les clubs qui se terminent eux-mêmes par " 2"
                candidates = [c for c in candidates if not reserve_pattern.match(c.name.strip())]

            if len(candidates) != 1:
                continue

            real_club = candidates[0]
            teams = Team.objects.filter(club=club)
            count = teams.count()
            self.stdout.write(f'{mode}🔀 "{club.name}" → "{real_club.name}" ({count} équipe(s))')
            if not dry_run:
                teams.update(club=real_club)
                club.delete()
                deleted2 += 1
            merged2 += count

        self.stdout.write(self.style.SUCCESS(
            f'{mode}✅ Cas 2 : {deleted2} clubs supprimés — {merged2} équipes re-liées\n'
        ))
        total_deleted += deleted2
        total_merged  += merged2

        self.stdout.write(self.style.SUCCESS(
            f'{mode}🏁 TOTAL : {total_deleted} clubs supprimés — {total_merged} équipes re-liées'
        ))
