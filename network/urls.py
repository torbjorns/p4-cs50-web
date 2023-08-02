
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("compose", views.compose, name="compose"),
    path("posts/<str:post_list>", views.post_list, name="post_list"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("follow/<str:username>", views.follow, name="follow"),
    path("like_post/<str:post_id>", views.like_post, name="like_post"),
    path('followers/<str:username>', views.followers, name='followers'),
    path('get_logged_in_username/', views.get_logged_in_username, name='get_logged_in_username')
]
