# backend/core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User # Django's built-in User model
from .models import Category, Course

# --- User-related Serializers ---

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model to display profile information.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('username', 'email') # Username/email often not directly editable via profile view

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration. Handles creating a new user with hashed password.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

# --- Category Serializer ---

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model.
    """
    class Meta:
        model = Category
        fields = '__all__'

# --- Course Serializer ---

class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for the Course model.
    Includes read-only fields for category name and instructor username for display.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    instructor_username = serializers.CharField(source='instructor.username', read_only=True)

    class Meta:
        model = Course
        fields = (
            'id', 'category', 'category_name', 'instructor', 'instructor_username',
            'title', 'description', 'price', 'duration_hours',
            'created_at', 'updated_at'
        )
        # 'instructor' field will be set automatically by the view on creation/update,
        # so it's read-only for incoming data from the frontend's perspective.
        read_only_fields = ('instructor',)