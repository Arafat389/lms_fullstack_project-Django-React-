# backend/core/models.py
from django.db import models
from django.contrib.auth.models import User # Django's built-in User model

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories" # Correct plural name in admin interface

    def __str__(self):
        return self.name

class Course(models.Model):
    # A course is linked to a category (ForeignKey)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='courses')
    # A course is created/taught by a User (ForeignKey to Django's User model)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taught_courses')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Allows up to 99,999,999.99
    duration_hours = models.PositiveIntegerField(blank=True, null=True) # E.g., 20 hours

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
