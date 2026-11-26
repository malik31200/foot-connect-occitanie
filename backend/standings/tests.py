from rest_framework.test import APITestCase

from config.test_helpers import make_match, make_team

from .models import Standing
from .tasks import recalcul_standing


def table(group='Poule B'):
    return list(Standing.objects.filter(group_name=group).order_by('rank').values_list('team__name', 'points'))


class StandingCalculationTests(APITestCase):
    """Calcul du classement : points, statistiques et départage des égalités."""

    def setUp(self):
        self.a, self.b, self.c = make_team('Equipe A'), make_team('Equipe B'), make_team('Equipe C')

    def test_points_win_draw_loss(self):
        make_match(self.a, self.b, 3, 0)
        make_match(self.b, self.c, 1, 1, matchday=2)
        recalcul_standing('U18', '2026/2027', 'Poule B')
        self.assertEqual(table()[0], ('Equipe A', 3))
        a = Standing.objects.get(team=self.a)
        b = Standing.objects.get(team=self.b)
        self.assertEqual((a.played, a.won, a.draw, a.lost, a.goals_for, a.goals_against, a.goal_diff, a.points),
                         (1, 1, 0, 0, 3, 0, 3, 3))
        self.assertEqual((b.played, b.won, b.draw, b.lost, b.goal_diff, b.points), (2, 0, 1, 1, -3, 1))

    def test_scheduled_matches_are_ignored(self):
        make_match(self.a, self.b, 2, 0)
        make_match(self.b, self.a)  # pas encore joué
        recalcul_standing('U18', '2026/2027', 'Poule B')
        self.assertEqual(Standing.objects.get(team=self.a).played, 1)

    def test_head_to_head_breaks_tie_before_goal_difference(self):
        # A et B ont 3 points ; B a une meilleure différence de buts générale (+4 contre +1),
        # mais A a battu B : A doit être devant (règle de la confrontation directe).
        make_match(self.a, self.b, 1, 0)
        make_match(self.b, self.c, 5, 0, matchday=2)
        recalcul_standing('U18', '2026/2027', 'Poule B')
        self.assertEqual(table(), [('Equipe A', 3), ('Equipe B', 3), ('Equipe C', 0)])
        self.assertGreater(Standing.objects.get(team=self.b).goal_diff, Standing.objects.get(team=self.a).goal_diff)

    def test_recalculation_updates_existing_lines_without_duplicates(self):
        make_match(self.a, self.b, 1, 0)
        recalcul_standing('U18', '2026/2027', 'Poule B')
        make_match(self.b, self.a, 2, 0, matchday=2)
        recalcul_standing('U18', '2026/2027', 'Poule B')
        self.assertEqual(Standing.objects.filter(team=self.a).count(), 1)
        self.assertEqual(Standing.objects.get(team=self.a).played, 2)

    def test_standings_endpoint_is_public_and_sorted(self):
        make_match(self.a, self.b, 0, 2)
        recalcul_standing('U18', '2026/2027', 'Poule B')
        response = self.client.get('/api/standings/', {'category': 'U18', 'season': '2026/2027', 'group_name': 'Poule B'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row['team_name'] for row in response.data], ['Equipe B', 'Equipe A'])
