import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse, Http404
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator

from .models import User, Post

def index(request):
    return render(request, "network/index.html")

@csrf_exempt
@login_required
def compose(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    # Get contents of post
    data = json.loads(request.body)
    body = data.get("body", "")

    # Create post in database
    post = Post(
        body=body,
        author=request.user
    )

    try:
        post.save()
    except Exception as e:
        print(e)

    return JsonResponse({"message": "Post Created successfully."}, status=201)

def get_logged_in_username(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)
    if request.user.is_authenticated:
        return JsonResponse({"username": request.user.username})
    else:
        return JsonResponse({"username": None})


def post_list(request, post_list):
    # Create an empty queryset
    posts = Post.objects.none()

    # Filter posts returned based on post_list
    if post_list == "all":
        posts = Post.objects.all()
    elif post_list == "following":
        posts = Post.objects.filter(author__in=request.user.following.all())
    elif post_list != "":
        try:
            author = User.objects.get(username=post_list)
            posts = Post.objects.filter(author=author.id)
        except ObjectDoesNotExist:
            return JsonResponse({"error": f"User '{post_list}' does not exist."}, status=404)
    else:
        return JsonResponse({"error": "Invalid post_list."}, status=400)

    # Order and serialize posts if posts exists
    if posts.exists():
        posts = posts.order_by("-timestamp")
        posts_dict = [post_to_dict(post) for post in posts]

        paginator = Paginator(posts_dict, 2)
        page_number = request.GET.get('page', 1)

        page_obj = paginator.get_page(page_number)

        response_data = {
            'posts': list(page_obj.object_list),
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next_page_number': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous_page_number': page_obj.previous_page_number() if page_obj.has_previous() else None,
            'num_pages': paginator.num_pages,
            'page_number': page_obj.number,
        }

        return JsonResponse(response_data)


def post_to_dict(post):
    return {
        'id': post.id,
        'body': post.body,
        'author': post.author.username,
        'timestamp': post.timestamp, 
    }

def profile(request, username):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)
    
    try:
        user = User.objects.get(username=username)

        followers = [follower.username for follower in user.followers.all()]

        user_data = {
            "username": user.username,
            "following": user.following.count(),
            "followers": followers
        }

        return JsonResponse(user_data);

    except User.DoesNotExist:
        raise Http404("User does not exist.")


def followers(request, username):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)
    
    try:
        user = User.objects.get(username=username)
        followers = [follower.username for follower in user.followers.all()]
        return JsonResponse(followers, safe=False);

    except User.DoesNotExist:
        raise Http404("User does not exist.")
    
@csrf_exempt
@login_required
def follow(request, username):
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)
    
    # Get user to follow
    try:
        user_to_follow = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User does not exist."}, status=404)

    # Get logged in user
    user = request.user

    # Check if user is already following user_to_follow
    if user.following.filter(username=username).exists():
        user.following.remove(user_to_follow)
        return JsonResponse({"message": f"Unfollowed {username}."}, status=200)
    else:
        user.following.add(user_to_follow)
        return JsonResponse({"message": f"Followed {username}."}, status=200)
    
@csrf_exempt
@login_required
def like_post(request, post_id):
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)
    
    # Get post to like
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post does not exist."}, status=404)

    # Get logged in user
    user = request.user

    # Check if user has already liked post
    if user.likes.filter(id=post_id).exists():
        user.likes.remove(post)
        return JsonResponse({"message": f"Unliked post {post_id}."}, status=200)
    else:
        user.likes.add(post)
        return JsonResponse({"message": f"Liked post {post_id}."}, status=200)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")