import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { coursesAPI, assignmentsAPI, quizzesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, BookOpen, FileText, Clock, Plus, ExternalLink, Users, CheckCircle } from 'lucide-react';
import type { Course, Assignment, Quiz } from '@/types';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  // Dialog states
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);

  // Form states
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    deadline: '',
    max_score: 100,
    file_url: ''
  });
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    deadline: '',
    duration_minutes: 30,
    question_set: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }]
  });
  const [newMaterial, setNewMaterial] = useState({ title: '', file_url: '' });

  useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id]);

  const loadCourseData = async () => {
    try {
      const [courseRes, assignmentsRes, quizzesRes] = await Promise.all([
        coursesAPI.getById(id!),
        assignmentsAPI.getAll({ course_id: id }),
        quizzesAPI.getAll({ course_id: id })
      ]);

      setCourse(courseRes.data);
      setAssignments(assignmentsRes.data);
      setQuizzes(quizzesRes.data);

      // Check enrollment and teacher status
      if (user) {
        setIsEnrolled(courseRes.data.enrolled_students.some((s: any) => s._id === user._id));
        setIsTeacher(courseRes.data.teacher_id._id === user._id);
      }
    } catch (error) {
      console.error('Failed to load course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignmentsAPI.create({
        course_id: id!,
        ...newAssignment,
        deadline: new Date(newAssignment.deadline).toISOString()
      });
      toast.success('Assignment created successfully');
      setIsAssignmentDialogOpen(false);
      setNewAssignment({ title: '', description: '', deadline: '', max_score: 100, file_url: '' });
      loadCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await quizzesAPI.create({
        course_id: id!,
        ...newQuiz,
        deadline: new Date(newQuiz.deadline).toISOString()
      });
      toast.success('Quiz created successfully');
      setIsQuizDialogOpen(false);
      setNewQuiz({
        title: '',
        deadline: '',
        duration_minutes: 30,
        question_set: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }]
      });
      loadCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coursesAPI.addMaterial(id!, newMaterial.title, newMaterial.file_url);
      toast.success('Material added successfully');
      setIsMaterialDialogOpen(false);
      setNewMaterial({ title: '', file_url: '' });
      loadCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add material');
    }
  };

  const handleEnroll = async () => {
    try {
      await coursesAPI.enroll(id!);
      toast.success('Enrolled successfully');
      loadCourseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const addQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      question_set: [...newQuiz.question_set, { question: '', options: ['', '', '', ''], correct_answer: 0 }]
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...newQuiz.question_set];
    updated[index] = { ...updated[index], [field]: value };
    setNewQuiz({ ...newQuiz, question_set: updated });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...newQuiz.question_set];
    updated[qIndex].options[oIndex] = value;
    setNewQuiz({ ...newQuiz, question_set: updated });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/courses')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Instructor: {course.teacher_id?.name}</span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.enrolled_students.length} students
            </span>
          </div>
        </div>
        {user?.role === 'student' && !isEnrolled && (
          <Button onClick={handleEnroll}>Enroll in Course</Button>
        )}
      </div>

      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="materials">
            <BookOpen className="mr-2 h-4 w-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FileText className="mr-2 h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <Clock className="mr-2 h-4 w-4" />
            Quizzes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {isTeacher && (
            <Button onClick={() => setIsMaterialDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          )}

          {course.materials?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No materials yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {course.materials?.map((material, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription>
                      Added on {formatDate(material.uploaded_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:underline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Material
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {isTeacher && (
            <Button onClick={() => setIsAssignmentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          )}

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No assignments yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignments.map((assignment) => (
                <Card key={assignment._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      {new Date(assignment.deadline) < new Date() && (
                        <Badge variant="destructive">Closed</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Due: {formatDate(assignment.deadline)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {assignment.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max Score: {assignment.max_score}</span>
                      {isEnrolled && !isTeacher && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/assignments/${assignment._id}/submit`)}
                          disabled={new Date(assignment.deadline) < new Date()}
                        >
                          Submit
                        </Button>
                      )}
                      {isTeacher && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/assignments/${assignment._id}/grade`)}
                        >
                          Grade
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          {isTeacher && (
            <Button onClick={() => setIsQuizDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          )}

          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No quizzes yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <Card key={quiz._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      {new Date(quiz.deadline) < new Date() && (
                        <Badge variant="destructive">Closed</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Due: {formatDate(quiz.deadline)} • {quiz.duration_minutes} minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {quiz.question_set.length} questions
                    </p>
                                       {isEnrolled && !isTeacher && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/quizzes/${quiz._id}/take`)}
                        disabled={new Date(quiz.deadline) < new Date()}
                      >
                        Take Quiz
                      </Button>
                    )}
                    {isTeacher && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/quizzes/${quiz._id}/submissions`)}
                      >
                        View Submissions
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateAssignment}>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
              <DialogDescription>Create a new assignment for this course.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={newAssignment.deadline}
                  onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={newAssignment.max_score}
                  onChange={(e) => setNewAssignment({ ...newAssignment, max_score: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Quiz Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleCreateQuiz}>
            <DialogHeader>
              <DialogTitle>Create Quiz</DialogTitle>
              <DialogDescription>Create a new quiz for this course.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  value={newQuiz.deadline}
                  onChange={(e) => setNewQuiz({ ...newQuiz, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={newQuiz.duration_minutes}
                  onChange={(e) => setNewQuiz({ ...newQuiz, duration_minutes: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-4">
                <Label>Questions</Label>
                {newQuiz.question_set.map((q, qIndex) => (
                  <Card key={qIndex}>
                    <CardContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Question {qIndex + 1}</Label>
                        <Input
                          value={q.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          placeholder="Enter question"
                          required
                        />
                      </div>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="space-y-2">
                          <Label>Option {oIndex + 1}</Label>
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            required
                          />
                        </div>
                      ))}
                      <div className="space-y-2">
                        <Label>Correct Answer (0-3)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={3}
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(qIndex, 'correct_answer', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQuizDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleAddMaterial}>
            <DialogHeader>
              <DialogTitle>Add Material</DialogTitle>
              <DialogDescription>Add a new material to this course.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>File URL</Label>
                <Input
                  value={newMaterial.file_url}
                  onChange={(e) => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                  placeholder="https://example.com/file.pdf"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMaterialDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
