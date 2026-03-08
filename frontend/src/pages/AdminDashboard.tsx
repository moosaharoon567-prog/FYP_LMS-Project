import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Users, BookOpen, GraduationCap, UserCog, ArrowRight, UserPlus } from 'lucide-react';
import type { User, Course } from '@/types';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    totalCourses: number;
  };
  recentUsers: User[];
  recentCourses: Course[];
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getAdmin();
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Click to manage users</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Registered teachers</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => navigate('/courses')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">All courses in system</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Recently registered users</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users registered yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recentUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'teacher' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Courses</CardTitle>
                <CardDescription>Recently created courses</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses created yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recentCourses.map((course) => (
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

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4"
                onClick={() => navigate('/users')}
              >
                <UserPlus className="mb-2 h-5 w-5" />
                <span className="font-medium">Add User</span>
                <span className="text-xs text-muted-foreground">Create new user account</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4"
                onClick={() => navigate('/users')}
              >
                <Users className="mb-2 h-5 w-5" />
                <span className="font-medium">Manage Users</span>
                <span className="text-xs text-muted-foreground">View and edit users</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4"
                onClick={() => navigate('/courses')}
              >
                <BookOpen className="mb-2 h-5 w-5" />
                <span className="font-medium">View Courses</span>
                <span className="text-xs text-muted-foreground">Browse all courses</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col items-start p-4"
                onClick={() => navigate('/settings')}
              >
                <UserCog className="mb-2 h-5 w-5" />
                <span className="font-medium">Settings</span>
                <span className="text-xs text-muted-foreground">Manage your profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
