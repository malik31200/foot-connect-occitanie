from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Team
from .serializers import TeamSerializer
from matches.models import Match


def is_admin(user):
    return user.is_authenticated and user.role == "admin"


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by('name')
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Team.objects.all().select_related('club').order_by('name')
        p = self.request.query_params
        if p.get('club_id'):
            queryset = queryset.filter(club_id=p['club_id'])
        if p.get('category'):
            queryset = queryset.filter(category=p['category'])
        if p.get('group_name'):
            queryset = queryset.filter(group_name=p['group_name'])
        if p.get('season'):
            queryset = queryset.filter(season=p['season'])
        return queryset

    @action(detail=True, methods=['post'])
    def set_home_venue(self, request, pk=None):
        """Applique une adresse à tous les matchs à domicile de cette équipe."""
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'}, status=status.HTTP_403_FORBIDDEN)
        team = self.get_object()
        venue = request.data.get('venue', '').strip()
        fill_empty_only = request.data.get('fill_empty_only', True)
        if not venue:
            return Response({'detail': 'Adresse vide.'}, status=status.HTTP_400_BAD_REQUEST)
        matches = Match.objects.filter(home_team=team)
        if fill_empty_only:
            matches = matches.filter(venue__isnull=True) | matches.filter(venue='')
        count = matches.update(venue=venue)
        return Response({'filled': count, 'message': f'{count} match(s) mis à jour pour {team.name}.'})
    
    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    