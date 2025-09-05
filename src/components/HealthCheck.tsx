import { useQuery } from "@tanstack/react-query";
import { healthApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export const HealthCheck = () => {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.check().then(res => res.data),
    refetchInterval: 30000, // Check every 30 seconds
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-xs">
        <Clock className="w-3 h-3 mr-1" />
        Checking...
      </Badge>
    );
  }

  if (error || !health) {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertCircle className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-success/20 text-success border-success/20 text-xs">
      <CheckCircle className="w-3 h-3 mr-1" />
      Online
    </Badge>
  );
};