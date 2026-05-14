import { useState, useMemo } from "react";
import { useListPredictions, getListPredictionsQueryKey, useClearPredictions, useDeletePrediction, getGetPredictionStatsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Search, Filter, AlertTriangle, FileImage, ShieldCheck, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function History() {
  const queryClient = useQueryClient();
  const { data: predictions, isLoading } = useListPredictions({ query: { queryKey: getListPredictionsQueryKey() } });
  const clearMutation = useClearPredictions();
  const deleteMutation = useDeletePrediction();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
      clearMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPredictionStatsQueryKey() });
          toast.success("History cleared successfully");
        },
        onError: (err) => {
          console.error("Clear all failed:", err);
          toast.error("Failed to clear history. See console for details.");
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPredictionStatsQueryKey() });
        setSelectedPrediction(null);
        toast.success("Scan deleted successfully");
      },
      onError: (err) => {
        console.error("Delete failed for ID " + id + ":", err);
        toast.error("Failed to delete scan. See console for details.");
      }
    });
  };

  const filteredPredictions = useMemo(() => {
    if (!predictions) return [];
    if (!searchTerm.trim()) return predictions;
    
    const term = searchTerm.toLowerCase();
    return predictions.filter(p => 
      p.filename.toLowerCase().includes(term) || 
      p.predictedClass.toLowerCase().includes(term)
    );
  }, [predictions, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
          <p className="text-muted-foreground mt-1">Review past predictions and analyses.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by filename or class..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {predictions && predictions.length > 0 && (
            <Button variant="destructive" onClick={handleClearAll} disabled={clearMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 text-sm font-medium text-muted-foreground">
          <div className="col-span-5 md:col-span-4">Scan</div>
          <div className="col-span-4 md:col-span-3">Classification</div>
          <div className="col-span-3 md:col-span-2 text-right">Confidence</div>
          <div className="col-span-12 md:col-span-3 hidden md:block text-right">Date</div>
        </div>
        
        <div className="divide-y">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 grid grid-cols-12 gap-4 items-center">
                <Skeleton className="h-10 col-span-5 md:col-span-4" />
                <Skeleton className="h-6 col-span-4 md:col-span-3" />
                <Skeleton className="h-6 col-span-3 md:col-span-2" />
                <Skeleton className="h-6 col-span-12 md:col-span-3 hidden md:block" />
              </div>
            ))
          ) : filteredPredictions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Filter className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try adjusting your search filters.</p>
            </div>
          ) : (
            filteredPredictions.map((pred, i) => (
              <div 
                key={pred.id} 
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedPrediction(pred)}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="col-span-5 md:col-span-4 flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                    {pred.imageDataUrl ? (
                      <img src={pred.imageDataUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FileImage className="w-5 h-5 m-2.5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="font-medium truncate group-hover:text-primary transition-colors">{pred.filename}</span>
                </div>
                <div className="col-span-4 md:col-span-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                    pred.predictedClass === 'no_tumor' 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {pred.predictedClass.replace('_', ' ')}
                  </span>
                </div>
                <div className="col-span-3 md:col-span-2 text-right font-mono text-sm">
                  {(pred.confidence * 100).toFixed(1)}%
                </div>
                <div className="col-span-12 md:col-span-3 hidden md:block text-right text-sm text-muted-foreground">
                  {format(new Date(pred.createdAt), "MMM d, yyyy HH:mm")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!selectedPrediction} onOpenChange={(o) => !o && setSelectedPrediction(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>Scan Details</DialogTitle>
              {selectedPrediction && (
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedPrediction.id)} disabled={deleteMutation.isPending} className="mr-6">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </DialogHeader>
          {selectedPrediction && (
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="bg-muted/30 rounded-lg border flex items-center justify-center p-2 min-h-[300px]">
                {selectedPrediction.imageDataUrl && (
                  <img src={selectedPrediction.imageDataUrl} alt="Scan" className="max-w-full max-h-[400px] object-contain rounded" />
                )}
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">File Name</h3>
                  <p className="font-medium break-all">{selectedPrediction.filename}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Classification</h3>
                    <p className={`font-semibold capitalize ${selectedPrediction.predictedClass !== 'no_tumor' ? 'text-destructive' : 'text-primary'}`}>
                      {selectedPrediction.predictedClass.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Confidence</h3>
                    <p className="font-mono">{(selectedPrediction.confidence * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Date Scanned</h3>
                    <p className="text-sm">{format(new Date(selectedPrediction.createdAt), "PP pp")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Processing Time</h3>
                    <p className="text-sm">{selectedPrediction.processingTimeMs}ms</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Probabilities</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedPrediction.probabilities} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 1]} hide />
                        <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tickFormatter={(val) => val.replace('_', ' ').replace(/\b\w/g, (l:string) => l.toUpperCase())} width={90} className="text-xs" />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(val: number) => `${(val * 100).toFixed(1)}%`} />
                        <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={16}>
                          {selectedPrediction.probabilities.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.label === selectedPrediction.predictedClass ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} opacity={entry.label === selectedPrediction.predictedClass ? 1 : 0.5} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
