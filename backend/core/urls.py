# backend/core/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView # Import TokenRefreshView here for convenience

urlpatterns = [
    # --- Authentication URLs ---
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'), # Endpoint for getting access/refresh tokens
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Endpoint for refreshing access tokens
    path('profile/', views.UserProfileView.as_view(), name='user_profile'), # Authenticated user's profile

    # --- Category CRUD URLs ---
    path('categories/', views.CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category_detail'),

    # --- Course CRUD URLs ---
    path('courses/', views.CourseListCreateView.as_view(), name='course_list_create'),
    path('courses/<int:pk>/', views.CourseDetailView.as_view(), name='course_detail'),
]