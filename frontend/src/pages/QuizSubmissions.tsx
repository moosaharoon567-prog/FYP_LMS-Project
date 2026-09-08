import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { quizzesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, ClipboardList, User } from 'lucide-react';
import type { Quiz, QuizSubmission } from '@/types';

export function QuizSubmissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [quizRes, subsRes] = await Promise.all([
        quizzesAPI.getById(id!),
        quizzesAPI.getSubmissions(id!),
      ]);
      setQuiz(quizRes.data);
      setSubmissions(subsRes.data);
    } catch (error) {
      console.error('Failed to load quiz submissions:', error);
      toast.error('Failed to load quiz submissions');
    } finally {
      setIsLoading(false);
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

  const totalQuestions = quiz?.question_set.length ?? 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{quiz?.title ?? 'Quiz'} — Submissions</h1>
        <p className="text-muted-foreground">
          Quizzes are auto-graded, so scores are already calculated below.
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No Submissions Yet</p>
            <p className="text-sm text-muted-foreground">
              No students have taken this quiz yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const passed = totalQuestions > 0 && submission.score >= totalQuestions / 2;
            return (
              <Card key={submission._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{submission.student_id.name}</CardTitle>
                        <CardDescription>{submission.student_id?.email}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={passed ? 'default' : 'destructive'}>
                      {submission.score} / {totalQuestions}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Submitted:</span>
                    <span>{formatDate(submission.submitted_at)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
