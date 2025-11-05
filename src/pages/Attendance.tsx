import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { AttendanceTracking } from "@/components/attendance/AttendanceTracking";
import { CameraAttendance } from "@/components/attendance/CameraAttendance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Camera } from "lucide-react";

const Attendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(new Date());

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
    setLoading(false);
  };

  const handleUpdate = () => {
    // Trigger refresh
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
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="gap-2">
              <Calendar className="h-4 w-4" />
              Manual Tracking
            </TabsTrigger>
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="h-4 w-4" />
              Camera Capture
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="mt-0">
            <AttendanceTracking onUpdate={handleUpdate} />
          </TabsContent>
          
          <TabsContent value="camera" className="mt-0">
            <CameraAttendance selectedDate={selectedDate} onUpdate={handleUpdate} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Attendance;
