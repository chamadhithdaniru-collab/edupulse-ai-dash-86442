import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { LanguageSelector } from "@/components/dashboard/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/95 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              {t('app.title')}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t('app.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSelector />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3">
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">{t('header.signOut')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
