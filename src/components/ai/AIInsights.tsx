import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Fetch students and attendance data
      const { data: students } = await supabase
        .from("students")
        .select("*");

      const { data: attendanceRecords } = await supabase
        .from("attendance")
        .select("*")
        .order("date", { ascending: false })
        .limit(100);

      if (!students || students.length === 0) {
        toast({
          title: "No data",
          description: "Add students first to generate AI insights",
        });
        setLoading(false);
        return;
      }

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { students, attendanceRecords }
      });

      if (error) throw error;

      setInsights(data);
      toast({
        title: "Success",
        description: "AI insights generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/30 shadow-accent overflow-hidden bg-gradient-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-accent shrink-0">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-2xl truncate">AI-Powered Insights</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Predictive analytics and recommendations</CardDescription>
            </div>
          </div>
          <Button
            onClick={generateInsights}
            disabled={loading}
            className="bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity shadow-accent gap-2 w-full sm:w-auto h-9 text-sm shrink-0"
          >
            <Brain className="h-4 w-4" />
            {loading ? "Analyzing..." : "Generate Insights"}
          </Button>
        </div>
      </CardHeader>
      {insights && (
        <CardContent className="space-y-3 pt-0">
          {/* At-Risk Prediction */}
          {insights.atRiskStudents && insights.atRiskStudents.length > 0 && (
            <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-destructive mb-2 text-sm sm:text-base">At-Risk Students ({insights.atRiskStudents.length})</h3>
                  <ul className="space-y-1 text-xs sm:text-sm">
                    {insights.atRiskStudents.map((student: string, i: number) => (
                      <li key={i} className="text-muted-foreground break-words">• {student}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Trends */}
          {insights.trends && (
            <div className="p-3 sm:p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-2 sm:gap-3">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-accent mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-2 text-accent text-sm sm:text-base">Attendance Trends & Analysis</h3>
                  <div className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">{insights.trends}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="p-3 sm:p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <h3 className="font-semibold mb-2 text-secondary text-sm sm:text-base">Smart Recommendations ({insights.recommendations.length})</h3>
              <ul className="space-y-1 text-xs sm:text-sm">
                {insights.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-muted-foreground break-words">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
