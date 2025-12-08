import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookOpen, ClipboardList, Play, AlertCircle, Loader2 } from "lucide-react";
import type { Subject, Quiz } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { StudentLayout } from "@/components/student-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isBefore } from "date-fns";

interface QuizWithDetails extends Quiz {
  subjectName: string;
  questionCount: number;
}

interface SubjectWithQuizzes extends Subject {
  quizzes: QuizWithDetails[];
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithDetails | null>(null);
  const [questionCount, setQuestionCount] = useState<"20" | "25" | "50">("20");

  const isExpired = user?.expiration ? isBefore(new Date(user.expiration), new Date()) : false;

  const { data: subjectsWithQuizzes, isLoading } = useQuery<SubjectWithQuizzes[]>({
    queryKey: ["/api/student/subjects"],
    enabled: !isExpired,
  });

  const startExamMutation = useMutation({
    mutationFn: async ({ quizId, questionCount }: { quizId: string; questionCount: string }) => {
      const res = await apiRequest("POST", "/api/exam/start", { quizId, questionCount });
      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/student/exam/${data.examId}`);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleStartExam = () => {
    if (selectedQuiz) {
      startExamMutation.mutate({ quizId: selectedQuiz.id, questionCount });
    }
  };

  const getAvailableQuestionCounts = (totalQuestions: number) => {
    const counts: { value: "20" | "25" | "50"; label: string }[] = [];
    if (totalQuestions >= 20) counts.push({ value: "20", label: "20 Questions" });
    if (totalQuestions >= 25) counts.push({ value: "25", label: "25 Questions" });
    if (totalQuestions >= 50) counts.push({ value: "50", label: "50 Questions" });
    return counts;
  };

  if (isExpired) {
    return (
      <StudentLayout title="Access Expired" subtitle="Your exam access has expired">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Expired</AlertTitle>
          <AlertDescription>
            Your access to the exam platform has expired. Please contact your administrator to extend your access.
          </AlertDescription>
        </Alert>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      title="My Exams"
      subtitle="Select a subject and quiz to start your exam"
    >
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-40" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : subjectsWithQuizzes && subjectsWithQuizzes.length > 0 ? (
        <div className="space-y-12">
          {subjectsWithQuizzes.map((subject) => (
            <div key={subject.id}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-medium" data-testid={`text-subject-${subject.id}`}>
                  {subject.name}
                </h2>
              </div>

              {subject.quizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subject.quizzes.map((quiz) => (
                    <Card key={quiz.id} data-testid={`card-quiz-${quiz.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{quiz.name}</CardTitle>
                          <ClipboardList className="w-5 h-5 text-muted-foreground shrink-0" />
                        </div>
                        {quiz.description && (
                          <CardDescription className="line-clamp-2">
                            {quiz.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Badge variant="secondary" className="font-mono">
                          {quiz.questionCount} questions
                        </Badge>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedQuiz(quiz);
                            const counts = getAvailableQuestionCounts(quiz.questionCount);
                            if (counts.length > 0) {
                              setQuestionCount(counts[0].value);
                            }
                          }}
                          disabled={quiz.questionCount < 20}
                          data-testid={`button-start-quiz-${quiz.id}`}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {quiz.questionCount < 20 ? "Not enough questions" : "Start Exam"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No quizzes available in this subject.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No exams available yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for available quizzes.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedQuiz} onOpenChange={(open) => !open && setSelectedQuiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Exam</DialogTitle>
            <DialogDescription>
              You are about to start: {selectedQuiz?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Select
                value={questionCount}
                onValueChange={(value) => setQuestionCount(value as "20" | "25" | "50")}
              >
                <SelectTrigger data-testid="select-question-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedQuiz && getAvailableQuestionCounts(selectedQuiz.questionCount).map((count) => (
                    <SelectItem key={count.value} value={count.value}>
                      {count.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Questions will be randomly selected from the quiz pool. Make sure you're ready before starting.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartExam}
              disabled={startExamMutation.isPending}
              data-testid="button-confirm-start"
            >
              {startExamMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
