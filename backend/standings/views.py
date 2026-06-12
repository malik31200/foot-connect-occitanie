from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Standing
from .serializers import StandingSerializer


class StandingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StandingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filters: /api/standings/?category=X&season=Y&group_name=Z
        querySet = Standing.objects.all().select_related('team')
        params = self.request.query_params

        if params.get('category'):
            querySet = querySet.filter(category=params['category'])
        if params.get('season'):
            querySet = querySet.filter(season=params['season'])
        if params.get('group_name'):
            querySet = querySet.filter(group_name=params['group_name'])

        return querySet
