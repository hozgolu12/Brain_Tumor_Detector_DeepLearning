import { useState } from "react";
import { useGetPredictionStats, useListPredictions, useGetModelInfo, usePredictTumor, getGetPredictionStatsQueryKey, getListPredictionsQueryKey, getGetModelInfoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { Activity, AlertTriangle, FileImage, ShieldCheck, ActivitySquare, Server, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetPredictionStats({ query: { queryKey: getGetPredictionStatsQueryKey() } });
  const { data: recent, isLoading: recentLoading } = useListPredictions({ query: { queryKey: getListPredictionsQueryKey() } });
  const { data: model, isLoading: modelLoading } = useGetModelInfo({ query: { queryKey: getGetModelInfoQueryKey() } });
  const predictMutation = usePredictTumor();
  
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatConfidence = (val: number) => `${(val * 100).toFixed(1)}%`;

  const handleFileSelect = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setShowResultDialog(true);
    
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
            setShowResultDialog(false);
          }
        }
      );
    };
  };

  const result = predictMutation.data;
  const isPending = predictMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 md:p-10 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">NeuroScan Diagnostic Assistant</h1>
          <p className="text-lg text-muted-foreground">Upload a brain MRI scan to receive an immediate classification using our advanced neural network model.</p>
          
          <div className="bg-background rounded-xl shadow-sm border p-4 max-w-lg mx-auto">
            <FileUpload onFileSelect={handleFileSelect} isLoading={isPending} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
            <FileImage className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-7 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.total.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">+{stats?.last24h ?? 0} in last 24h</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Confidence</CardTitle>
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-7 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats ? formatConfidence(stats.averageConfidence) : "0%"}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all predictions</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tumors Detected</CardTitle>
            <ActivitySquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-7 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{stats?.tumorDetected.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats && stats.total > 0 ? ((stats.tumorDetected / stats.total) * 100).toFixed(1) : 0}% detection rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            <Server className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {modelLoading ? <Skeleton className="h-7 w-20" /> : (
              <>
                <div className="text-2xl font-bold text-primary">Online</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1" title={model?.backend}>
                  Backend: {model?.backend}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Class Distribution</CardTitle>
            <CardDescription>Breakdown of all processed predictions</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {statsLoading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : stats?.byClass && stats.byClass.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byClass} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tickFormatter={(val) => val.replace('_', ' ').replace(/\b\w/g, (l:string) => l.toUpperCase())} className="text-xs" />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value: number) => [value, 'Count']} labelFormatter={(label) => label.replace('_', ' ').toUpperCase()} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.byClass.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" opacity={entry.label === 'no_tumor' ? 0.5 : 0.8 + (index * 0.1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>Latest prediction results</CardDescription>
            </div>
            <Link href="/history" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : recent && recent.length > 0 ? (
              <div className="space-y-4">
                {recent.slice(0, 4).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setLocation('/history')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                        {scan.imageDataUrl ? (
                          <img src={scan.imageDataUrl} alt="Scan thumbnail" className="w-full h-full object-cover" />
                        ) : (
                          <FileImage className="w-5 h-5 m-2.5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none line-clamp-1">{scan.filename}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold capitalize ${scan.predictedClass !== 'no_tumor' ? 'text-destructive' : 'text-primary'}`}>
                        {scan.predictedClass.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {formatConfidence(scan.confidence)} conf
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p>No recent scans found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showResultDialog} onOpenChange={(o) => {
        if (!o && !isPending) {
          setShowResultDialog(false);
          predictMutation.reset();
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Analysis Result</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="bg-muted/30 rounded-lg border flex items-center justify-center p-2 min-h-[300px]">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="MRI Scan" 
                  className={`max-w-full max-h-[400px] object-contain rounded transition-opacity duration-300 ${isPending ? 'opacity-50 grayscale' : 'opacity-100'}`} 
                />
              )}
            </div>
            
            <div className="space-y-6 flex flex-col justify-center">
              {isPending ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium text-lg text-foreground">Analyzing Scan...</p>
                  <p className="text-sm">Applying classification model</p>
                </div>
              ) : result ? (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className={`p-6 rounded-xl border ${result.predictedClass !== 'no_tumor' ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
                    <div className="flex flex-col items-center text-center space-y-2 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        {result.predictedClass !== 'no_tumor' ? (
                          <AlertTriangle className="w-6 h-6 text-destructive" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Classification</span>
                      <span className={`text-3xl font-bold capitalize ${result.predictedClass !== 'no_tumor' ? 'text-destructive' : 'text-primary'}`}>
                        {result.predictedClass.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                        {(result.confidence * 100).toFixed(2)}% Confidence
                      </span>
                    </div>

                    <Button onClick={() => {
                      setShowResultDialog(false);
                      predictMutation.reset();
                    }} className="w-full gap-2">
                      Close <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

