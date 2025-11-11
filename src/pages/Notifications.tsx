import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { AttendanceReminder } from "@/components/notifications/AttendanceReminder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadNotifications();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
    setLoading(false);
  };

  const loadNotifications = async () => {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get student count
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id);

      // Get recent attendance updates
      const { data: recentAttendance } = await supabase
        .from("attendance")
        .select("date")
        .gte("date", sevenDaysAgo.toISOString().split('T')[0])
        .in("student_id", students?.map(s => s.id) || []);

      const uniqueDates = new Set(recentAttendance?.map(a => a.date) || []);

      setNotifications([
        {
          id: 1,
          type: "info",
          icon: Users,
          title: "Total Students",
          description: `You have ${students?.length || 0} students enrolled`,
          date: new Date().toISOString(),
        },
        {
          id: 2,
          type: "success",
          icon: Calendar,
          title: "Attendance Updates",
          description: `Attendance updated on ${uniqueDates.size} days this week`,
          date: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl pb-8">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
        </div>

        <AttendanceReminder />

        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <Card key={notification.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        <CardDescription>{notification.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(notification.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
