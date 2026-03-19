from django.db import models
from django.contrib.auth.models import AbstractUser

# User
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
    )
    role = models.CharField(max_length = 10, choices = ROLE_CHOICES, default = 'student')
    
    # Handle abstractUser conflict
    groups = models.ManyToManyField('auth.Group', related_name = 'customuser_set', blank = True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name = 'customuser_set', blank = True)

# Course
class Course(models.Model):
    title = models.CharField(max_length = 200)
    description = models.TextField()
    teacher = models.ForeignKey(CustomUser, on_delete = models.CASCADE, related_name = 'taught_courses', limit_choices_to = {'role': 'teacher'})
    students = models.ManyToManyField(CustomUser, related_name = 'enrolled_courses', limit_choices_to = {'role': 'student'}, blank = True)

    def __str__(self):
        return self.title
    
# Module
class Module(models.Model):
    # Course comprises Modules; deleting Course will delete its Modules
    course = models.ForeignKey(Course, on_delete = models.CASCADE, related_name = 'modules')
    
    title = models.CharField(max_length = 200)
    description = models.TextField(blank = True, null = True)
    video_url = models.URLField(blank = True, null = True)
    sequence_order = models.IntegerField(default =1)
    text_content = models.TextField(blank = True, null = True)

    def __str__(self):
        return f"{self.course.title} - {self.title}"

# Assignment
class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete = models.CASCADE, related_name = 'assignments')
    title = models.CharField(max_length = 200)
    description = models.TextField()
    due_date = models.DateField()
    points = models.IntegerField(default = 100)

    def __str__(self):
        return self.title

# Submission
class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete = models.CASCADE, related_name = 'submissions')
    student = models.ForeignKey(CustomUser, on_delete = models.CASCADE, limit_choices_to = {'role': 'student'})
    file = models.FileField(upload_to = 'submissions/') # file path
    submission_date = models.DateTimeField(auto_now_add = True)
    grade = models.IntegerField(null = True, blank = True)
    feedback = models.TextField(blank = True)

# Vocabulary
class Vocabulary(models.Model):
    student = models.ForeignKey(CustomUser, on_delete = models.CASCADE)
    word = models.CharField(max_length = 100)
    meaning = models.CharField(max_length = 200)
    added_date = models.DateField(auto_now_add = True)

# Message
class Message(models.Model):
    # Sender
    sender = models.ForeignKey(
        CustomUser, 
        on_delete = models.CASCADE, 
        related_name = 'sent_messages'
    )

    # Receiver
    receiver = models.ForeignKey(
        CustomUser, 
        on_delete = models.CASCADE, 
        related_name = 'received_messages'
    )
    
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add = True) # Timestamp
    

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}"