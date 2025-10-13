import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  loading?: boolean;
}

export const StatsCard = ({ title, value, icon: Icon, gradient, loading }: StatsCardProps) => {
  return (
    <Card className="relative overflow-hidden border-primary/20 hover:shadow-primary transition-all duration-300 hover:scale-105">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
