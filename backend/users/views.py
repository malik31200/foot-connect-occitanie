from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import User, PasswordResetToken
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, UpdateProfileSerializer
from interactions.models import Follow
import secrets
import requests as http_requests


def send_reset_email(to_email, code):
    """Envoie un email de réinitialisation via l'API Resend."""
    try:
        resp = http_requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {settings.RESEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'from': 'Foot Connect Occitanie <noreply@footconnect-occitanie.fr>',
                'to': [to_email],
                'subject': 'Réinitialisation de ton mot de passe – Foot Connect',
                'html': f'''
                    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
                        <h1 style="color:#E4002B;margin-bottom:8px;">Foot Connect Occitanie</h1>
                        <p style="color:#5C564F;margin-bottom:24px;">Tu as demandé à réinitialiser ton mot de passe.</p>
                        <div style="background:#F6F3EE;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                            <p style="margin:0 0 8px;color:#5C564F;font-size:14px;">Ton code (valable 15 minutes) :</p>
                            <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#E4002B;">{code}</span>
                        </div>
                        <p style="color:#A8A29B;font-size:13px;">Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
                    </div>
                ''',
            },
            timeout=10,
        )
        return resp.status_code == 200
    except Exception:
        return False


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {'detail': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            # Supprimer les anciens tokens
            PasswordResetToken.objects.filter(user=user).delete()
            # Générer un code à 6 chiffres
            code = str(secrets.randbelow(900000) + 100000)
            PasswordResetToken.objects.create(user=user, code=code)
            send_reset_email(user.email, code)
        except User.DoesNotExist:
            pass  # Toujours répondre 200 pour ne pas révéler si l'email existe

        return Response({'detail': 'Si cet email est enregistré, un code a été envoyé.'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '')

        if not all([email, code, new_password]):
            return Response({'detail': 'Tous les champs sont requis.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'detail': 'Le mot de passe doit faire au moins 6 caractères.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            token = PasswordResetToken.objects.get(user=user, code=code)
        except (User.DoesNotExist, PasswordResetToken.DoesNotExist):
            return Response({'detail': 'Code invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if not token.is_valid():
            token.delete()
            return Response({'detail': 'Code expiré. Demande un nouveau code.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        token.delete()

        return Response({'detail': 'Mot de passe mis à jour avec succès.'})


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        serializer = UserProfileSerializer(user)
        data = serializer.data
        data['is_following'] = Follow.objects.filter(
            follower=request.user, following=user
        ).exists()
        return Response(data)
