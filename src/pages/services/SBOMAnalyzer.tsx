
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { File, Upload, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

enum SBOMStep {
  FILE_UPLOAD = 1,
  CONFIRMATION = 2,
}

interface SBOMData {
  file: File | null;
  useDefaultEmail: boolean;
  email: string;
}

const formSchema = z.object({
  email: z.string().email("Email inválido").min(1, "El email es requerido"),
  useDefaultEmail: z.boolean().default(true),
});

const SBOMAnalyzer = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<SBOMStep>(SBOMStep.FILE_UPLOAD);
  const [sbomData, setSbomData] = useState<SBOMData>({
    file: null,
    useDefaultEmail: true,
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user?.email || "",
      useDefaultEmail: true,
    },
  });
  
  const goToNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const validateStep1 = (): boolean => {
    if (!sbomData.file) {
      toast({
        title: "Error de validación",
        description: "Por favor, sube un archivo JSON con el SBOM",
        variant: "destructive",
      });
      return false;
    }
    
    if (!sbomData.useDefaultEmail && !form.getValues().email) {
      toast({
        title: "Error de validación",
        description: "Por favor, ingresa un email válido",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const file = files[0];
    if (file.type !== 'application/json') {
      toast({
        title: "Formato incorrecto",
        description: "Por favor sube un archivo JSON",
        variant: "destructive",
      });
      return;
    }
    
    setSbomData({
      ...sbomData,
      file,
    });
  };
  
  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      toast({
        title: "Análisis iniciado",
        description: "Recibirás los resultados por correo electrónico pronto.",
      });
      navigate('/dashboard/servicios');
      setLoading(false);
    }, 1500);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items = e.dataTransfer.items;
    if (!items) return;
    
    const item = items[0];
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file && file.type === 'application/json') {
        setSbomData({
          ...sbomData,
          file,
        });
      } else {
        toast({
          title: "Formato incorrecto",
          description: "Por favor arrastra un archivo JSON",
          variant: "destructive",
        });
      }
    }
  };
  
  const toggleEmailType = (useDefault: boolean) => {
    setSbomData({
      ...sbomData,
      useDefaultEmail: useDefault,
      email: useDefault ? user?.email || "" : sbomData.email,
    });
    form.setValue("useDefaultEmail", useDefault);
  };
  
  const onFormSubmit = (values: z.infer<typeof formSchema>) => {
    setSbomData({
      ...sbomData,
      email: values.email,
      useDefaultEmail: values.useDefaultEmail,
    });
    
    if (validateStep1()) {
      goToNextStep();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Análisis de SBOM</h1>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div 
          className="bg-purple-600 h-2 rounded-full transition-all"
          style={{ width: `${(currentStep / 2) * 100}%` }}
        />
      </div>
      
      {currentStep === SBOMStep.FILE_UPLOAD && (
        <Card className="max-w-2xl mx-auto transition-all duration-300">
          <CardHeader>
            <CardTitle>Paso 1 de 2</CardTitle>
            <CardDescription>
              Sube tu archivo SBOM en formato JSON para análisis de cumplimiento legal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
                {/* File upload area */}
                <div className="space-y-2">
                  <Label htmlFor="sbom-file">Archivo SBOM (JSON)</Label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <input
                      id="sbom-file"
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    {!sbomData.file ? (
                      <label htmlFor="sbom-file" className="cursor-pointer">
                        <File className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Arrastra y suelta tu archivo aquí o{" "}
                          <span className="text-purple-600 hover:underline">
                            haz clic para seleccionar
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Solo archivos JSON
                        </p>
                      </label>
                    ) : (
                      <div className="text-center">
                        <File className="mx-auto h-12 w-12 text-green-500" />
                        <p className="mt-2 text-sm text-green-600 font-medium">
                          {sbomData.file.name}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSbomData({ ...sbomData, file: null })}
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Email selection */}
                <div className="space-y-4">
                  <div className="text-sm font-medium">Enviar resultados a:</div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant={sbomData.useDefaultEmail ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => toggleEmailType(true)}
                    >
                      <Check className={`h-4 w-4 mr-2 ${sbomData.useDefaultEmail ? 'opacity-100' : 'opacity-0'}`} />
                      Usar email de sesión ({user?.email})
                    </Button>
                    
                    <Button
                      type="button"
                      variant={!sbomData.useDefaultEmail ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => toggleEmailType(false)}
                    >
                      <Check className={`h-4 w-4 mr-2 ${!sbomData.useDefaultEmail ? 'opacity-100' : 'opacity-0'}`} />
                      Usar otro email
                    </Button>
                  </div>
                  
                  {!sbomData.useDefaultEmail && (
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="correo@ejemplo.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Navigation buttons */}
                <div className="mt-8 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard/servicios')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Siguiente
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      
      {currentStep === SBOMStep.CONFIRMATION && (
        <Card className="max-w-2xl mx-auto transition-all duration-300">
          <CardHeader>
            <CardTitle>Paso 2 de 2</CardTitle>
            <CardDescription>
              Confirma los detalles de tu solicitud de análisis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary information */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between">
                  <span className="font-medium text-gray-700">Archivo SBOM:</span>
                  <span className="text-gray-900">{sbomData.file?.name}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between">
                  <span className="font-medium text-gray-700">Email para resultados:</span>
                  <span className="text-gray-900">{sbomData.useDefaultEmail ? user?.email : sbomData.email}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between pt-3 border-t">
                  <span className="font-medium text-gray-700">Costo:</span>
                  <span className="text-gray-900 font-bold">8 créditos</span>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-gray-600">
                Te enviaremos los resultados del análisis a la dirección de correo electrónico indicada tan pronto como estén disponibles.
              </p>
            </div>
            
            {/* Navigation buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3">
              <Button variant="outline" onClick={goToPreviousStep}>
                Anterior
              </Button>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/servicios')}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirmar y procesar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SBOMAnalyzer;
