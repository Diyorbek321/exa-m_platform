import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import * as XLSX from "xlsx";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import {
  loginSchema,
  insertSubjectSchema,
  insertQuizSchema,
  insertQuestionSchema,
  addStudentSchema,
  startExamSchema,
  submitExamSchema,
} from "@shared/schema";
import type { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

async function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "student") {
    return res.status(403).json({ message: "Forbidden" });
  }
  if (user.expiration) {
    const expirationDate = new Date(user.expiration);
    if (expirationDate < new Date()) {
      return res.status(403).json({ message: "Access expired" });
    }
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MemoryStoreSession = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "exam-platform-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
    })
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { username, password } = parsed.data;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role === "student" && user.expiration) {
        const expirationDate = new Date(user.expiration);
        if (expirationDate < new Date()) {
          return res.status(403).json({ message: "Access expired" });
        }
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/subjects", requireAuth, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subjects", requireAdmin, async (req, res) => {
    try {
      const parsed = insertSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const subject = await storage.createSubject(parsed.data);
      res.status(201).json(subject);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = insertSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const subject = await storage.updateSubject(req.params.id, parsed.data);
      res.json(subject);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/subjects/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSubject(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quizzes", requireAuth, async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quizzes", requireAdmin, async (req, res) => {
    try {
      const parsed = insertQuizSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const quiz = await storage.createQuiz(parsed.data);
      res.status(201).json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/quizzes/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = insertQuizSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const quiz = await storage.updateQuiz(req.params.id, parsed.data);
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/quizzes/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteQuiz(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/questions", requireAdmin, async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/questions", requireAdmin, async (req, res) => {
    try {
      const parsed = insertQuestionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const question = await storage.createQuestion(parsed.data);
      res.status(201).json(question);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/questions/import", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const quizId = req.body.quizId;
      if (!quizId) {
        return res.status(400).json({ message: "Quiz ID is required" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet) as any[];

      const questions = [];
      for (const row of data) {
        const question = {
          quizId,
          text: String(row.text || ""),
          option1: String(row.option1 || ""),
          option2: String(row.option2 || ""),
          option3: String(row.option3 || ""),
          option4: String(row.option4 || ""),
          correct: String(row.correct || "option1") as "option1" | "option2" | "option3" | "option4",
        };

        if (question.text && question.option1 && question.option2 && question.option3 && question.option4) {
          questions.push(question);
        }
      }

      if (questions.length === 0) {
        return res.status(400).json({ message: "No valid questions found in the file" });
      }

      await storage.createQuestions(questions);
      res.json({ count: questions.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = insertQuestionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const question = await storage.updateQuestion(req.params.id, parsed.data);
      res.json(question);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students", requireAdmin, async (req, res) => {
    try {
      const students = await storage.getStudents();
      const studentsWithoutPassword = students.map(({ password, ...rest }) => rest);
      res.json(studentsWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students", requireAdmin, async (req, res) => {
    try {
      const parsed = addStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { username, password, accessHours } = parsed.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const expiration = new Date(Date.now() + accessHours * 60 * 60 * 1000).toISOString();
      const user = await storage.createUser({
        username,
        password,
        role: "student",
        expiration,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students/:id/extend", requireAdmin, async (req, res) => {
    try {
      const { hours } = req.body;
      if (!hours || typeof hours !== "number" || hours < 1) {
        return res.status(400).json({ message: "Invalid hours" });
      }

      const user = await storage.extendUserAccess(req.params.id, hours);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/student/subjects", requireStudent, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      const subjectsWithQuizzes = await Promise.all(
        subjects.map(async (subject) => {
          const quizzes = await storage.getQuizzes();
          const subjectQuizzes = quizzes.filter((q) => q.subjectId === subject.id);
          return {
            ...subject,
            quizzes: subjectQuizzes,
          };
        })
      );
      res.json(subjectsWithQuizzes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/exam/start", requireStudent, async (req, res) => {
    try {
      const parsed = startExamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { quizId, questionCount } = parsed.data;
      const count = parseInt(questionCount);

      const questions = await storage.getQuestionsByQuiz(quizId);
      if (questions.length < count) {
        return res.status(400).json({
          message: `Not enough questions. Quiz has ${questions.length} questions, but ${count} were requested.`,
        });
      }

      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, count);
      const questionIds = selectedQuestions.map((q) => q.id);

      const examId = await storage.createExam(req.session.userId!, quizId, questionIds);
      res.json({ examId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/exam/:examId", requireStudent, async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found or already submitted" });
      }
      res.json(exam);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/exam/:examId/submit", requireStudent, async (req, res) => {
    try {
      const parsed = submitExamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const results = await storage.submitExam(req.params.examId, parsed.data.answers);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/exam/:examId/results", requireStudent, async (req, res) => {
    try {
      const results = await storage.getExamResults(req.params.examId);
      if (!results) {
        return res.status(404).json({ message: "Results not found" });
      }
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
