import { useState, useCallback, useRef } from "react";
import { UploadCloud, X, FileImage, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  isLoading?: boolean;
}

export function FileUpload({ onFileSelect, accept = "image/jpeg, image/png", maxSizeMB = 10, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndProcessFile = (file: File) => {
    setError(null);
    if (!file.type.match(/(jpeg|png)$/i)) {
      setError("Please upload a valid JPEG or PNG image.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, [maxSizeMB, onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative group border-2 border-dashed rounded-xl p-12 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        } ${isLoading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-105 transition-transform duration-200">
          <UploadCloud className="w-8 h-8 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold mb-1">Click to upload or drag and drop</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Supported formats: JPEG, PNG. Maximum file size: {maxSizeMB}MB.
        </p>

        {error && (
          <div className="mt-4 text-sm text-destructive font-medium bg-destructive/10 px-3 py-1.5 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
