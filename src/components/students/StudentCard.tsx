import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, User } from "lucide-react";

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

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export const StudentCard = ({ student, onEdit, onDelete }: StudentCardProps) => {
  const statusColors = {
    active: "bg-secondary text-secondary-foreground",
    at_risk: "bg-destructive text-destructive-foreground",
    inactive: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="hover:shadow-primary transition-all duration-300 hover:scale-105 border-primary/20">
      <CardContent className="p-4 space-y-3">
        {/* Photo */}
        <div className="flex items-start justify-between">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-primary overflow-hidden">
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <Badge className={statusColors[student.status]}>
            {student.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Info */}
        <div>
          <h3 className="font-semibold text-base sm:text-lg truncate">{student.name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Index: {student.index_number}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Grade: {student.grade}{(student as any).section ? `-${(student as any).section}` : ''}
          </p>
          {student.specialty && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Specialty: {student.specialty}</p>
          )}
        </div>

        {/* Attendance */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Attendance</span>
            <span className="text-xs font-semibold">{student.attendance_percentage}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${student.attendance_percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(student)}
            className="flex-1 gap-2"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(student.id)}
            className="flex-1 gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
