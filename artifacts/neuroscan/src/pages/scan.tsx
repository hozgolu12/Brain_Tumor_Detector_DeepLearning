import { useState } from "react";
import { usePredictTumor, getListPredictionsQueryKey, getGetPredictionStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileUpload } from "@/components/file-upload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

export default function Scan() {
  const queryClient = useQueryClient();
  const predictMutation = usePredictTumor();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      
      predictMutation.mutate(
        { data: { imageBase64: base64Data, filename: file.name } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPredictionStatsQueryKey() });
            toast.success("Scan analyzed successfully");
          },
          onError: (err: any) => {
            console.error(err);
            toast.error("Failed to analyze scan. Please try again.");
          }
        }
      );
    };
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    predictMutation.reset();
  };

  const result = predictMutation.data;
  const isPending = predictMutation.isPending;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Scan Analysis</h1>
        <p className="text-muted-foreground mt-1">Upload an MRI image to run the detection model.</p>
      </div>

      {!selectedFile ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-8">
            <FileUpload onFileSelect={handleFileSelect} isLoading={isPending} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Input Scan</CardTitle>
              <CardDescription className="line-clamp-1" title={selectedFile.name}>{selectedFile.name}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-muted/30 relative flex items-center justify-center min-h-[300px]">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="MRI Scan" 
                  className={`max-w-full max-h-[500px] object-contain transition-opacity duration-300 ${isPending ? 'opacity-50 grayscale' : 'opacity-100'}`} 
                />
              )}
              {isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 font-medium text-lg">Analyzing Scan...</p>
                  <p className="text-sm text-muted-foreground mt-1">Applying classification model</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {isPending ? (
              <Card className="h-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-10 h-10 mb-4 animate-spin text-muted-foreground/50" />
                  <p>Processing results...</p>
                </CardContent>
              </Card>
            ) : result ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <Card>
                  <CardHeader className={`pb-4 ${result.predictedClass !== 'no_tumor' ? 'bg-destructive/5 border-b border-destructive/10' : 'bg-primary/5 border-b border-primary/10'}`}>
                    <CardTitle className="flex items-center gap-2">
                      {result.predictedClass !== 'no_tumor' ? (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                      Diagnostic Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-2 mb-8">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Primary Classification</span>
                      <span className={`text-3xl font-bold capitalize ${result.predictedClass !== 'no_tumor' ? 'text-destructive' : 'text-primary'}`}>
                        {result.predictedClass.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                        {(result.confidence * 100).toFixed(2)}% Confidence
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground border-b pb-2">Probability Distribution</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.probabilities} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                            <XAxis type="number" domain={[0, 1]} hide />
                            <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tickFormatter={(val) => val.replace('_', ' ').replace(/\b\w/g, (l:string) => l.toUpperCase())} width={100} className="text-xs" />
                            <Tooltip 
                              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                              formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Probability']}
                              labelFormatter={(label) => label.replace('_', ' ').toUpperCase()}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={20}>
                              {result.probabilities.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.label === result.predictedClass ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} opacity={entry.label === result.predictedClass ? 1 : 0.4} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Button onClick={handleReset} className="w-full gap-2" size="lg">
                  Analyze Another Scan <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : predictMutation.isError ? (
               <Card className="h-full border-destructive/50 bg-destructive/5">
                <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center text-destructive">
                  <AlertTriangle className="w-10 h-10 mb-4" />
                  <p className="font-semibold text-lg mb-2">Analysis Failed</p>
                  <p className="text-sm opacity-80 mb-6">There was an error communicating with the model backend.</p>
                  <Button onClick={handleReset} variant="outline" className="border-destructive/20 hover:bg-destructive/10">Try Again</Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
