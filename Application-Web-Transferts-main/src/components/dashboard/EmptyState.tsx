import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ message, actionLabel, onAction }: Props) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Inbox className="h-8 w-8 text-muted-foreground" />
    </div>
    <p className="text-muted-foreground mb-4">{message}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="gap-2 shadow-button">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
