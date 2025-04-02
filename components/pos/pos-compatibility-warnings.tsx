import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface POSCompatibilityWarningsProps {
  warnings: string[];
}

export function POSCompatibilityWarnings({ warnings }: POSCompatibilityWarningsProps) {
  if (warnings.length === 0) return null;
  
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Compatibility Warning</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 mt-2">
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
} 