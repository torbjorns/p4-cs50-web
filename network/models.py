from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Post(models.Model):
    body = models.CharField(max_length=600)
    author = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name="author")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.timestamp}"
