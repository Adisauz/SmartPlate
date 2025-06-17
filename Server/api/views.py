from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Meal, MealPlan, MealPlanItem, Ingredient
from .serializers import (
    MealSerializer, MealPlanSerializer, MealPlanItemSerializer,
    IngredientSerializer
)

class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]

class MealPlanViewSet(viewsets.ModelViewSet):
    serializer_class = MealPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_meal(self, request, pk=None):
        meal_plan = self.get_object()
        serializer = MealPlanItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(meal_plan=meal_plan)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticated] 