import { z } from "zod";

export const users = {
  id: "",
  username: "",
  password: "",
  role: "" as "admin" | "student",
  expiration: null as string | null,
};

export const subjects = {
  id: "",
  name: "",
};

export const quizzes = {
  id: "",
  subjectId: "",
  name: "",
  description: "",
};

export const questions = {
  id: "",
  quizId: "",
  text: "",
  option1: "",
  option2: "",
  option3: "",
  option4: "",
  correct: "" as "option1" | "option2" | "option3" | "option4",
};

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "student"]),
  expiration: z.string().nullable().optional(),
});

export const insertSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
});

export const insertQuizSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  name: z.string().min(1, "Quiz name is required"),
  description: z.string().optional().default(""),
});

export const insertQuestionSchema = z.object({
  quizId: z.string().min(1, "Quiz is required"),
  text: z.string().min(1, "Question text is required"),
  option1: z.string().min(1, "Option 1 is required"),
  option2: z.string().min(1, "Option 2 is required"),
  option3: z.string().min(1, "Option 3 is required"),
  option4: z.string().min(1, "Option 4 is required"),
  correct: z.enum(["option1", "option2", "option3", "option4"]),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const addStudentSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  accessHours: z.coerce.number().min(1, "Access hours must be at least 1"),
});

export const extendAccessSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  hours: z.coerce.number().min(1, "Hours must be at least 1"),
});

export const startExamSchema = z.object({
  quizId: z.string().min(1, "Quiz is required"),
  questionCount: z.enum(["20", "25", "50"]),
});

export const submitAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.enum(["option1", "option2", "option3", "option4"]).nullable(),
});

export const submitExamSchema = z.object({
  answers: z.array(submitAnswerSchema),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AddStudentInput = z.infer<typeof addStudentSchema>;
export type ExtendAccessInput = z.infer<typeof extendAccessSchema>;
export type StartExamInput = z.infer<typeof startExamSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;

export type User = {
  id: string;
  username: string;
  password: string;
  role: "admin" | "student";
  expiration: string | null;
};

export type Subject = {
  id: string;
  name: string;
};

export type Quiz = {
  id: string;
  subjectId: string;
  name: string;
  description: string;
};

export type Question = {
  id: string;
  quizId: string;
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct: "option1" | "option2" | "option3" | "option4";
};

export type ExamQuestion = Omit<Question, "correct">;

export type ExamResult = {
  questionId: string;
  questionText: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
};

export type ExamSummary = {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  results: ExamResult[];
};
