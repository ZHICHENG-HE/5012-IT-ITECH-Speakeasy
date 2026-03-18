from django.contrib.auth import get_user_model
from .models import Course, Module, Assignment, Submission, Message, Vocabulary
from rest_framework import serializers
from django.utils.timezone import now

# Get CustomUser from speakeasy/settings.py
User = get_user_model()

# User data
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Get fields from front-end
        fields = ['id', 'username', 'email', 'role', 'password']
        # Only write password; keep safe
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Encryption password
        user = User.objects.create_user(**validated_data)
        return user
    
# Course data pass
class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source = 'teacher.username')
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'teacher_name']

# Module data pass
class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'video_url', 'sequence_order']

# Course Detail data pass
class CourseDetailSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source = 'teacher.username')
    modules = ModuleSerializer(many = True, read_only = True)
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'teacher_name', 'modules']

# Assignment data pass
class AssignmentSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='module.course.title', read_only=True)

    grade = serializers.SerializerMethodField()
    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'due_date', 'course_name', 'status', 'points', 'grade']

    def get_status(self, obj):
        request = self.context.get('request')
        
        if request and hasattr(request, 'user') and request.user.role == 'student':
            if Submission.objects.filter(assignment=obj, student=request.user).exists():
                return 'completed'
            if obj.due_date and obj.due_date < now().date():
                return 'overdue'
                
        return 'pending'
    
    def get_grade(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.role == 'student':
            submission = Submission.objects.filter(assignment=obj, student=request.user).first()
            if submission and submission.grade is not None:
                return submission.grade
            
        return None

# Assignment Module Dropdown data pass
class ModuleDropdownSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source='course.title')
    class Meta:
        model = Module
        fields = ['id', 'title', 'course_title']

# Student assignment data pass
class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'file', 'submission_date']
        read_only_fields = ['student', 'submission_date']

# Teacher Submission Grade data pass
class TeacherSubmissionSerializer(serializers.ModelSerializer):
    # Load student data
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    
    # change submission_date to submitted_at
    submitted_at = serializers.DateTimeField(source='submission_date', format="%Y-%m-%d %H:%M", read_only=True)
    # Generate download links
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = ['id', 'assignment_title', 'student_name', 'student_email', 'file_url', 'submitted_at', 'grade', 'feedback']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url)
        return '#'

# Message data pass
class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 'content', 'timestamp']

# Vocabulary data pass
class VocabularySerializer(serializers.ModelSerializer):
    class Meta:
        model = Vocabulary
        fields = ['id', 'word', 'meaning', 'added_date']