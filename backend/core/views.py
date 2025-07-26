# backend/core/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import Category, Course
from .serializers import (
    RegisterSerializer, UserSerializer, CategorySerializer, CourseSerializer
)

# --- User Authentication Views ---

class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Allows anyone to register.
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT Token Obtain Pair View.
    Returns access and refresh tokens upon successful login.
    """
    permission_classes = (permissions.AllowAny,)
    # By default, TokenObtainPairSerializer is used, which takes username/password.
    # If you need custom fields in the token payload, you'd override get_serializer_class here.

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving and updating the authenticated user's profile.
    Only authenticated users can access their own profile.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        """
        Returns the User instance associated with the current request's authentication token.
        """
        return self.request.user

# --- Category CRUD Views ---

class CategoryListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing all categories and creating a new category.
    - GET: Anyone can list categories.
    - POST: Only authenticated users can create categories.
    """
    queryset = Category.objects.all().order_by('name') # Order by name for consistent listing
    serializer_class = CategorySerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a single category.
    - GET: Anyone can retrieve a category.
    - PUT/PATCH/DELETE: Only authenticated users can update/delete categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

# --- Course CRUD Views ---

class CourseListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing all courses and creating a new course.
    - GET: Anyone can list courses.
    - POST: Only authenticated users can create courses. The instructor is automatically set to the logged-in user.
    """
    queryset = Course.objects.all().order_by('-created_at') # Order by newest first
    serializer_class = CourseSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def perform_create(self, serializer):
        """
        Override to automatically set the 'instructor' field of the Course
        to the user who made the request.
        """
        if self.request.user.is_authenticated:
            serializer.save(instructor=self.request.user)
        else:
            # This case should ideally be prevented by permissions.IsAuthenticated,
            # but as a fallback, raise an error if an unauthenticated user somehow bypasses it.
            raise permissions.PermissionDenied("Authentication required to create a course.")

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a single course.
    - GET: Anyone can retrieve a course.
    - PUT/PATCH/DELETE: Only the instructor (owner) of the course can update/delete it.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        """
        Ensure that for update/delete operations, the user is the instructor of the course.
        For retrieve (GET), any user (or unauthenticated) can view.
        """
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # For modification, filter to ensure only the owner can target their courses
            return self.queryset.filter(instructor=self.request.user)
        return self.queryset # For GET, return all courses initially, then DRF applies obj permissions

    def get_object(self):
        """
        Explicitly check object-level permission for update/delete.
        DRF's `retrieve_update_destroy_api_view` handles `get_object()` which calls check_object_permissions.
        However, the `get_queryset` above handles the filtering for PUT/PATCH/DELETE
        for the common case where you want to restrict *which* objects they can even attempt to modify.
        """
        obj = super().get_object()
        # Additional check for non-GET methods to ensure only owner modifies
        if self.request.method in ['PUT', 'PATCH', 'DELETE'] and obj.instructor != self.request.user:
            raise permissions.PermissionDenied("You do not have permission to modify this course as you are not the instructor.")
        return obj