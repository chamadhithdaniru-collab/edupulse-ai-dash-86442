import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const BulkUpload = ({ onSuccess }: { onSuccess: () => void }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      ["name", "index_number", "grade", "section", "specialty", "status"],
      ["John Doe", "12345", "10", "A", "Science", "active"],
      ["Jane Smith", "12346", "11", "B", "Arts", "active"]
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_upload_template.csv";
    a.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResults(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",").map(h => h.trim());

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length < 4) continue; // Skip incomplete rows

        const studentData: any = {};
        headers.forEach((header, index) => {
          studentData[header] = values[index] || null;
        });

        // Validate required fields
        if (!studentData.name || !studentData.index_number || !studentData.grade) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          failed++;
          continue;
        }

        try {
          // Insert student with user_id
          const { error } = await supabase.from("students").insert([{
            user_id: user.id,
            name: studentData.name,
            index_number: studentData.index_number,
            grade: studentData.grade,
            section: studentData.section || null,
            specialty: studentData.specialty || null,
            status: studentData.status || "active"
          }]);

          if (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
            failed++;
          } else {
            success++;
          }
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
          failed++;
        }
      }

      setResults({ success, failed, errors });

      if (success > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully added ${success} students${failed > 0 ? `, ${failed} failed` : ""}`,
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-primary/20">
        <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle>Bulk Student Upload</CardTitle>
        </div>
        <CardDescription>
          Upload multiple students at once using CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2 flex-1"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="gap-2 flex-1 bg-gradient-primary"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload CSV
              </>
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        {results && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              <span className="font-semibold">Upload Results</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-secondary">✓ {results.success} students added successfully</p>
              {results.failed > 0 && (
                <p className="text-destructive">✗ {results.failed} students failed</p>
              )}
            </div>
            {results.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Errors:
                </p>
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                  {results.errors.map((error, i) => (
                    <p key={i}>• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">CSV Format:</p>
          <p>• Required: name, index_number, grade</p>
          <p>• Optional: section, specialty, status</p>
          <p>• First row must be headers</p>
        </div>
      </CardContent>
    </Card>
  );
};
