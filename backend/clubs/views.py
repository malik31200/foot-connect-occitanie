from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Club
from .serializers import ClubSerializer


def is_admin(user):
    return user.is_authenticated and user.role == 'admin'


class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.all().order_by('name')
    serializer_class = ClubSerializer
    permission_classes = [IsAuthenticated]
    
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