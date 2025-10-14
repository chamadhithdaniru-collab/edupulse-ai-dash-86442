import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentDialog } from "./StudentDialog";
import { StudentCard } from "./StudentCard";

interface Student {
  id: string;
  name: string;
  index_number: string;
  grade: string;
  status: 'active' | 'at_risk' | 'inactive';
  specialty: string | null;
  photo_url: string | null;
  attendance_percentage: number;
}

interface StudentsListProps {
  onUpdate: () => void;
}

export const StudentsList = ({ onUpdate }: StudentsListProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name");

      if (error) throw error;
      setStudents((data || []) as Student[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    loadStudents();
    onUpdate();
    setDialogOpen(false);
    setSelectedStudent(undefined);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
      loadStudents();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.index_number.toLowerCase().includes(search.toLowerCase()) ||
    s.grade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Student Management</CardTitle>
            <CardDescription>Add, edit, and manage student profiles</CardDescription>
          </div>
          <Button
            onClick={() => {
              setSelectedStudent(undefined);
              setDialogOpen(true);
            }}
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-primary gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, index, or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-muted-foreground col-span-full text-center py-8">Loading students...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              {search ? "No students found" : "No students added yet"}
            </p>
          ) : (
            filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </CardContent>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
        onSave={handleSave}
      />
    </Card>
  );
};
