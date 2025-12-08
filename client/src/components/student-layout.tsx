import { Link, useLocation } from "wouter";
import { GraduationCap, LogOut, Home, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function StudentLayout({ children, title, subtitle }: StudentLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const expirationDate = user?.expiration ? new Date(user.expiration) : null;
  const isExpired = expirationDate ? expirationDate < new Date() : false;
  const timeRemaining = expirationDate && !isExpired
    ? formatDistanceToNow(expirationDate, { addSuffix: true })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b h-16 shrink-0">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/student" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-medium text-lg hidden sm:inline">Exam Platform</span>
            </Link>
            
            <nav className="flex items-center gap-1 ml-4">
              <Button
                variant={location === "/student" ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href="/student" data-testid="link-home">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {timeRemaining && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Access expires {timeRemaining}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden md:inline">
                {user?.username}
              </span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-medium" data-testid="text-page-title">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
