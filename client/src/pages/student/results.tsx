import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { CheckCircle, XCircle, Home, RotateCcw, AlertCircle, Trophy, Target } from "lucide-react";
import type { ExamSummary } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ResultsPage() {
  const { examId } = useParams<{ examId: string }>();

  const { data: results, isLoading, error } = useQuery<ExamSummary>({
    queryKey: ["/api/exam", examId, "results"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-medium mb-2">Results Not Found</h2>
            <p className="text-muted-foreground mb-6">
              Unable to load exam results.
            </p>
            <Button asChild>
              <Link href="/student">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totalQuestions, correctAnswers, percentage, results: questionResults } = results;
  const isPassing = percentage >= 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b h-16 shrink-0">
        <div className="max-w-4xl mx-auto h-full px-4 flex items-center justify-between gap-4">
          <h1 className="font-medium text-lg">Exam Results</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-auto py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Card className={isPassing ? "border-chart-2/50" : "border-destructive/50"}>
            <CardContent className="py-12 text-center space-y-6">
              <div
                className={`
                  mx-auto w-24 h-24 rounded-full flex items-center justify-center
                  ${isPassing ? "bg-chart-2/10" : "bg-destructive/10"}
                `}
              >
                {isPassing ? (
                  <Trophy className="w-12 h-12 text-chart-2" />
                ) : (
                  <Target className="w-12 h-12 text-destructive" />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-6xl font-bold" data-testid="text-percentage">
                  {percentage.toFixed(0)}%
                </p>
                <Badge
                  variant={isPassing ? "default" : "destructive"}
                  className="text-sm"
                >
                  {isPassing ? "Passed" : "Needs Improvement"}
                </Badge>
              </div>

              <div className="flex justify-center gap-8 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-medium text-chart-2" data-testid="text-correct">
                    {correctAnswers}
                  </p>
                  <p className="text-muted-foreground">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-medium text-destructive" data-testid="text-incorrect">
                    {totalQuestions - correctAnswers}
                  </p>
                  <p className="text-muted-foreground">Incorrect</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-medium" data-testid="text-total">
                    {totalQuestions}
                  </p>
                  <p className="text-muted-foreground">Total</p>
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-4 flex-wrap">
                <Button variant="outline" asChild>
                  <Link href="/student" data-testid="link-dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/student" data-testid="link-retry">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Take Another Exam
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Answer Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Your Answer</TableHead>
                    <TableHead>Correct Answer</TableHead>
                    <TableHead className="w-[80px] text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionResults.map((result, index) => (
                    <TableRow
                      key={result.questionId}
                      className={result.isCorrect ? "" : "bg-destructive/5"}
                      data-testid={`row-result-${index}`}
                    >
                      <TableCell className="font-mono text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <p className="line-clamp-2">{result.questionText}</p>
                      </TableCell>
                      <TableCell>
                        {result.userAnswer ? (
                          <Badge variant={result.isCorrect ? "default" : "destructive"}>
                            {result.userAnswer}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">
                            Not answered
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {result.correctAnswer}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-chart-2 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
