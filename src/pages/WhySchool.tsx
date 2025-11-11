import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Heart, Users, Brain, Target, Sparkles } from "lucide-react";

const WhySchool = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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

  const reasons = [
    {
      icon: Brain,
      title: "Knowledge & Skills",
      description: "Education provides fundamental knowledge and practical skills essential for personal growth and career success.",
      color: "text-blue-600"
    },
    {
      icon: Users,
      title: "Social Development",
      description: "Schools foster social interactions, teaching students how to communicate, collaborate, and build meaningful relationships.",
      color: "text-green-600"
    },
    {
      icon: Target,
      title: "Future Opportunities",
      description: "Quality education opens doors to better career prospects, higher income potential, and improved quality of life.",
      color: "text-purple-600"
    },
    {
      icon: Heart,
      title: "Character Building",
      description: "Education shapes values, ethics, and character, helping students become responsible and compassionate citizens.",
      color: "text-red-600"
    },
    {
      icon: Sparkles,
      title: "Critical Thinking",
      description: "Schools develop analytical and problem-solving skills that are crucial for navigating life's challenges.",
      color: "text-amber-600"
    },
    {
      icon: GraduationCap,
      title: "Lifelong Learning",
      description: "Education instills a love for learning that continues throughout life, promoting continuous personal development.",
      color: "text-indigo-600"
    }
  ];

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
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 max-w-7xl pb-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Why Education Matters
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Education is the foundation of personal growth, societal progress, and a brighter future for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <Card key={index} className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className={`h-6 w-6 ${reason.color}`} />
                    </div>
                    <CardTitle className="text-xl">{reason.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {reason.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl text-center">The Impact of Quality Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-lg">
              Every day in school is an investment in a student's future. Through EduPulse, we ensure that 
              every student receives the attention and support they need to thrive.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-primary">90%</p>
                <p className="text-sm text-muted-foreground">Student Success Rate</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">Teacher Engagement</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">AI Support Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WhySchool;
