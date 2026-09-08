import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BookOpen, Users, FileText, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import type { Course, Submission, Assignment, QuizSubmission } from '@/types';

interface DashboardData {
  myCourses: Course[];
  recentSubmissions: Submission[];
  recentAssignments: Assignment[];
  recentQuizSubmissions: QuizSubmission[];
  stats: {
    totalCourses: number;
    totalStudents: number;
    pendingGrading: number;
  };
}

export function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getTeacher();
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
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses and students.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/courses')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Click to manage courses</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/courses')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students enrolled in your courses</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => document.getElementById('recent-submissions')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingGrading}</div>
            <p className="text-xs text-muted-foreground">Submissions waiting for grading</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Courses</CardTitle>
                <CardDescription>Courses you teach</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.myCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses created yet.</p>
            ) : (
              <div className="space-y-4">
                {data.myCourses.map((course) => (
                  <div
                    key={course._id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.enrolled_students.length} students enrolled
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {course.materials?.length || 0} materials
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card id="recent-submissions">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>Latest assignment & quiz submissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentSubmissions.length === 0 && data.recentQuizSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recentSubmissions.map((submission) => (
                  <div
                    key={`a-${submission._id}`}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/assignments/${submission.assignment_id._id}/grade`)}
                  >
                    <div>
                      <p className="font-medium">{submission.assignment_id.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Assignment • By {submission.student_id?.name}
                      </p>
                    </div>
                    {submission.grade === null ? (
                      <Badge variant="destructive">Needs Grading</Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Graded
                      </Badge>
                    )}
                  </div>
                ))}
                {data.recentQuizSubmissions.map((submission) => (
                  <div
                    key={`q-${submission._id}`}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/quizzes/${submission.quiz_id._id}/submissions`)}
                  >
                    <div>
                      <p className="font-medium">{submission.quiz_id.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Quiz • By {submission.student_id?.name}
                      </p>
                    </div>
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {submission.score} / {submission.quiz_id.question_set?.length ?? '?'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Assignments you've created</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments created yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recentAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/courses/${assignment.course_id._id}`)}
                  >
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.course_id?.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Due {formatDate(assignment.deadline)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4"
                onClick={() => navigate('/courses')}
              >
                <BookOpen className="mb-2 h-5 w-5" />
                <span className="font-medium">Create Course</span>
                <span className="text-xs text-muted-foreground">Start a new course</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4"
                onClick={() => navigate('/courses')}
              >
                <FileText className="mb-2 h-5 w-5" />
                <span className="font-medium">Add Assignment</span>
                <span className="text-xs text-muted-foreground">Create new assignment</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
