from django.urls import path
from . import views

#Configure access path
urlpatterns = [
    path('register/', views.register_user, name = 'register'),
    path('login/', views.login_user, name = 'login'),
    path('courses/', views.get_courses, name = 'courses'),
    path('courses/<int:pk>/', views.get_course_detail, name='course_detail'),
    path('assignments/create/', views.create_assignment, name='create_assignment'),
    path('modules/dropdown/', views.get_teacher_modules, name='teacher_modules_dropdown'),
    path('submissions/create/', views.submit_assignment, name='submit_assignment'),
    path('assignments/', views.list_assignments, name='list_assignments'),
    path('submissions/teacher/', views.get_teacher_submissions, name='teacher_submissions'),
    path('submissions/<int:pk>/grade/', views.grade_submission, name='grade_submission'),
    path('contacts/', views.get_contacts, name='contacts'),
    path('messages/chat/<int:user_id>/', views.get_messages, name='get_messages'),
    path('messages/send/', views.send_message, name='send_message'),
    path('vocabulary/', views.get_vocabulary, name='vocabulary'),
    path('courses/new/', views.create_course, name='create_course_api'),
    path('vocabulary/add/', views.add_vocabulary, name='add_vocabulary'),
    path('courses/enroll/', views.enroll_student, name='enroll_student'),
]