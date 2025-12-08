import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import SubjectsPage from "@/pages/admin/subjects";
import QuizzesPage from "@/pages/admin/quizzes";
import QuestionsPage from "@/pages/admin/questions";
import StudentsPage from "@/pages/admin/students";
import StudentDashboard from "@/pages/student/dashboard";
import ExamPage from "@/pages/student/exam";
import ResultsPage from "@/pages/student/results";
import NotFound from "@/pages/not-found";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: ("admin" | "student")[];
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Redirect to={user.role === "admin" ? "/admin" : "/student"} />;
  }

  return <>{children}</>;
}

function AuthenticatedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Redirect to={user.role === "admin" ? "/admin" : "/student"} />;
  }

  return <LoginPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthenticatedRedirect} />
      
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/subjects">
        <ProtectedRoute allowedRoles={["admin"]}>
          <SubjectsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/quizzes">
        <ProtectedRoute allowedRoles={["admin"]}>
          <QuizzesPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/questions">
        <ProtectedRoute allowedRoles={["admin"]}>
          <QuestionsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/students">
        <ProtectedRoute allowedRoles={["admin"]}>
          <StudentsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/student">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/student/exam/:examId">
        <ProtectedRoute allowedRoles={["student"]}>
          <ExamPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/student/results/:examId">
        <ProtectedRoute allowedRoles={["student"]}>
          <ResultsPage />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
