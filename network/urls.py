
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("compose", views.compose, name="compose"),
    path("posts/<str:post_list>", views.post_list, name="post_list"),
    path("edit_post/<str:post_id>", views.edit_post, name="edit_post"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("follow/<str:username>", views.follow, name="follow"),
    path("like_post/<str:post_id>", views.like_post, name="like_post"),
    path('followers/<str:username>', views.followers, name='followers'),
    path('get_logged_in_username/', views.get_logged_in_username, name='get_logged_in_username'),
    path('users_who_liked_post/<int:post_id>/', views.users_who_liked_post, name='users_who_liked_post')
]
