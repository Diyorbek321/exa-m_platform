import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { insertQuestionSchema, type InsertQuestion, type Question, type Quiz } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface QuestionWithQuiz extends Question {
  quizName: string;
}

interface QuizWithSubject extends Quiz {
  subjectName: string;
}

export default function QuestionsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithQuiz | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<QuestionWithQuiz | null>(null);
  const [selectedQuizForImport, setSelectedQuizForImport] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<QuestionWithQuiz[]>({
    queryKey: ["/api/questions"],
  });

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<QuizWithSubject[]>({
    queryKey: ["/api/quizzes"],
  });

  const form = useForm<InsertQuestion>({
    resolver: zodResolver(insertQuestionSchema),
    defaultValues: {
      quizId: "",
      text: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct: "option1",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const res = await apiRequest("POST", "/api/questions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Question created successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertQuestion }) => {
      const res = await apiRequest("PATCH", `/api/questions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({ title: "Question updated successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Question deleted successfully" });
      setDeletingQuestion(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
    form.reset({
      quizId: "",
      text: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct: "option1",
    });
  };

  const openEditDialog = (question: QuestionWithQuiz) => {
    setEditingQuestion(question);
    form.reset({
      quizId: question.quizId,
      text: question.text,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      correct: question.correct,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: InsertQuestion) => {
    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedQuizForImport) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("quizId", selectedQuizForImport);

    try {
      const res = await fetch("/api/questions/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: `Successfully imported ${result.count} questions` });
      setIsImportDialogOpen(false);
      setSelectedQuizForImport("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import failed", description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = isLoadingQuestions || isLoadingQuizzes;

  return (
    <AdminLayout
      title="Questions"
      subtitle="Add and manage quiz questions"
      actions={
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-questions" disabled={!quizzes?.length}>
                <Upload className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Questions from Excel</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx) with columns: text, option1, option2, option3, option4, correct
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Quiz</Label>
                  <Select value={selectedQuizForImport} onValueChange={setSelectedQuizForImport}>
                    <SelectTrigger data-testid="select-quiz-import">
                      <SelectValue placeholder="Choose a quiz" />
                    </SelectTrigger>
                    <SelectContent>
                      {quizzes?.map((quiz) => (
                        <SelectItem key={quiz.id} value={quiz.id}>
                          {quiz.name} ({quiz.subjectName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                      disabled={!selectedQuizForImport || isUploading}
                    />
                    <label htmlFor="excel-upload">
                      <Button
                        variant="outline"
                        disabled={!selectedQuizForImport || isUploading}
                        asChild
                      >
                        <span className="cursor-pointer">
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Choose File
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    <p className="text-sm text-muted-foreground mt-4">
                      Excel file should have headers: text, option1, option2, option3, option4, correct
                    </p>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) closeDialog();
            else setIsDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-question" disabled={!quizzes?.length}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </DialogTitle>
                <DialogDescription>
                  {editingQuestion
                    ? "Update the question details below."
                    : "Fill in all fields for the new question."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="quizId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-quiz">
                              <SelectValue placeholder="Select a quiz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {quizzes?.map((quiz) => (
                              <SelectItem key={quiz.id} value={quiz.id}>
                                {quiz.name} ({quiz.subjectName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the question..."
                            data-testid="input-question-text"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(["option1", "option2", "option3", "option4"] as const).map((option, index) => (
                      <FormField
                        key={option}
                        control={form.control}
                        name={option}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option {index + 1}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Option ${index + 1}`}
                                data-testid={`input-${option}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <FormField
                    control={form.control}
                    name="correct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                          >
                            {(["option1", "option2", "option3", "option4"] as const).map((option, index) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={option} />
                                <Label htmlFor={option}>Option {index + 1}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending} data-testid="button-save-question">
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingQuestion ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {!quizzes?.length && !isLoading && (
        <Card className="mb-6 border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              You need to create at least one quiz before adding questions.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Questions</CardTitle>
          <CardDescription>
            {questions?.length || 0} question{questions?.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : questions && questions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Question</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Correct</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                    <TableCell>
                      <p className="line-clamp-2">{question.text}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{question.quizName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {question.correct.replace("option", "Opt ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(question)}
                          data-testid={`button-edit-question-${question.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingQuestion(question)}
                          data-testid={`button-delete-question-${question.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No questions yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Question" or "Import Excel" to add questions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingQuestion} onOpenChange={(open) => !open && setDeletingQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuestion && deleteMutation.mutate(deletingQuestion.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
