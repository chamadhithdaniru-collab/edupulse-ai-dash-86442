import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-primary relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo and title */}
      <div className="relative z-10 text-center animate-slide-up">
        <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl">
          <Activity className="w-12 h-12 text-white animate-pulse" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
          EduPulse
        </h1>
        <p className="text-xl text-white/90 font-medium">
          Empowering Every Student
        </p>
        
        {/* Loading indicator */}
        <div className="mt-12 flex gap-2 justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
};

export default Splash;
