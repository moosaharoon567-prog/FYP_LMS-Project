import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { coursesAPI, usersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Search, Plus, BookOpen, Users, ArrowRight, Trash2, UserCog } from 'lucide-react';
import type { Course, User } from '@/types';

export function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
  const [assigningCourse, setAssigningCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const params: { myCourses?: boolean; enrolled?: boolean } = {};
      if (user?.role === 'teacher') {
        params.myCourses = true;
      } else if (user?.role === 'student') {
        params.enrolled = false;
      }
      const response = await coursesAPI.getAll(params);
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await coursesAPI.create(newCourse.title, newCourse.description);
      toast.success('Course created successfully');
      setNewCourse({ title: '', description: '' });
      setIsCreateDialogOpen(false);
      loadCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await coursesAPI.enroll(courseId);
      toast.success('Enrolled successfully');
      loadCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleAssignTeacher = async () => {
    if (!assigningCourse || !selectedTeacherId) return;
    setIsAssigning(true);
    try {
      await coursesAPI.assignTeacher(assigningCourse._id, selectedTeacherId);
      toast.success('Teacher assigned successfully');
      setIsAssignTeacherOpen(false);
      loadCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign teacher');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all assignments and quizzes.')) return;
    setIsDeletingId(courseId);
    try {
      await coursesAPI.delete(courseId);
      toast.success('Course deleted successfully');
      loadCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEnrolled = (course: Course) => {
    return course.enrolled_students.filter(Boolean).some((s) => s._id === user?._id);
  };

  const isTeacher = (course: Course) => {
    return course.teacher_id?._id === user?._id;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            {user?.role === 'student'
              ? 'Browse and enroll in available courses'
              : user?.role === 'teacher'
              ? 'Manage your courses'
              : 'View all courses in the system'}
          </p>
        </div>
        {user?.role === 'teacher' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreateCourse}>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new course.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Introduction to Programming"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn..."
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Course'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No courses found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Try adjusting your search query'
              : user?.role === 'teacher'
              ? 'Create your first course to get started'
              : 'No courses available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course._id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      By {course.teacher_id?.name ?? 'Unknown'}
                    </CardDescription>
                  </div>
                  {isEnrolled(course) && <Badge>Enrolled</Badge>}
                  {isTeacher(course) && <Badge variant="secondary">Teacher</Badge>}
                  {!course.teacher_id && <Badge variant="destructive">No Teacher</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="line-clamp-3 text-sm text-muted-foreground mb-4">
                  {course.description}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.enrolled_students.length} students
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.materials?.length || 0} materials
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      View
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    {user?.role === 'student' && !isEnrolled(course) && (
                      <Button onClick={() => handleEnroll(course._id)}>Enroll</Button>
                    )}
                    {user?.role === 'admin' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Assign Teacher"
                          onClick={async () => {
                            const res = await usersAPI.getAll('teacher');
                            setTeachers(res.data);
                            setAssigningCourse(course);
                            setSelectedTeacherId('');
                            setIsAssignTeacherOpen(true);
                          }}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          title="Delete Course"
                          disabled={isDeletingId === course._id}
                          onClick={() => handleDeleteCourse(course._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Teacher Dialog */}
      <Dialog open={isAssignTeacherOpen} onOpenChange={setIsAssignTeacherOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              Assign a teacher to "{assigningCourse?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Teacher</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <option value="">Select a teacher...</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignTeacherOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTeacher} disabled={!selectedTeacherId || isAssigning}>
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
