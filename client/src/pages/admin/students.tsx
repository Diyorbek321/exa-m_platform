import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";
import { addStudentSchema, type AddStudentInput, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow, isBefore } from "date-fns";

const extendAccessSchema = z.object({
  hours: z.coerce.number().min(1, "Hours must be at least 1"),
});

type ExtendAccessFormData = z.infer<typeof extendAccessSchema>;

export default function StudentsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [extendingStudent, setExtendingStudent] = useState<User | null>(null);

  const { data: students, isLoading } = useQuery<User[]>({
    queryKey: ["/api/students"],
  });

  const addForm = useForm<AddStudentInput>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      username: "",
      password: "",
      accessHours: 24,
    },
  });

  const extendForm = useForm<ExtendAccessFormData>({
    resolver: zodResolver(extendAccessSchema),
    defaultValues: {
      hours: 24,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddStudentInput) => {
      const res = await apiRequest("POST", "/api/students", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Student created successfully" });
      setIsDialogOpen(false);
      addForm.reset({ username: "", password: "", accessHours: 24 });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const extendMutation = useMutation({
    mutationFn: async ({ userId, hours }: { userId: string; hours: number }) => {
      const res = await apiRequest("POST", `/api/students/${userId}/extend`, { hours });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Access extended successfully" });
      setExtendingStudent(null);
      extendForm.reset({ hours: 24 });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Student deleted successfully" });
      setDeletingStudent(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const onAddSubmit = (data: AddStudentInput) => {
    createMutation.mutate(data);
  };

  const onExtendSubmit = (data: ExtendAccessFormData) => {
    if (extendingStudent) {
      extendMutation.mutate({ userId: extendingStudent.id, hours: data.hours });
    }
  };

  const getAccessStatus = (expiration: string | null) => {
    if (!expiration) return { status: "none", label: "No expiration" };
    const expirationDate = new Date(expiration);
    const isExpired = isBefore(expirationDate, new Date());
    return {
      status: isExpired ? "expired" : "active",
      label: isExpired
        ? `Expired ${formatDistanceToNow(expirationDate, { addSuffix: true })}`
        : `Expires ${formatDistanceToNow(expirationDate, { addSuffix: true })}`,
      date: format(expirationDate, "PPp"),
    };
  };

  return (
    <AdminLayout
      title="Students"
      subtitle="Manage student accounts and access"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-student">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Create a new student account with timed access.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
                <FormField
                  control={addForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="student1"
                          data-testid="input-student-username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          data-testid="input-student-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="accessHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Duration (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="24"
                          data-testid="input-access-hours"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        How many hours the student can access exams
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-student">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Student
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Students</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : students && students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const accessInfo = getAccessStatus(student.expiration);
                  return (
                    <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                      <TableCell className="font-medium">{student.username}</TableCell>
                      <TableCell>
                        <Badge
                          variant={accessInfo.status === "active" ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {accessInfo.status === "active" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {accessInfo.status === "active" ? "Active" : "Expired"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{accessInfo.label}</p>
                          {accessInfo.date && (
                            <p className="text-xs text-muted-foreground">{accessInfo.date}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setExtendingStudent(student);
                              extendForm.reset({ hours: 24 });
                            }}
                            data-testid={`button-extend-${student.id}`}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingStudent(student)}
                            data-testid={`button-delete-student-${student.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No students yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Student" to create student accounts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!extendingStudent} onOpenChange={(open) => !open && setExtendingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Access</DialogTitle>
            <DialogDescription>
              Add more time to {extendingStudent?.username}'s access.
            </DialogDescription>
          </DialogHeader>
          <Form {...extendForm}>
            <form onSubmit={extendForm.handleSubmit(onExtendSubmit)} className="space-y-6">
              <FormField
                control={extendForm.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="24"
                        data-testid="input-extend-hours"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Hours to add to current expiration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setExtendingStudent(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={extendMutation.isPending} data-testid="button-confirm-extend">
                  {extendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Extend Access
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingStudent} onOpenChange={(open) => !open && setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingStudent?.username}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStudent && deleteMutation.mutate(deletingStudent.id)}
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
