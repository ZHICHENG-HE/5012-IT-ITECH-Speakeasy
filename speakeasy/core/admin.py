from django.contrib import admin

from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Course, Module, Assignment, Submission, Vocabulary

class CustomUserAdmin(UserAdmin):
    # Role
    fieldsets = UserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )

# Register the table to the Back-end
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Course)
admin.site.register(Module)
admin.site.register(Assignment)
admin.site.register(Submission)
admin.site.register(Vocabulary)
