import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-11 border-b border-border bg-background flex items-center px-4 gap-3 flex-shrink-0">
      <h1 className="text-sm font-semibold">{title}</h1>
      <div className="ml-auto">
        <Button variant="outline" size="sm" disabled>
          <Upload size={13} className="mr-1" />
          CSV取込
        </Button>
      </div>
    </header>
  );
}
