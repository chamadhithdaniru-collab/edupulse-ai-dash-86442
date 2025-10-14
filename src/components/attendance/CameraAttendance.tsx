import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CameraAttendanceProps {
  selectedDate: Date;
  onUpdate: () => void;
}

export const CameraAttendance = ({ selectedDate, onUpdate }: CameraAttendanceProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAttendance = async () => {
    if (!capturedImage) {
      toast({
        title: "No Image",
        description: "Please capture or upload an image first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-attendance', {
        body: {
          imageData: capturedImage,
          date: format(selectedDate, 'yyyy-MM-dd')
        }
      });

      if (error) throw error;

      toast({
        title: "Attendance Updated",
        description: `Identified ${data.identified_count} out of ${data.total_students} students.`,
      });

      setCapturedImage(null);
      onUpdate();
    } catch (error: any) {
      console.error('Error processing attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Camera Attendance</h3>
          <p className="text-sm text-muted-foreground">
            Capture a classroom photo to automatically mark attendance using AI
          </p>
        </div>

        {!capturedImage ? (
          <div className="space-y-4">
            {!streaming ? (
              <div className="flex gap-2">
                <Button onClick={startCamera} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Start Camera
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="gap-2">
                    <Camera className="h-4 w-4" />
                    Capture Photo
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <img 
              src={capturedImage} 
              alt="Captured classroom" 
              className="w-full rounded-lg border"
            />
            <div className="flex gap-2">
              <Button 
                onClick={processAttendance} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Attendance'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCapturedImage(null)}
                disabled={loading}
              >
                Retake
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
