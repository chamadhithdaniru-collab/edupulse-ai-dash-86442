import { Card } from "@/components/ui/card";
import { BookOpen, TrendingUp, Users, GraduationCap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const mockTrendData = [
  { month: 'Jan', attendance: 92 },
  { month: 'Feb', attendance: 88 },
  { month: 'Mar', attendance: 94 },
  { month: 'Apr', attendance: 90 },
  { month: 'May', attendance: 87 },
  { month: 'Jun', attendance: 93 },
];

const articles = {
  en: [
    {
      title: "The Impact of Regular Attendance on Academic Success",
      excerpt: "Studies show that students with 95%+ attendance are 3x more likely to achieve top grades.",
      icon: TrendingUp,
    },
    {
      title: "Building Better Study Habits",
      excerpt: "Consistency in attendance creates discipline and routine, essential for effective learning.",
      icon: BookOpen,
    },
    {
      title: "Social Development Through School",
      excerpt: "Regular school attendance enhances social skills, teamwork, and emotional intelligence.",
      icon: Users,
    },
  ],
  si: [
    {
      title: "නිතිපතා පැමිණීම අධ්‍යාපනික සාර්ථකත්වයට බලපාන ආකාරය",
      excerpt: "95%+ පැමිණීමක් ඇති සිසුන් ඉහළ ශ්‍රේණි ලබා ගැනීමට 3 ගුණයක් වැඩි ඉඩක් ඇත.",
      icon: TrendingUp,
    },
    {
      title: "වඩා හොඳ ඉගෙනුම් පුරුදු ගොඩනැගීම",
      excerpt: "පැමිණීමේ නියමිතතාව විනය සහ පුරුද්ද නිර්මාණය කරයි, ඵලදායී ඉගෙනීම සඳහා අත්‍යවශ්‍ය වේ.",
      icon: BookOpen,
    },
    {
      title: "පාසල හරහා සමාජ සංවර්ධනය",
      excerpt: "නිතිපතා පාසල් පැමිණීම සමාජ කුසලතා, කණ්ඩායම් වැඩ සහ චිත්තවේගීය බුද්ධිය වර්ධනය කරයි.",
      icon: Users,
    },
  ],
  ta: [
    {
      title: "வழக்கமான வருகை கல்வி வெற்றியில் ஏற்படுத்தும் தாக்கம்",
      excerpt: "95%+ வருகை உள்ள மாணவர்கள் சிறந்த மதிப்பெண்களைப் பெற 3 மடங்கு வாய்ப்பு உள்ளது.",
      icon: TrendingUp,
    },
    {
      title: "சிறந்த படிப்பு பழக்கங்களை உருவாக்குதல்",
      excerpt: "வருகையில் நிலைத்தன்மை ஒழுக்கம் மற்றும் வழக்கத்தை உருவாக்குகிறது.",
      icon: BookOpen,
    },
    {
      title: "பள்ளி மூலம் சமூக வளர்ச்சி",
      excerpt: "வழக்கமான பள்ளி வருகை சமூக திறன்கள், குழுப்பணி மற்றும் உணர்ச்சி நுண்ணறிவை மேம்படுத்துகிறது.",
      icon: Users,
    },
  ],
  ar: [
    {
      title: "باقاعدہ حاضری کا تعلیمی کامیابی پر اثر",
      excerpt: "95%+ حاضری والے طلباء کو اعلیٰ گریڈ حاصل کرنے کا 3 گنا زیادہ امکان ہے۔",
      icon: TrendingUp,
    },
    {
      title: "بہتر مطالعہ کی عادات بنانا",
      excerpt: "حاضری میں مستقل مزاجی نظم و ضبط اور معمول پیدا کرتی ہے۔",
      icon: BookOpen,
    },
    {
      title: "اسکول کے ذریعے سماجی ترقی",
      excerpt: "باقاعدہ اسکول کی حاضری سماجی مہارت، ٹیم ورک اور جذباتی ذہانت کو بڑھاتی ہے۔",
      icon: Users,
    },
  ],
};

export const EducationalInsights = () => {
  const { t, language } = useLanguage();
  const currentArticles = articles[language];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-primary">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {t('insights.title')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('insights.importance')}</p>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <Card className="p-4 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Attendance Trend (Last 6 Months)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mockTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="attendance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Educational Articles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {currentArticles.map((article, index) => {
          const Icon = article.icon;
          return (
            <Card 
              key={index}
              className="p-4 border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:shadow-lg bg-gradient-to-br from-card to-secondary/5 group"
            >
              <div className="space-y-3">
                <div className="p-2 rounded-lg bg-gradient-primary w-fit group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
                <button className="text-xs text-primary font-medium hover:underline">
                  {t('insights.readMore')} →
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
