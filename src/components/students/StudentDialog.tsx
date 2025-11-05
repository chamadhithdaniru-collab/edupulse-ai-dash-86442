import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VoiceInput } from "./VoiceInput";
import { encryptData } from "@/utils/encryption";

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

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  onSave: () => void;
}

export const StudentDialog = ({ open, onOpenChange, student, onSave }: StudentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    index_number: "",
    grade: "",
    section: "",
    status: "active" as 'active' | 'at_risk' | 'inactive',
    specialty: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        index_number: student.index_number,
        grade: student.grade,
        section: (student as any).section || "",
        status: student.status,
        specialty: student.specialty || "",
      });
    } else {
      setFormData({
        name: "",
        index_number: "",
        grade: "",
        section: "",
        status: "active",
        specialty: "",
      });
    }
    setPhotoFile(null);
  }, [student, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let photoUrl = student?.photo_url;

      // Upload photo if selected with user-specific folder
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
      }

      // Encrypt sensitive data
      const encryptedName = await encryptData(formData.name);
      const encryptedIndexNumber = await encryptData(formData.index_number);

      const studentData = {
        ...formData,
        name: encryptedName,
        index_number: encryptedIndexNumber,
        photo_url: photoUrl,
        user_id: user.id,
      };

      if (student) {
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("students")
          .insert([studentData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Student ${student ? 'updated' : 'added'} successfully`,
      });
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{student ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          <DialogDescription>
            {student ? 'Update student information' : 'Add a new student to the system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Name</Label>
              <VoiceInput
                field="name"
                label=""
                onTranscript={(text) => setFormData({ ...formData, name: text })}
              />
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="index">Index Number</Label>
            <Input
              id="index"
              value={formData.index_number}
              onChange={(e) => setFormData({ ...formData, index_number: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                placeholder="e.g., A, B, C"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty (Optional)</Label>
            <Input
              id="specialty"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="e.g., Science, Arts"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Student Photo</Label>
            <div className="flex gap-2">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="flex-1"
              />
            </div>
            {photoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {photoFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-primary">
              {loading ? 'Saving...' : student ? 'Update' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
