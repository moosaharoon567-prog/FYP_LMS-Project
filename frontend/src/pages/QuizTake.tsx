import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { quizzesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { Quiz } from '@/types';

export function QuizTake() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    if (id) {
      loadQuiz();
    }
  }, [id]);

  const loadQuiz = async () => {
    try {
      const response = await quizzesAPI.getById(id!);
      setQuiz(response.data);
      setAnswers(new Array(response.data.question_set.length).fill(-1));
      setTimeLeft(response.data.duration_minutes * 60);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (!isStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const unanswered = answers.filter((a) => a === -1).length;
    if (unanswered > 0 && timeLeft > 0) {
      if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await quizzesAPI.attempt(id!, answers);
      toast.success('Quiz submitted successfully');
      setResult({
        score: response.data.score,
        total: quiz?.question_set.length ?? answers.length,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
      setIsSubmitting(false);
    }
  };

  const startQuiz = () => {
    setIsStarted(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  if (result) {
    const passed = result.total > 0 && result.score >= result.total / 2;
    return (
      <div className="space-y-6">
        <Card className={passed ? 'border-green-500' : 'border-destructive'}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className={`h-12 w-12 ${passed ? 'text-green-500' : 'text-destructive'}`} />
            <p className="mt-4 text-lg font-medium">Quiz Submitted</p>
            <p className="mt-2 text-3xl font-bold">
              {result.score} / {result.total}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your quiz was graded automatically.
            </p>
            <Button className="mt-6" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOverdue = new Date(quiz.deadline) < new Date();

  if (isOverdue) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="mt-4 text-lg font-medium text-destructive">Quiz Closed</p>
            <p className="text-sm text-muted-foreground">
              The deadline for this quiz has passed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">{quiz.course_id.title}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span>{quiz.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Questions:</span>
              <span>{quiz.question_set.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Deadline:</span>
              <span>{formatDate(quiz.deadline)}</span>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Instructions:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You have {quiz.duration_minutes} minutes to complete this quiz</li>
                <li>• Once started, the timer cannot be paused</li>
                <li>• Make sure you have a stable internet connection</li>
                <li>• You can only attempt this quiz once</li>
              </ul>
            </div>
            <Button onClick={startQuiz} className="w-full">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background p-4 border-b z-10">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {answers.filter((a) => a !== -1).length} of {quiz.question_set.length}
          </p>
        </div>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-destructive' : ''}`}>
          <Clock className="inline mr-2 h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="space-y-6">
        {quiz.question_set.map((question, qIndex) => (
          <Card key={qIndex}>
            <CardHeader>
              <CardTitle className="text-lg">
                Question {qIndex + 1}
              </CardTitle>
              <CardDescription className="text-base text-foreground">
                {question.question}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <Button
                    key={oIndex}
                    variant={answers[qIndex] === oIndex ? 'default' : 'outline'}
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleAnswer(qIndex, oIndex)}
                  >
                    <span className="mr-3 font-medium">{String.fromCharCode(65 + oIndex)}.</span>
                    {option}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-0 bg-background p-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
}
