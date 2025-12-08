import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import type {
  User,
  Subject,
  Quiz,
  Question,
  InsertUser,
  InsertSubject,
  InsertQuiz,
  InsertQuestion,
  ExamQuestion,
  ExamResult,
  ExamSummary,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getStudents(): Promise<User[]>;
  extendUserAccess(userId: string, hours: number): Promise<User>;

  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, subject: InsertSubject): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;

  getQuizzes(): Promise<(Quiz & { subjectName: string; questionCount: number })[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesBySubject(subjectId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;

  getQuestions(): Promise<(Question & { quizName: string })[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByQuiz(quizId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  updateQuestion(id: string, question: InsertQuestion): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;

  createExam(userId: string, quizId: string, questionIds: string[]): Promise<string>;
  getExam(examId: string): Promise<{ examId: string; quizName: string; questions: ExamQuestion[] } | undefined>;
  submitExam(examId: string, answers: { questionId: string; answer: string | null }[]): Promise<ExamSummary>;
  getExamResults(examId: string): Promise<ExamSummary | undefined>;

  getStats(): Promise<{ subjectsCount: number; quizzesCount: number; questionsCount: number; studentsCount: number }>;
}

interface Exam {
  id: string;
  userId: string;
  quizId: string;
  questionIds: string[];
  answers: Map<string, string | null>;
  submitted: boolean;
  results?: ExamSummary;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subjects: Map<string, Subject>;
  private quizzes: Map<string, Quiz>;
  private questions: Map<string, Question>;
  private exams: Map<string, Exam>;

  constructor() {
    this.users = new Map();
    this.subjects = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.exams = new Map();
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin() {
    const existingAdmin = await this.getUserByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("adminpass", 10);
      const admin: User = {
        id: randomUUID(),
        username: "admin",
        password: hashedPassword,
        role: "admin",
        expiration: null,
      };
      this.users.set(admin.id, admin);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id,
      username: insertUser.username,
      password: hashedPassword,
      role: insertUser.role,
      expiration: insertUser.expiration || null,
    };
    this.users.set(id, user);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getStudents(): Promise<User[]> {
    return Array.from(this.users.values()).filter((user) => user.role === "student");
  }

  async extendUserAccess(userId: string, hours: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const now = new Date();
    const currentExpiration = user.expiration ? new Date(user.expiration) : now;
    const baseTime = currentExpiration > now ? currentExpiration : now;
    const newExpiration = new Date(baseTime.getTime() + hours * 60 * 60 * 1000);

    const updatedUser: User = { ...user, expiration: newExpiration.toISOString() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = randomUUID();
    const subject: Subject = { id, name: insertSubject.name };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: string, insertSubject: InsertSubject): Promise<Subject> {
    const existing = this.subjects.get(id);
    if (!existing) throw new Error("Subject not found");
    const updated: Subject = { ...existing, name: insertSubject.name };
    this.subjects.set(id, updated);
    return updated;
  }

  async deleteSubject(id: string): Promise<void> {
    const quizzes = await this.getQuizzesBySubject(id);
    for (const quiz of quizzes) {
      await this.deleteQuiz(quiz.id);
    }
    this.subjects.delete(id);
  }

  async getQuizzes(): Promise<(Quiz & { subjectName: string; questionCount: number })[]> {
    const quizzes = Array.from(this.quizzes.values());
    return Promise.all(
      quizzes.map(async (quiz) => {
        const subject = await this.getSubject(quiz.subjectId);
        const questions = await this.getQuestionsByQuiz(quiz.id);
        return {
          ...quiz,
          subjectName: subject?.name || "Unknown",
          questionCount: questions.length,
        };
      })
    );
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizzesBySubject(subjectId: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      (quiz) => quiz.subjectId === subjectId
    );
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = {
      id,
      subjectId: insertQuiz.subjectId,
      name: insertQuiz.name,
      description: insertQuiz.description || "",
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async updateQuiz(id: string, insertQuiz: InsertQuiz): Promise<Quiz> {
    const existing = this.quizzes.get(id);
    if (!existing) throw new Error("Quiz not found");
    const updated: Quiz = {
      ...existing,
      subjectId: insertQuiz.subjectId,
      name: insertQuiz.name,
      description: insertQuiz.description || "",
    };
    this.quizzes.set(id, updated);
    return updated;
  }

  async deleteQuiz(id: string): Promise<void> {
    const questions = await this.getQuestionsByQuiz(id);
    for (const question of questions) {
      this.questions.delete(question.id);
    }
    this.quizzes.delete(id);
  }

  async getQuestions(): Promise<(Question & { quizName: string })[]> {
    const questions = Array.from(this.questions.values());
    return Promise.all(
      questions.map(async (question) => {
        const quiz = await this.getQuiz(question.quizId);
        return {
          ...question,
          quizName: quiz?.name || "Unknown",
        };
      })
    );
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByQuiz(quizId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.quizId === quizId
    );
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      id,
      quizId: insertQuestion.quizId,
      text: insertQuestion.text,
      option1: insertQuestion.option1,
      option2: insertQuestion.option2,
      option3: insertQuestion.option3,
      option4: insertQuestion.option4,
      correct: insertQuestion.correct,
    };
    this.questions.set(id, question);
    return question;
  }

  async createQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    const questions: Question[] = [];
    for (const insertQuestion of insertQuestions) {
      const question = await this.createQuestion(insertQuestion);
      questions.push(question);
    }
    return questions;
  }

  async updateQuestion(id: string, insertQuestion: InsertQuestion): Promise<Question> {
    const existing = this.questions.get(id);
    if (!existing) throw new Error("Question not found");
    const updated: Question = {
      ...existing,
      quizId: insertQuestion.quizId,
      text: insertQuestion.text,
      option1: insertQuestion.option1,
      option2: insertQuestion.option2,
      option3: insertQuestion.option3,
      option4: insertQuestion.option4,
      correct: insertQuestion.correct,
    };
    this.questions.set(id, updated);
    return updated;
  }

  async deleteQuestion(id: string): Promise<void> {
    this.questions.delete(id);
  }

  async createExam(userId: string, quizId: string, questionIds: string[]): Promise<string> {
    const id = randomUUID();
    const exam: Exam = {
      id,
      userId,
      quizId,
      questionIds,
      answers: new Map(),
      submitted: false,
    };
    this.exams.set(id, exam);
    return id;
  }

  async getExam(examId: string): Promise<{ examId: string; quizName: string; questions: ExamQuestion[] } | undefined> {
    const exam = this.exams.get(examId);
    if (!exam || exam.submitted) return undefined;

    const quiz = await this.getQuiz(exam.quizId);
    if (!quiz) return undefined;

    const questions: ExamQuestion[] = [];
    for (const questionId of exam.questionIds) {
      const question = await this.getQuestion(questionId);
      if (question) {
        const { correct, ...examQuestion } = question;
        questions.push(examQuestion);
      }
    }

    return {
      examId: exam.id,
      quizName: quiz.name,
      questions,
    };
  }

  async submitExam(examId: string, answers: { questionId: string; answer: string | null }[]): Promise<ExamSummary> {
    const exam = this.exams.get(examId);
    if (!exam) throw new Error("Exam not found");
    if (exam.submitted) throw new Error("Exam already submitted");

    const results: ExamResult[] = [];
    let correctCount = 0;

    for (const { questionId, answer } of answers) {
      const question = await this.getQuestion(questionId);
      if (!question) continue;

      const isCorrect = answer === question.correct;
      if (isCorrect) correctCount++;

      const userAnswerText = answer ? question[answer as keyof Question] as string : null;
      const correctAnswerText = question[question.correct as keyof Question] as string;

      results.push({
        questionId,
        questionText: question.text,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect,
      });
    }

    const summary: ExamSummary = {
      totalQuestions: exam.questionIds.length,
      correctAnswers: correctCount,
      percentage: (correctCount / exam.questionIds.length) * 100,
      results,
    };

    exam.submitted = true;
    exam.results = summary;
    this.exams.set(examId, exam);

    return summary;
  }

  async getExamResults(examId: string): Promise<ExamSummary | undefined> {
    const exam = this.exams.get(examId);
    if (!exam || !exam.submitted) return undefined;
    return exam.results;
  }

  async getStats(): Promise<{ subjectsCount: number; quizzesCount: number; questionsCount: number; studentsCount: number }> {
    const students = await this.getStudents();
    return {
      subjectsCount: this.subjects.size,
      quizzesCount: this.quizzes.size,
      questionsCount: this.questions.size,
      studentsCount: students.length,
    };
  }
}

export const storage = new MemStorage();
