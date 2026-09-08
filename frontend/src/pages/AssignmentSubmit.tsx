import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { assignmentsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  FileText,
  Clock,
  Upload,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import type { Assignment } from '@/types';

interface Submission {
  _id: string;
  file_url: string;
  submission_time: string;
  grade: number | null;
  feedback: string | null;
}

export function AssignmentSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadAssignment();
    }
  }, [id]);

  const loadAssignment = async () => {
    try {
      const assignmentResponse = await assignmentsAPI.getById(id!);
      setAssignment(assignmentResponse.data);

      try {
        const submissionResponse = await assignmentsAPI.getMySubmission(id!);
        setSubmission(submissionResponse.data);
      } catch (submissionError: any) {
        // 404 simply means the student has not submitted yet.
        if (submissionError.response?.status !== 404) {
          console.error('Failed to load submission:', submissionError);
        }
        setSubmission(null);
      }
    } catch (error) {
      console.error('Failed to load assignment:', error);
      toast.error('Failed to load assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileUrl.trim()) {
      toast.error('Please enter a file URL');
      return;
    }

    setIsSubmitting(true);

    try {
      await assignmentsAPI.submit(id!, fileUrl);

      toast.success('Assignment submitted successfully');

      // Reload the assignment/submission data so the page
      // immediately changes from Submit to Submitted.
      await loadAssignment();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to submit assignment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!assignment) {
    return <div>Assignment not found</div>;
  }

  const isOverdue = new Date(assignment.deadline) < new Date();

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold">
          {submission ? 'Assignment Submission' : 'Submit Assignment'}
        </h1>
        <p className="text-muted-foreground">{assignment.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Course:</span>
            <span>{assignment.course_id.title}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Deadline:</span>
            <span className={isOverdue ? 'text-destructive' : ''}>
              {formatDate(assignment.deadline)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Max Score:</span>
            <span>{assignment.max_score}</span>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Description:
            </p>
            <p className="text-sm">{assignment.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Already submitted */}
      {submission ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>Assignment Submitted</CardTitle>
            </div>

            <CardDescription>
              Your submission was received successfully.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Submitted On
              </p>
              <p className="font-medium">
                {formatDate(submission.submission_time)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Submitted File
              </p>

              <Button
                variant="outline"
                onClick={() => window.open(submission.file_url, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Submitted File
              </Button>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Grade
              </p>

              {submission.grade !== null ? (
                <p className="text-2xl font-bold">
                  {submission.grade} / {assignment.max_score}
                </p>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">
                  Waiting for grading
                </p>
              )}
            </div>

            {submission.feedback && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Teacher Feedback
                </p>

                <div className="rounded-md border p-4">
                  <p className="text-sm">{submission.feedback}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : isOverdue ? (
        /* Not submitted + deadline passed */
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-destructive" />

            <p className="mt-4 text-lg font-medium text-destructive">
              Submission Closed
            </p>

            <p className="text-sm text-muted-foreground">
              The deadline for this assignment has passed.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Not submitted + deadline still active */
        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>

            <CardDescription>
              Enter the URL to your completed assignment file
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileUrl">File URL</Label>

                <Input
                  id="fileUrl"
                  placeholder="https://example.com/your-assignment.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  required
                />

                <p className="text-xs text-muted-foreground">
                  Enter a link to your file (Google Drive, Dropbox, etc.)
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
