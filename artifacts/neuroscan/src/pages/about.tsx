import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, ShieldAlert, Microscope, Database, Lock } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="text-center space-y-4 mt-8 mb-12">
        <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">About NeuroScan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Advanced computer vision for preliminary brain tumor classification in medical research environments.
        </p>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 flex gap-4">
        <ShieldAlert className="w-8 h-8 text-destructive shrink-0" />
        <div>
          <h3 className="font-semibold text-destructive mb-1">Medical Disclaimer</h3>
          <p className="text-sm text-destructive/90 leading-relaxed">
            NeuroScan is a research and educational tool. It is <strong>NOT</strong> a certified medical device and should <strong>NOT</strong> be used for definitive diagnosis, treatment planning, or direct patient care. All automated classifications must be reviewed by a qualified radiologist or medical professional.
          </p>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Microscope className="w-6 h-6 text-primary" />
          Supported Classifications
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-lg">Glioma</h3>
              <p className="text-sm text-muted-foreground">
                Tumors that occur in the brain and spinal cord, beginning in the glial cells that surround and support nerve cells. They represent one of the most common types of primary brain tumors.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-lg">Meningioma</h3>
              <p className="text-sm text-muted-foreground">
                Tumors that arise from the meninges — the membranes that surround the brain and spinal cord. Most are noncancerous (benign) and grow slowly over time.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-lg">Pituitary Tumor</h3>
              <p className="text-sm text-muted-foreground">
                Abnormal growths that develop in the pituitary gland. While mostly benign, they can affect hormone production and press on surrounding structures like the optic nerves.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5 space-y-2">
              <h3 className="font-semibold text-lg text-primary">No Tumor</h3>
              <p className="text-sm text-muted-foreground">
                Normal brain MRI scans where the model detects no anomalous masses or structural abnormalities consistent with the trained tumor profiles.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6 border-t pt-8">
        <h2 className="text-2xl font-bold tracking-tight">Technology & Security</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="flex gap-3">
            <Database className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Architecture</h4>
              <p className="text-sm text-muted-foreground">
                Built on a scalable, decoupled architecture. The frontend communicates with a robust Node.js API layer, which interfaces with specialized Python inference microservices running deep learning models.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Lock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Data Privacy</h4>
              <p className="text-sm text-muted-foreground">
                Designed with patient privacy in mind. Images should be anonymized (stripped of DICOM patient metadata) before upload. Scan data is processed statelessly unless explicitly configured for longitudinal tracking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
