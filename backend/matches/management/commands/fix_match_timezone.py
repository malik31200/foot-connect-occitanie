from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand

from matches.models import Match

PARIS = ZoneInfo('Europe/Paris')


class Command(BaseCommand):
    """
    Corrige les matchs dont l'heure a été saisie dans l'ancien formulaire admin :
    l'heure tapée (heure de Paris) avait été enregistrée comme de l'UTC.
    On relit donc l'heure stockée comme une heure de Paris.

    Usage :
        python manage.py fix_match_timezone 15 18 279 --dry-run
        python manage.py fix_match_timezone 15 18 279
    """
    help = "Réinterprète l'heure UTC stockée comme une heure de Paris pour les matchs donnés."

    def add_arguments(self, parser):
        parser.add_argument('ids', nargs='+', type=int)
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, ids, dry_run, **options):
        for match in Match.objects.filter(id__in=ids).select_related('home_team', 'away_team'):
            old = match.date_time
            new = old.replace(tzinfo=None).replace(tzinfo=PARIS)
            self.stdout.write(
                f'{match.id} {match.home_team.name} - {match.away_team.name} : '
                f'{old.astimezone(PARIS):%d/%m %H:%M} -> {new:%d/%m %H:%M}'
            )
            if not dry_run:
                # update() pour ne pas toucher aux autres champs ni à is_locked
                Match.objects.filter(id=match.id).update(date_time=new)

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry-run : rien n\'a été modifié.'))
        else:
            self.stdout.write(self.style.SUCCESS('Horaires corrigés.'))
