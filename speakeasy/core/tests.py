from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Course, Vocabulary

# Get models
User = get_user_model()

class SpeakeasyTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Teacher account test
        self.teacher = User.objects.create_user(
            username='testteacher',
            email='teacher@test.com',
            password='testpassword123',
            role='teacher'
        )

        # Student account test
        self.student = User.objects.create_user(
            username='teststudent',
            email='student@test.com',
            password='testpassword123',
            role='student'
        )

        # Course create test
        self.course = Course.objects.create(
            title='Test English Course',
            description='A course created for testing',
            teacher=self.teacher
        )

    # T1 Database test
    def test_user_roles_saved_correctly(self):
        # Save test
        self.assertEqual(self.teacher.role, 'teacher')
        self.assertEqual(self.student.role, 'student')

    def test_course_linked_to_teacher(self):
        self.assertEqual(self.course.teacher.username, 'testteacher')
        self.assertEqual(self.course.title, 'Test English Course')

    # API test
    def test_login_api_success(self):
        # Token get test
        response = self.client.post('/api/login/', {
            'email': 'student@test.com',
            'password': 'testpassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['role'], 'student')

    def test_login_api_wrong_password(self):
        # Password check test
        response = self.client.post('/api/login/', {
            'email': 'student@test.com',
            'password': 'wrongpassword'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Vocabulary API test
    def test_add_vocabulary_without_login(self):
        response = self.client.post('/api/vocabulary/add/', {
            'word': 'Apple',
            'meaning': 'A kind of red fruit'
        }, format='json')
        
        # If get 401, success
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Add vocabulary test
    def test_add_vocabulary_with_student_login(self):
        self.client.force_authenticate(user=self.student)
        
        response = self.client.post('/api/vocabulary/add/', {
            'word': 'Apple',
            'meaning': 'A kind of red fruit'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vocabulary.objects.count(), 1)
        self.assertEqual(Vocabulary.objects.first().word, 'Apple')