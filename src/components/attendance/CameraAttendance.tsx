import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Loader2, X, Check } from "lucide-react";
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
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access not supported in this browser");
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('✅ Camera stream obtained');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setStreaming(true);
            console.log('▶️ Video playing');
            
            toast({
              title: "📸 Camera Ready",
              description: "Position your attendance register in view",
            });
          } catch (playError) {
            console.error('Play error:', playError);
            throw new Error("Could not start video playback");
          }
        };
      }
    } catch (error: any) {
      console.error('❌ Camera error:', error);
      let errorMessage = "Could not access camera.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is in use by another app.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Camera track stopped');
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStreaming(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
        
        toast({
          title: "Photo Captured",
          description: "Review and process attendance",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Camera not ready, please wait",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        toast({
          title: "Image Uploaded",
          description: "Review and process attendance",
        });
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
        title: "✅ Attendance Updated",
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
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm shadow-lg">
      <div className="p-3 sm:p-4 space-y-1 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Camera Attendance
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              Scan register: Index numbers + marks (1=present, 0=absent)
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 space-y-3">
        {!capturedImage ? (
          <div className="space-y-3">
            {/* Camera/Upload Container */}
            <div className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-primary/40 bg-gradient-to-br from-muted/50 to-muted/30 shadow-inner" 
                 style={{ aspectRatio: '4/3', minHeight: '240px', maxHeight: '400px' }}>
              {streaming ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center gap-3">
                  <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm">
                    <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      Capture Attendance Register
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground max-w-[200px]">
                      Take a clear photo showing index numbers and attendance marks
                    </p>
                  </div>
                </div>
              )}
              
              {streaming && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <div className="px-2 py-1 rounded-full bg-red-500/90 backdrop-blur-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-medium text-white">LIVE</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {!streaming ? (
                <>
                  <Button
                    onClick={startCamera}
                    disabled={loading}
                    className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm h-10 sm:h-11"
                  >
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Open Camera</span>
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    variant="outline"
                    className="w-full gap-2 border-primary/40 hover:bg-primary/10 text-xs sm:text-sm h-10 sm:h-11"
                  >
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Upload Image</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={capturePhoto}
                    disabled={loading}
                    className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-white shadow-lg text-xs sm:text-sm h-10 sm:h-11"
                  >
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Capture Photo</span>
                  </Button>
                  <Button
                    onClick={stopCamera}
                    disabled={loading}
                    variant="outline"
                    className="w-full gap-2 border-destructive/40 hover:bg-destructive/10 text-destructive text-xs sm:text-sm h-10 sm:h-11"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Cancel</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Captured Image Preview */}
            <div className="relative w-full rounded-xl overflow-hidden border-2 border-primary/40 bg-muted shadow-lg" 
                 style={{ aspectRatio: '4/3', minHeight: '240px', maxHeight: '400px' }}>
              <img
                src={capturedImage}
                alt="Captured register"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3">
                <div className="px-2 py-1 rounded-full bg-green-500/90 backdrop-blur-sm flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-medium text-white">CAPTURED</span>
                </div>
              </div>
            </div>

            {/* Process Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={processAttendance}
                disabled={loading}
                className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm h-10 sm:h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Process</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setCapturedImage(null)}
                disabled={loading}
                variant="outline"
                className="w-full gap-2 border-primary/40 hover:bg-primary/10 text-xs sm:text-sm h-10 sm:h-11"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Retake</span>
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  );
};