import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscript: (text: string, field: string) => void;
  field: string;
  label: string;
}

export const VoiceInput = ({ onTranscript, field, label }: VoiceInputProps) => {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setRecording(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      onTranscript(text, field);
      toast({
        title: "Voice Captured",
        description: `Transcribed: "${text}"`,
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      toast({
        title: "Recognition Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive",
      });
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Button
          type="button"
          size="sm"
          variant={recording ? "destructive" : "outline"}
          onClick={recording ? stopRecording : startRecording}
          className="gap-2"
        >
          {recording ? (
            <>
              <MicOff className="h-3 w-3" />
              Stop
            </>
          ) : (
            <>
              <Mic className="h-3 w-3" />
              Voice
            </>
          )}
        </Button>
      </div>
      {transcript && (
        <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          Captured: {transcript}
        </p>
      )}
    </div>
  );
};
