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
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Please log in to upload students");
      }

      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file is empty or has no data rows");
      }

      const headers = lines[0].split(",").map(h => h.trim());
      
      // Validate headers
      if (!headers.includes("name") || !headers.includes("index_number") || !headers.includes("grade")) {
        throw new Error("CSV must have headers: name, index_number, grade");
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      
      // Process in batches of 100 for better performance
      const BATCH_SIZE = 100;
      const totalRows = lines.length - 1;
      
      for (let batchStart = 1; batchStart < lines.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, lines.length);
        const batchData: any[] = [];
        
        // Prepare batch
        for (let i = batchStart; i < batchEnd; i++) {
          const values = lines[i].split(",").map(v => v.trim());
          if (values.length < 4) {
            errors.push(`Row ${i + 1}: Incomplete row`);
            failed++;
            continue;
          }

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

          batchData.push({
            user_id: user.id,
            name: studentData.name,
            index_number: studentData.index_number,
            grade: studentData.grade,
            section: studentData.section || null,
            specialty: studentData.specialty || null,
            status: studentData.status?.toLowerCase() === "active" ? "active" : 
                   studentData.status?.toLowerCase() === "inactive" ? "inactive" :
                   studentData.status?.toLowerCase() === "graduated" ? "graduated" : "active"
          });
        }

        // Insert batch
        if (batchData.length > 0) {
          const { error } = await supabase.from("students").insert(batchData);
          
          if (error) {
            // If batch fails, try individual inserts for this batch
            for (let j = 0; j < batchData.length; j++) {
              const rowNum = batchStart + j + 1;
              const { error: individualError } = await supabase.from("students").insert([batchData[j]]);
              
              if (individualError) {
                errors.push(`Row ${rowNum}: ${individualError.message}`);
                failed++;
              } else {
                success++;
              }
            }
          } else {
            success += batchData.length;
          }
        }
        
        // Update progress
        const progress = Math.round((batchEnd / totalRows) * 100);
        toast({
          title: "Uploading...",
          description: `Progress: ${progress}% (${batchEnd}/${totalRows} rows processed)`,
        });
      }

      setResults({ success, failed, errors: errors.slice(0, 50) }); // Limit errors shown

      if (success > 0) {
        toast({
          title: "Upload Complete! ✓",
          description: `Successfully added ${success} students${failed > 0 ? `, ${failed} failed` : ""}`,
        });
        onSuccess();
      } else {
        toast({
          title: "Upload Failed",
          description: `No students were added. Check the errors below.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
      setResults(null);
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
