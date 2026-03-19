from django.db.models import Q
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import Course, Module, Assignment, Submission, Message, CustomUser, Vocabulary
from .serializers import (
    UserSerializer, 
    CourseSerializer, 
    CourseDetailSerializer, 
    AssignmentSerializer, 
    ModuleDropdownSerializer, 
    SubmissionSerializer,
    TeacherSubmissionSerializer,
    MessageSerializer,
    VocabularySerializer
)

# Get CustomUser from speakeasy/settings.py
User = get_user_model()

# Registration API
@api_view(['POST'])
def register_user(request):
    serializer = UserSerializer(data = request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Successful, Create Token
        token, created = Token.objects.get_or_create(user = user)
        return Response({
            'token': token.key,
            'role': user.role,
            'email': user.email,
            'username': user.username
        }, status = status.HTTP_201_CREATED)
    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)

# Login API
@api_view(['POST'])
def login_user(request):
    email = request.data.get('email')
    password = request.data.get('password')

    # Try to login
    try:
        # Find user by email
        user_obj = User.objects.get(email = email)
        # Get username then proceed to verify the password
        user = authenticate(username = user_obj.username, password = password)
    except User.DoesNotExist:
        user = None

    if user is not None:
        # Password correct; send Token
        token, created = Token.objects.get_or_create(user = user)
        return Response({
            'token': token.key,
            'role': user.role,
            'email': user.email,
            'username': user.username
        })
    else:
        # Password incorrect or email not registration
        return Response({'error': 'Invalid email or password'}, status = status.HTTP_401_UNAUTHORIZED)
    
# Course API
@api_view(['GET'])
def get_courses(request):
    # Get Course from database
    courses = Course.objects.all()
    # Py -> JSON
    serializer = CourseSerializer(courses, many = True)
    return Response(serializer.data)

# Course Detail API
@api_view(['GET'])
def get_course_detail(request, pk):
    course = get_object_or_404(Course, pk = pk)
    serializer = CourseDetailSerializer(course)
    return Response(serializer.data)

# Assignment API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_assignment(request):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Permission denied. Only teachers can post assignments.'}, 
                        status=status.HTTP_403_FORBIDDEN)
    
    serializer = AssignmentSerializer(data = request.data)
    
    # Check data
    if serializer.is_valid():
        course_id = request.data.get('course')
        try:
            course_obj = Course.objects.get(id=course_id)
            serializer.save(course=course_obj)
            return Response(serializer.data, status = status.HTTP_201_CREATED)
        except Course.DoesNotExist:
            return Response({'error': 'Selected course does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
        
    return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)

# Assignment Modlule Dropdown API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_modules(request):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Only teachers can view this.'}, status=403)
    
    modules = Module.objects.filter(course__teacher = request.user)
    serializer = ModuleDropdownSerializer(modules, many = True)
    return Response(serializer.data)

# Student assignment API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assignment(request):
    # Check is it student
    if request.user.role != 'student':
        return Response({'error': 'Only students can submit assignments.'}, status = 403)
    
    # Check data
    serializer = SubmissionSerializer(data = request.data)
    if serializer.is_valid():
        serializer.save(student = request.user)
        return Response(serializer.data, status = 201)
    
    return Response(serializer.errors, status = 400)

# Get assignment list API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_assignments(request):
    assignments = Assignment.objects.all().order_by('-due_date')
    serializer = AssignmentSerializer(assignments, many=True)
    
    submissions = Submission.objects.filter(student=request.user)
    sub_dict = {sub.assignment_id: sub for sub in submissions}
    
    # Show assignment status
    data = serializer.data
    for item in data:
        sub = sub_dict.get(item['id'])
        if sub:
            item['is_completed'] = True
            item['grade'] = sub.grade
            item['feedback'] = sub.feedback
        else:
            item['is_completed'] = False
            item['grade'] = None
            item['feedback'] = None

    return Response(serializer.data)

# Get submission API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_submissions(request):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Permission denied. Only teachers can view submissions.'}, status=403)

    submissions = Submission.objects.filter(
        assignment__course__teacher=request.user
    ).order_by('-submission_date')
    # Get download link
    serializer = TeacherSubmissionSerializer(submissions, many=True, context={'request': request})
    
    return Response(serializer.data)

# Grade API
@api_view(['PATCH'])  
@permission_classes([IsAuthenticated])
def grade_submission(request, pk):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Unauthorized'}, status=403)
    
    # Get submission data
    try:
        submission = Submission.objects.get(pk=pk, assignment__course__teacher=request.user)
    except Submission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=404)

    # Save data in models
    submission.grade = request.data.get('grade')
    submission.feedback = request.data.get('feedback', '')
    submission.save()

    return Response({'message': 'Graded successfully', 'grade': submission.grade})

# Get Contacts list API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_contacts(request):
    users = CustomUser.objects.exclude(id=request.user.id).values('id', 'username', 'role', 'email')
    return Response(list(users))

# Get Message list API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, user_id):
    # Find all messages "I sent to him" or "he sent to me", sorted by date
    messages = Message.objects.filter(
        (Q(sender=request.user) & Q(receiver_id=user_id)) |
        (Q(sender_id=user_id) & Q(receiver=request.user))
    ).order_by('timestamp')
    
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

# Send new message API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    receiver_id = request.data.get('receiver_id')
    content = request.data.get('content')
    
    # Verify receiver_id and content
    if not receiver_id or not content:
        return Response({'error': 'Missing receiver or content'}, status=400)
        
    # Send message
    message = Message.objects.create(
        sender=request.user,
        receiver_id=receiver_id,
        content=content
    )
    
    serializer = MessageSerializer(message)
    return Response(serializer.data, status=201)

# Get vocabulary list API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_vocabulary(request):
    # Check is it student
    if request.user.role != 'student':
        return Response({'error': 'Only students have vocabulary books.'}, status=403)
        
    words = Vocabulary.objects.filter(student=request.user)
    
    # If empty, give student 3 words
    if not words.exists():
        Vocabulary.objects.bulk_create([
            Vocabulary(student=request.user, word="Ubiquitous", meaning="Be everywhere."),
            Vocabulary(student=request.user, word="Ephemeral", meaning="Lasting for a very short time."),
            Vocabulary(student=request.user, word="Serendipity", meaning="The occurrence of finding pleasant or valuable things by chance."),
        ])
        words = Vocabulary.objects.filter(student=request.user)
        
    serializer = VocabularySerializer(words, many=True)
    return Response(serializer.data)

# Create course API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course(request):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Only teachers can create courses.'}, status=403)
        
    title = request.data.get('title')
    description = request.data.get('description')
    
    # Check not empty
    if not title or not description:
        return Response({'error': 'Title and description are required.'}, status=400)
        
    # Insert a new course into the Course table
    new_course = Course.objects.create(
        title=title,
        description=description,
        teacher=request.user
    )
    
    # Create module if have video URL
    module_title = request.data.get('module_title')
    video_url = request.data.get('video_url')
    
    # Save module
    if module_title:
        Module.objects.create(
            course=new_course,
            title=module_title,
            description="First introductory module",
            video_url=video_url,
            sequence_order=1
        )
        
    return Response({'message': 'Course created successfully!', 'course_id': new_course.id}, status=201)

# Add vocabulary API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_vocabulary(request):
    # Check is it student
    if request.user.role != 'student':
        return Response({'error': 'Only students can add words.'}, status=403)
    
    word = request.data.get('word')
    meaning = request.data.get('meaning')
    
    # Check not empty
    if not word or not meaning:
        return Response({'error': 'Word and meaning are required.'}, status=400)
    
    # Save word
    new_word = Vocabulary.objects.create(
        student=request.user, 
        word=word, 
        meaning=meaning
    )

    return Response(VocabularySerializer(new_word).data, status=201)

# Add students to a course API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_student(request):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Only teachers can invite students.'}, status=403)
        
    course_id = request.data.get('course_id')
    student_email = request.data.get('email')
    
    # Check not empty
    if not course_id or not student_email:
        return Response({'error': 'Course ID and Student Email are required.'}, status=400)
        
    # Add student into course
    try:
        course = Course.objects.get(id=course_id, teacher=request.user)
        student = CustomUser.objects.get(email=student_email, role='student')
        
        course.students.add(student)
        
        return Response({'message': f'Success! {student.username} has been enrolled.'}, status=200)
        
    except Course.DoesNotExist:
        return Response({'error': 'Course not found or access denied.'}, status=404)
    except CustomUser.DoesNotExist:
        return Response({'error': 'No student found with this email.'}, status=404)

# Edit course API
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_course(request, pk):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Only teachers can edit courses.'}, status=403)
        
    # Check whether this is that teacher’s class
    try:
        course = Course.objects.get(pk=pk, teacher=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found or unauthorized.'}, status=404)

    # Update course
    title = request.data.get('title')
    description = request.data.get('description')

    if title:
        course.title = title
    if description:
        course.description = description

    course.save()
    
    return Response({'message': 'Course updated successfully!'}, status=200)

# Add module video URL API
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_module(request):
    # Check is it teacher
    if request.user.role != 'teacher':
        return Response({'error': 'Only teachers can add modules.'}, status=403)
        
    course_id = request.data.get('course_id')
    title = request.data.get('title')
    video_url = request.data.get('video_url', '')
    description = request.data.get('description', '')
    
    # Check empty
    if not course_id or not title:
        return Response({'error': 'Course ID and Title are required.'}, status=400)
        
    # Check whether this is that teacher’s class
    try:
        course = Course.objects.get(id=course_id, teacher=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found or unauthorized.'}, status=404)
        
    if not description:
        description = f"Module for {course.title}"
    
    # Find the modules and sort them by creation date
    last_module = Module.objects.filter(course=course).order_by('-sequence_order').first()
    next_order = (last_module.sequence_order + 1) if last_module else 1
    
    # Save data
    new_module = Module.objects.create(
        course=course,
        title=title,
        video_url=video_url,
        description=description,
        sequence_order=next_order
    )
    
    return Response({'message': 'Module added successfully!', 'module_id': new_module.id}, status=201)