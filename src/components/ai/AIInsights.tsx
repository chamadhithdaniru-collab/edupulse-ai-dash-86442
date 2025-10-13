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
    <Card className="border-accent/30 shadow-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-accent">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
              <CardDescription>Predictive analytics and smart recommendations</CardDescription>
            </div>
          </div>
          <Button
            onClick={generateInsights}
            disabled={loading}
            className="bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity shadow-accent gap-2"
          >
            <Brain className="h-4 w-4" />
            {loading ? "Analyzing..." : "Generate Insights"}
          </Button>
        </div>
      </CardHeader>
      {insights && (
        <CardContent className="space-y-4">
          {/* At-Risk Prediction */}
          {insights.atRiskStudents && insights.atRiskStudents.length > 0 && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive mb-2">At-Risk Students Detected</h3>
                  <ul className="space-y-1 text-sm">
                    {insights.atRiskStudents.map((student: string, i: number) => (
                      <li key={i} className="text-muted-foreground">• {student}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Trends */}
          {insights.trends && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-accent mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-accent">Attendance Trends</h3>
                  <p className="text-sm text-muted-foreground">{insights.trends}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
              <h3 className="font-semibold mb-2 text-secondary">Smart Recommendations</h3>
              <ul className="space-y-1 text-sm">
                {insights.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-muted-foreground">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
