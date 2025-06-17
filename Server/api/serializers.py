from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Meal, MealPlan, MealPlanItem, Ingredient

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = '__all__'

class MealPlanItemSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)
    meal_id = serializers.PrimaryKeyRelatedField(
        queryset=Meal.objects.all(),
        source='meal',
        write_only=True
    )

    class Meta:
        model = MealPlanItem
        fields = ('id', 'meal', 'meal_id', 'day', 'meal_type')

class MealPlanSerializer(serializers.ModelSerializer):
    items = MealPlanItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = MealPlan
        fields = ('id', 'name', 'user', 'start_date', 'end_date', 'items', 'created_at', 'updated_at') 