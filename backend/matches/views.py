from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Match
from .serializers import MatchSerializer
from standings.tasks import recalcul_standing
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly



def is_admin(user):
    return user.is_authenticated and user.role == 'admin'


class MatchViewSet(viewsets.ModelViewSet):
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


    def get_queryset(self):
        # Filters: /api/matches/?category=X&season=Y&group_name=Z&status=W
        queryset = Match.objects.all().order_by('date_time')
        params = self.request.query_params

        if params.get('category'):
            queryset = queryset.filter(category=params['category'])

        
        if params.get('season'):
            queryset = queryset.filter(season=params['season'])

        
        if params.get('group_name'):
            queryset = queryset.filter(group_name=params['group_name'])

        
        if params.get('status'):
            queryset = queryset.filter(status=params['status'])
        
        return queryset
    
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
    
    @action(detail=True, methods=['patch'])
    def result(self, request, pk=None):
        # PATCH /api/matches/{id}/result — admin only
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'},
                            status=status.HTTP_403_FORBIDDEN)
            
        match = self.get_object()
        match.home_score = request.data.get('home_score', match.home_score)
        match.away_score = request.data.get('away_score', match.away_score)
        match.status = request.data.get('status', match.status)
        match.is_locked = True
        match.save()
        recalcul_standing.delay(match.category, match.season, match.group_name)
        return Response(MatchSerializer(match).data)
    
    @action(detail=True, methods=['patch'])
    def unlock(self, request, pk=None):
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'},
                            status=status.HTTP_403_FORBIDDEN)
        match = self.get_object()
        match.is_locked = False
        match.save()
        return Response({'id': match.id, 'is_locked': match.is_locked})
    
    @action(detail=False, methods=['post'])
    def fill_venues(self, request):
        """Remplit les venues manquantes depuis le stade du club de l'équipe domicile."""
        if not is_admin(request.user):
            return Response({'detail': 'Accès réservé aux administrateurs.'}, status=status.HTTP_403_FORBIDDEN)
        matches = Match.objects.filter(venue__isnull=True) | Match.objects.filter(venue='')
        filled = 0
        for match in matches:
            stadium = getattr(match.home_team.club, 'stadium', None) if match.home_team and match.home_team.club else None
            if stadium:
                match.venue = stadium
                match.save(update_fields=['venue'])
                filled += 1
        return Response({'filled': filled, 'message': f'{filled} match(s) mis à jour.'})

    @action(detail=False, methods=['get'])
    def filters(self, request):
        season = request.query_params.get('season', '2025')
        categories = list(
            Match.objects.filter(season=season)
            .values_list('category', flat=True)
            .distinct()
            .order_by('category')
        )
        return Response({'categories': categories})

    @action(detail=False, methods=['get'])
    def groups(self, request):
        season = request.query_params.get('season', '2025')
        category = request.query_params.get('category', '')
        groups = list(
            Match.objects.filter(season=season, category=category)
            .values_list('group_name', flat=True)
            .distinct()
            .order_by('group_name')
        )
        return Response({'groups': groups})
