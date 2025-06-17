from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'meals', views.MealViewSet)
router.register(r'plans', views.MealPlanViewSet, basename='mealplan')
router.register(r'ingredients', views.IngredientViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 