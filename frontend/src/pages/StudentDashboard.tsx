import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BookOpen, FileText, Clock, GraduationCap, ArrowRight, Calendar } from 'lucide-react';
import type { Course, Assignment, Quiz, Submission } from '@/types';

interface DashboardData {
  enrolledCourses: Course[];
  pendingAssignments: Assignment[];
  upcomingQuizzes: Quiz[];
  recentGrades: Submission[];
  stats: {
    totalEnrolled: number;
    pendingAssignments: number;
    upcomingQuizzes: number;
  };
}

export function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStudent();
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your learning overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/courses')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalEnrolled}</div>
            <p className="text-xs text-muted-foreground">Click to view all courses</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/courses')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">Assignments waiting for submission</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/courses')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Quizzes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.upcomingQuizzes}</div>
            <p className="text-xs text-muted-foreground">Quizzes you haven't taken yet</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Courses you're enrolled in</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.enrolledCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrolled courses yet.</p>
            ) : (
              <div className="space-y-4">
                {data.enrolledCourses.map((course) => (
                  <div
                    key={course._id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        By {course.teacher_id.name}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {course.enrolled_students.length} students
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Assignments</CardTitle>
                <CardDescription>Assignments waiting for your submission</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.pendingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending assignments. Great job!</p>
            ) : (
              <div className="space-y-4">
                {data.pendingAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/courses/${assignment.course_id._id}`)}
                  >
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.course_id.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(assignment.deadline)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Quizzes</CardTitle>
                <CardDescription>Quizzes you haven't taken yet</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming quizzes.</p>
            ) : (
              <div className="space-y-4">
                {data.upcomingQuizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/courses/${quiz.course_id._id}`)}
                  >
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {quiz.course_id.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {quiz.duration_minutes} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Grades</CardTitle>
                <CardDescription>Your latest assignment scores</CardDescription>
              </div>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {data.recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recentGrades.map((grade) => (
                  <div
                    key={grade._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{grade.assignment_id.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {formatDate(grade.submission_time)}
                      </p>
                    </div>
                    <Badge variant={grade.grade && grade.grade >= (grade.assignment_id.max_score / 2) ? 'default' : 'destructive'}>
                      {grade.grade} / {grade.assignment_id.max_score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
