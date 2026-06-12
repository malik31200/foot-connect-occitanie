from django.core.management.base import BaseCommand
from matches.models import Match
from standings.tasks import recalcul_standing


class Command(BaseCommand):
    help = 'Recalcule tous les classements depuis les matchs terminés'

    def handle(self, *args, **kwargs):
        # Retrieve all standings from the finished matches
        poules = Match.objects.filter(
            status='finished'    
        ).values('category', 'season', 'group_name').distinct()

        total = poules.count()
        self.stdout.write(f"{total} poules à recalculer...")

        for i, poule in enumerate(poules, 1):
            recalcul_standing(
                poule['category'],
                poule['season'],
                poule['group_name'],
            )
            self.stdout.write(f"[{i}/{total}] {poule['category']} - {poule['group_name']}")

        self.stdout.write(self.style.SUCCESS('Classements recalculés avec succès.'))
        