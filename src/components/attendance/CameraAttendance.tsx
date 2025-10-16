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
    <Card className="overflow-hidden bg-gradient-card border-primary/20 shadow-accent">
      <div className="p-4 space-y-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary shrink-0" />
          <h3 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI-Powered Attendance
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Capture your attendance register - AI reads index numbers and marks (1=present, 0=absent)
        </p>
      </div>
      
      <div className="p-4 space-y-3">
        {!capturedImage ? (
          <div className="space-y-3">
            <div className="w-full rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted/30 relative" style={{ aspectRatio: '4/3' }}>
              {streaming ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2">
                  <Camera className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    Take a clear photo of your attendance register
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {!streaming ? (
                <>
                  <Button
                    onClick={startCamera}
                    disabled={loading}
                    className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-sm h-10"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Start Camera</span>
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    variant="outline"
                    className="w-full gap-2 text-sm h-10"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={capturePhoto}
                    disabled={loading}
                    className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-sm h-10"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Capture</span>
                  </Button>
                  <Button
                    onClick={stopCamera}
                    disabled={loading}
                    variant="outline"
                    className="w-full gap-2 text-sm h-10"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-full rounded-lg overflow-hidden border-2 border-primary/30 bg-muted/30" style={{ aspectRatio: '4/3' }}>
              <img
                src={capturedImage}
                alt="Captured register"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={processAttendance}
                disabled={loading}
                className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-sm h-10"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Process</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setCapturedImage(null)}
                disabled={loading}
                variant="outline"
                className="w-full gap-2 text-sm h-10"
              >
                Retake
              </Button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  );
};
