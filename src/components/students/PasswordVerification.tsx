import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface PasswordVerificationProps {
  open: boolean;
  onVerified: () => void;
  onCancel: () => void;
  title: string;
  description: string;
}

export const PasswordVerification = ({ 
  open, 
  onVerified, 
  onCancel,
  title,
  description 
}: PasswordVerificationProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    const storedPassword = localStorage.getItem("edupulse_security_password");
    
    if (!storedPassword) {
      // First time setup
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      localStorage.setItem("edupulse_security_password", password);
      onVerified();
    } else {
      // Verify existing password
      if (password === storedPassword) {
        onVerified();
      } else {
        setError("Incorrect password");
        setPassword("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {localStorage.getItem("edupulse_security_password") 
                ? "Enter your security password" 
                : "Create a security password"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Enter password"
              className="border-primary/20"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleVerify} className="flex-1 bg-gradient-primary">
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
