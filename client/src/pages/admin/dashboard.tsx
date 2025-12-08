import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardList, FileQuestion, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  subjectsCount: number;
  quizzesCount: number;
  questionsCount: number;
  studentsCount: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  href: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-20" />
        ) : (
          <div className="text-4xl font-bold" data-testid={`stat-${title.toLowerCase()}`}>
            {value}
          </div>
        )}
        <Button variant="ghost" size="sm" className="mt-2 -ml-2" asChild>
          <Link href={href}>
            Manage <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      title: "Subjects",
      value: stats?.subjectsCount || 0,
      icon: BookOpen,
      href: "/admin/subjects",
    },
    {
      title: "Quizzes",
      value: stats?.quizzesCount || 0,
      icon: ClipboardList,
      href: "/admin/quizzes",
    },
    {
      title: "Questions",
      value: stats?.questionsCount || 0,
      icon: FileQuestion,
      href: "/admin/questions",
    },
    {
      title: "Students",
      value: stats?.studentsCount || 0,
      icon: Users,
      href: "/admin/students",
    },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your exam platform">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            href={stat.href}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/subjects">
                <BookOpen className="mr-2 h-4 w-4" />
                Add New Subject
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/quizzes">
                <ClipboardList className="mr-2 h-4 w-4" />
                Create New Quiz
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/questions">
                <FileQuestion className="mr-2 h-4 w-4" />
                Add Questions
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/admin/students">
                <Users className="mr-2 h-4 w-4" />
                Add New Student
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                1
              </span>
              <p>Create subjects to organize your quizzes by topic or category.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                2
              </span>
              <p>Add quizzes under each subject with a name and description.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                3
              </span>
              <p>Add questions manually or import them from an Excel file.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                4
              </span>
              <p>Create student accounts with timed access to take exams.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
