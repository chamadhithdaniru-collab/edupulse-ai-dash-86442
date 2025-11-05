import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'si' | 'ta' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'app.title': 'EduPulse',
    'app.subtitle': 'Teacher Dashboard',
    'header.signOut': 'Sign Out',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Students',
    'nav.attendance': 'Attendance',
    'nav.insights': 'Insights',
    
    // Stats
    'stats.totalStudents': 'Total Students',
    'stats.avgAttendance': 'Average Attendance',
    'stats.atRisk': 'At-Risk Students',
    
    // Insights
    'insights.title': 'Educational Insights',
    'insights.importance': 'Why Attendance Matters',
    'insights.description': 'Regular school attendance is crucial for academic success and personal development.',
    'insights.readMore': 'Read More',
    
    // Camera
    'camera.title': 'AI Camera Attendance',
    'camera.openCamera': 'Open Camera',
    'camera.uploadImage': 'Upload Image',
    'camera.capture': 'Capture Photo',
    'camera.process': 'Process',
    'camera.cancel': 'Cancel',
    'camera.retake': 'Retake',
    
    // Settings
    'settings.language': 'Language',
    'settings.title': 'Settings',
  },
  si: {
    // Sinhala
    'app.title': 'EduPulse',
    'app.subtitle': 'ගුරු පාලක පුවරුව',
    'header.signOut': 'වරන්න',
    
    'nav.dashboard': 'මුල් පිටුව',
    'nav.students': 'සිසුන්',
    'nav.attendance': 'පැමිණීම',
    'nav.insights': 'තීක්ෂණ',
    
    'stats.totalStudents': 'සිසුන් සංඛ්‍යාව',
    'stats.avgAttendance': 'සාමාන්‍ය පැමිණීම',
    'stats.atRisk': 'අවදානම් සිසුන්',
    
    'insights.title': 'අධ්‍යාපනික තීක්ෂණ',
    'insights.importance': 'පැමිණීම වැදගත් වන්නේ ඇයි',
    'insights.description': 'අධ්‍යාපනික සාර්ථකත්වය සහ පෞද්ගලික වර්ධනය සඳහා නිතිපතා පාසල් පැමිණීම ඉතා වැදගත් වේ.',
    'insights.readMore': 'තව කියවන්න',
    
    'camera.title': 'AI කැමරා පැමිණීම',
    'camera.openCamera': 'කැමරාව විවෘත කරන්න',
    'camera.uploadImage': 'පින්තූරය උඩුගත කරන්න',
    'camera.capture': 'ඡායාරූපය ග්‍රහණය කරන්න',
    'camera.process': 'ක්‍රියාත්මක කරන්න',
    'camera.cancel': 'අවලංගු කරන්න',
    'camera.retake': 'නැවත ගන්න',
    
    'settings.language': 'භාෂාව',
    'settings.title': 'සැකසුම්',
  },
  ta: {
    // Tamil
    'app.title': 'EduPulse',
    'app.subtitle': 'ஆசிரியர் டாஷ்போர்டு',
    'header.signOut': 'வெளியேறு',
    
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.students': 'மாணவர்கள்',
    'nav.attendance': 'வருகை',
    'nav.insights': 'நுண்ணறிவுகள்',
    
    'stats.totalStudents': 'மொத்த மாணவர்கள்',
    'stats.avgAttendance': 'சராசரி வருகை',
    'stats.atRisk': 'அபாயத்தில் உள்ள மாணவர்கள்',
    
    'insights.title': 'கல்வி நுண்ணறிவுகள்',
    'insights.importance': 'வருகை ஏன் முக்கியம்',
    'insights.description': 'கல்வி வெற்றி மற்றும் தனிப்பட்ட வளர்ச்சிக்கு வழக்கமான பள்ளி வருகை முக்கியமானது.',
    'insights.readMore': 'மேலும் வாசிக்க',
    
    'camera.title': 'AI கேமரா வருகை',
    'camera.openCamera': 'கேமராவைத் திற',
    'camera.uploadImage': 'படத்தை பதிவேற்று',
    'camera.capture': 'புகைப்படம் எடு',
    'camera.process': 'செயல்படுத்து',
    'camera.cancel': 'ரத்துசெய்',
    'camera.retake': 'மீண்டும் எடு',
    
    'settings.language': 'மொழி',
    'settings.title': 'அமைப்புகள்',
  },
  ar: {
    // Arabic/Urdu
    'app.title': 'EduPulse',
    'app.subtitle': 'استاذ ڈیش بورڈ',
    'header.signOut': 'باہر نکلیں',
    
    'nav.dashboard': 'ڈیش بورڈ',
    'nav.students': 'طلباء',
    'nav.attendance': 'حاضری',
    'nav.insights': 'بصیرت',
    
    'stats.totalStudents': 'کل طالب علم',
    'stats.avgAttendance': 'اوسط حاضری',
    'stats.atRisk': 'خطرے میں طلباء',
    
    'insights.title': 'تعلیمی بصیرت',
    'insights.importance': 'حاضری کیوں ضروری ہے',
    'insights.description': 'تعلیمی کامیابی اور ذاتی ترقی کے لیے باقاعدہ اسکول میں حاضری بہت ضروری ہے۔',
    'insights.readMore': 'مزید پڑھیں',
    
    'camera.title': 'AI کیمرہ حاضری',
    'camera.openCamera': 'کیمرا کھولیں',
    'camera.uploadImage': 'تصویر اپ لوڈ کریں',
    'camera.capture': 'تصویر لیں',
    'camera.process': 'عمل کریں',
    'camera.cancel': 'منسوخ کریں',
    'camera.retake': 'دوبارہ لیں',
    
    'settings.language': 'زبان',
    'settings.title': 'ترتیبات',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
