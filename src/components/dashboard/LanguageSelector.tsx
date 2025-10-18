import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'si' as Language, name: 'සිංහල', flag: '🇱🇰' },
  { code: 'ta' as Language, name: 'தமிழ்', flag: '🇱🇰' },
  { code: 'ar' as Language, name: 'اردو', flag: '🇵🇰' },
];

export const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
          <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border z-50">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? 'bg-primary/10' : ''}`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
