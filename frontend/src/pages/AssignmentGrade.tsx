import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { assignmentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, FileText, User, ExternalLink, CheckCircle } from 'lucide-react';
import type { Submission } from '@/types';

export function AssignmentGrade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadSubmissions();
    }
  }, [id]);

  const loadSubmissions = async () => {
    try {
      const response = await assignmentsAPI.getSubmissions(id!);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0) {
      toast.error('Please enter a valid grade');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignmentsAPI.grade(gradingSubmission._id, gradeNum, feedback);
      toast.success('Grade submitted successfully');
      setGradingSubmission(null);
      setGrade('');
      setFeedback('');
      loadSubmissions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startGrading = (submission: Submission) => {
    setGradingSubmission(submission);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Grade Submissions</h1>
        <p className="text-muted-foreground">
          Review and grade student submissions
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No Submissions Yet</p>
            <p className="text-sm text-muted-foreground">
              Students haven't submitted any work for this assignment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">
                        {submission.student_id.name}
                      </CardTitle>
                      <CardDescription>{submission.student_id.email}</CardDescription>
                    </div>
                  </div>
                  {submission.grade !== null ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">
                        {submission.grade} / {submission.assignment_id.max_score}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not graded</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{formatDate(submission.submission_time)}</span>
                </div>
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Submission
                </a>
                {submission.feedback && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium">Feedback:</p>
                    <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                  </div>
                )}
                <Button
                  onClick={() => startGrading(submission)}
                  variant={submission.grade !== null ? 'outline' : 'default'}
                >
                  {submission.grade !== null ? 'Edit Grade' : 'Grade Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grade Dialog */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Grade Submission</CardTitle>
              <CardDescription>
                Grading {gradingSubmission.student_id.name}'s submission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrade} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">
                    Grade (out of {gradingSubmission.assignment_id.max_score})
                  </Label>
                  <Input
                    id="grade"
                    type="number"
                    min={0}
                    max={gradingSubmission.assignment_id.max_score}
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback (optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setGradingSubmission(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Grade'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
