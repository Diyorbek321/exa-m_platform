import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from "lucide-react";
import type { ExamQuestion, SubmitAnswerInput } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

interface ExamData {
  examId: string;
  quizName: string;
  questions: ExamQuestion[];
}

type AnswerKey = "option1" | "option2" | "option3" | "option4";

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AnswerKey | null>>(new Map());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const { data: examData, isLoading, error } = useQuery<ExamData>({
    queryKey: ["/api/exam", examId],
    enabled: !!examId,
  });

  useEffect(() => {
    if (examData?.questions) {
      const initialAnswers = new Map<string, AnswerKey | null>();
      examData.questions.forEach((q) => initialAnswers.set(q.id, null));
      setAnswers(initialAnswers);
    }
  }, [examData]);

  const submitMutation = useMutation({
    mutationFn: async (answersData: SubmitAnswerInput[]) => {
      const res = await apiRequest("POST", `/api/exam/${examId}/submit`, { answers: answersData });
      return res.json();
    },
    onSuccess: () => {
      setLocation(`/student/results/${examId}`);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-medium mb-2">Exam Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This exam may have expired or doesn't exist.
            </p>
            <Button onClick={() => setLocation("/student")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = examData.questions;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Array.from(answers.values()).filter((a) => a !== null).length;
  const progress = (answeredCount / questions.length) * 100;

  const handleAnswerSelect = (answer: AnswerKey) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, answer);
    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    const answersData: SubmitAnswerInput[] = Array.from(answers.entries()).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    submitMutation.mutate(answersData);
  };

  const currentAnswer = answers.get(currentQuestion.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b h-16 shrink-0">
        <div className="max-w-3xl mx-auto h-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="font-medium text-lg truncate" data-testid="text-quiz-name">
              {examData.quizName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-mono" data-testid="text-progress">
              {answeredCount} / {questions.length} answered
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <Badge
                  variant="secondary"
                  className="font-mono text-sm shrink-0"
                  data-testid="text-question-number"
                >
                  Question {currentIndex + 1} of {questions.length}
                </Badge>
              </div>

              <p className="text-lg leading-relaxed" data-testid="text-question">
                {currentQuestion.text}
              </p>

              <RadioGroup
                value={currentAnswer || ""}
                onValueChange={(value) => handleAnswerSelect(value as AnswerKey)}
                className="space-y-3"
              >
                {(["option1", "option2", "option3", "option4"] as const).map((optionKey, index) => {
                  const optionText = currentQuestion[optionKey];
                  const isSelected = currentAnswer === optionKey;
                  
                  return (
                    <div
                      key={optionKey}
                      className={`
                        relative flex items-center gap-4 p-4 rounded-md border transition-colors cursor-pointer
                        ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}
                      `}
                      onClick={() => handleAnswerSelect(optionKey)}
                      data-testid={`option-${optionKey}`}
                    >
                      <RadioGroupItem value={optionKey} id={optionKey} className="shrink-0" />
                      <Label
                        htmlFor={optionKey}
                        className="flex-1 cursor-pointer text-base leading-relaxed"
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                        {optionText}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4 items-center pt-4">
            <div className="flex justify-start flex-wrap">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                data-testid="button-previous"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            </div>
            
            <div className="flex justify-center">
              <div className="flex gap-1 flex-wrap justify-center">
                {questions.map((q, index) => {
                  const isAnswered = answers.get(q.id) !== null;
                  const isCurrent = index === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`
                        w-8 h-8 text-xs font-mono rounded-md transition-colors
                        ${isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isAnswered
                          ? "bg-muted text-foreground"
                          : "bg-background border text-muted-foreground"
                        }
                      `}
                      data-testid={`button-goto-${index}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 flex-wrap">
              {currentIndex < questions.length - 1 ? (
                <Button onClick={handleNext} data-testid="button-next">
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  data-testid="button-submit-exam"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Submit Exam
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < questions.length ? (
                <>
                  You have answered {answeredCount} out of {questions.length} questions.
                  Unanswered questions will be marked as incorrect.
                </>
              ) : (
                "You have answered all questions. Are you ready to submit?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
