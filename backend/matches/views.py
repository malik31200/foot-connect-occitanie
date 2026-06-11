from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Match
from .serializers import MatchSerializer


def is_admin(user):
    return user.is_authenticated and user.role == 'admin'


class MatchViewSet(viewsets.ModelViewSet):
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

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