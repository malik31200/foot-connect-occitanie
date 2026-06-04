# Sprint 1 — Authentication JWT

## What was built and why

---

## 1. Overview

Sprint 1 implements the authentication system — the foundation every other feature depends on. No social feed, no match results, no admin panel can work without knowing **who** is making the request and **what they're allowed to do**.

**Endpoints built:**

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Create a new account |
| POST | `/api/auth/login` | Public | Login → get access + refresh tokens |
| POST | `/api/auth/refresh` | Public | Get a new access token |
| GET | `/api/auth/me` | Authenticated | Get current user info |

---

## 2. Custom User model

Django ships with a built-in `User` model. We didn't use it directly — we created a custom one that inherits from it.

**Why?** If you use Django's default User and later need to add fields (`role`, `avatar_url`), it becomes very hard to do after the first migration. Creating a custom model from the start gives you full flexibility.

**Rule:** Always create a custom User model before the first migration. Never after.

### `backend/users/models.py`

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    avatar_url = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
```

**Key points:**
- `AbstractUser` : keeps everything Django provides (password hashing, permissions...) and lets us add fields
- `email unique=True` : email is the login identifier, not username
- `USERNAME_FIELD = 'email'` : tells Django to use email for authentication
- `role` : controls what the user can do (`user` or `admin`)

### Telling Django to use our model (`settings.py`)

```python
AUTH_USER_MODEL = 'users.User'
```

Without this line, Django ignores your custom model entirely.

---

## 3. Serializers

A serializer is the translator between Python objects and JSON.

- **Incoming request** → serializer validates and converts JSON to Python
- **Outgoing response** → serializer converts Python object to JSON

### `backend/users/serializers.py`

```python
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(...)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
```

**Key points:**
- `write_only=True` : password is never returned in any API response
- `validate_password` : Django checks password strength automatically
- `create_user()` : hashes the password before storing it — never store plain text passwords
- `UserSerializer` : used for `/me` — never exposes the password, even hashed

---

## 4. Views (endpoints logic)

### `backend/users/views.py`

**RegisterView** — public endpoint, validates data, creates user, returns profile:
```python
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

**LoginView** — verifies credentials, returns JWT tokens:
```python
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({'detail': 'Email ou mot de passe incorrect.'}, status=401)
        refresh = RefreshToken.for_user(user)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})
```

**MeView** — protected endpoint, only accessible with a valid token:
```python
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
```

**`AllowAny` vs `IsAuthenticated`:**
- `AllowAny` : anyone can call this endpoint (register, login)
- `IsAuthenticated` : requires a valid JWT token in the `Authorization: Bearer <token>` header

---

## 5. JWT Configuration (`settings.py`)

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

**How JWT works in this project:**

```
1. User logs in → receives access_token (15min) + refresh_token (7 days)
2. User sends requests with: Authorization: Bearer <access_token>
3. After 15min, access_token expires
4. User sends refresh_token to /api/auth/refresh → gets a new access_token
5. After 7 days, refresh_token expires → user must log in again
```

---

## 6. URL routing

### `backend/users/urls.py`
```python
urlpatterns = [
    path('register', RegisterView.as_view()),
    path('login', LoginView.as_view()),
    path('refresh', TokenRefreshView.as_view()),  # provided by simplejwt
    path('me', MeView.as_view()),
]
```

### `backend/config/urls.py`
```python
urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
]
```

Any request to `/api/auth/...` is routed to `users/urls.py`.

---

## 7. Tests

5 tests written and passing:

```
test_register             — creates a user, checks 201 + correct data
test_login                — logs in, checks 200 + access/refresh tokens present
test_bad_password         — wrong password returns 401
test_me_authentifie       — authenticated user gets their profile
test_me_no_authenticated  — unauthenticated request returns 401
```

Run tests:
```bash
docker compose exec web python manage.py test users
```

Expected output:
```
Found 5 test(s).
.....
Ran 5 tests in 1.742s
OK
```

---

## 8. Django app structure

```
backend/users/
├── models.py       ← User model (tables)
├── serializers.py  ← JSON ↔ Python translation
├── views.py        ← endpoint logic
├── urls.py         ← URL routing for this app
├── admin.py        ← registers User in Django admin interface
├── tests.py        ← unit + integration tests
└── migrations/
    └── 0001_initial.py  ← generated migration (creates users table)
```

---

## 9. File permissions note (WSL + Docker)

Files created by Docker are owned by `root`. To edit them from VSCode on WSL:

```bash
sudo chown -R $USER:$USER backend/users/
```

---

## Next step: Sprint 2a — FFF Scraper (backend)

Build the Django `scraper` app:
- Connect to the FFF API (`api-dofa.fff.fr`)
- Sync clubs, teams, matches for Occitanie (cg_no=77)
- Implement INSERT / UPDATE / skip (is_locked) logic
- Log every sync in SYNC_LOG
- Celery Beat automatic scheduling
