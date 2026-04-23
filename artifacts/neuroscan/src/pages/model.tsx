import { useGetModelInfo, getGetModelInfoQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Cpu, Layers, TerminalSquare, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function Model() {
  const { data: model, isLoading } = useGetModelInfo({ query: { queryKey: getGetModelInfoQueryKey() } });
  const [copied, setCopied] = useState(false);

  const mockCodeSnippet = `import requests
import json

# Your backend service URL
MODEL_SERVICE_URL = "http://your-inference-service/predict"

def predict_scan(base64_image_string, filename="scan.jpg"):
    payload = {
        "imageBase64": base64_image_string,
        "filename": filename
    }
    
    response = requests.post(
        MODEL_SERVICE_URL,
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    return response.json()
    
# Expected response format:
# {
#   "predictedClass": "glioma",
#   "confidence": 0.942,
#   "probabilities": [
#     {"label": "glioma", "probability": 0.942},
#     {"label": "meningioma", "probability": 0.031},
#     {"label": "pituitary", "probability": 0.015},
#     {"label": "no_tumor", "probability": 0.012}
#   ]
# }`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mockCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Model Configuration</h1>
        <p className="text-muted-foreground mt-1">Technical details and integration specifications for the inference backend.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> Active Model</CardTitle>
            <CardDescription>Currently loaded model properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : model ? (
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{model.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Version</p>
                  <Badge variant="outline" className="font-mono">{model.version}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${model.loaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{model.loaded ? 'Loaded & Ready' : 'Offline'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Backend Engine</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">{model.backend}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Expected Input Size</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">{model.inputSize}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Unable to fetch model details.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Output Classes</CardTitle>
            <CardDescription>Supported classification targets</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <Skeleton className="h-24 w-full" />
             ) : model ? (
               <div className="flex flex-wrap gap-2">
                 {model.classes.map(cls => (
                   <Badge key={cls} variant={cls === 'no_tumor' ? 'default' : 'secondary'} className="px-3 py-1 text-sm capitalize">
                     {cls.replace('_', ' ')}
                   </Badge>
                 ))}
               </div>
             ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TerminalSquare className="w-5 h-5 text-primary" /> Integration Guide</CardTitle>
          <CardDescription>How to connect a custom Python/Keras inference service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <p>
              The application backend currently runs in <strong>mock mode</strong> unless the <code>MODEL_SERVICE_URL</code> environment variable is provided. 
              When configured, the Node.js API acts as a proxy, forwarding base64-encoded image payloads to your external inference service.
            </p>
            <p>
              Your external service (e.g., a FastAPI or Flask app wrapping a <code>.h5</code> Keras model) should expose a POST endpoint accepting and returning the JSON structures below.
            </p>
          </div>
          
          <div className="relative group">
            <div className="absolute right-3 top-3">
              <button 
                onClick={copyToClipboard}
                className="p-1.5 bg-background/20 hover:bg-background/40 backdrop-blur rounded border border-white/10 text-white transition-colors"
                title="Copy snippet"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg overflow-x-auto text-xs font-mono border leading-relaxed">
              <code>{mockCodeSnippet}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
