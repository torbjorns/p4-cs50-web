import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse, Http404
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

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

    # Create post in databased
    post = Post(
        body=body,
        author=request.user
    )

    try:
        post.save()
    except Exception as e:
        print(e)

    return JsonResponse({"message": "Post Created successfully."}, status=201)

@login_required
def post_list(request, post_list):

    # Filter emails returned based on post_list
    if post_list == "all":
        posts = Post.objects.filter()
        posts = posts.order_by("-timestamp").all()
        print(posts[0].body)
        posts_dict = [post_to_dict(post) for post in posts]
        return JsonResponse(posts_dict, safe=False)
    else:
        return JsonResponse({"error": "Invalid post_list."}, status=400)

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

        user_data = {
            "username": user.username
        }

        return JsonResponse(user_data);

    except User.DoesNotExist:
        raise Http404("User does not exist.")


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