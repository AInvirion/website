import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, X, Check, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

enum CVComparatorStep {
  PROFILE_DEFINITION = 1,
  UPLOAD_CVS = 2,
  CONFIRMATION = 3,
}

interface ProfileData {
  method: "file" | "text";
  fileContent: string | null;
  textContent: string;
}

interface CVsData {
  files: File[];
}

const CVComparator = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CVComparatorStep>(CVComparatorStep.PROFILE_DEFINITION);
  const [profileData, setProfileData] = useState<ProfileData>({
    method: "file",
    fileContent: null,
    textContent: "",
  });
  const [cvsData, setCvsData] = useState<CVsData>({ files: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const validateStep1 = (): boolean => {
    if (profileData.method === "file" && !profileData.fileContent) {
      toast({
        title: "Error de validación",
        description: "Por favor, sube un archivo con el perfil profesional",
        variant: "destructive",
      });
      return false;
    }
    
    if (profileData.method === "text" && !profileData.textContent.trim()) {
      toast({
        title: "Error de validación",
        description: "Por favor, escribe el perfil profesional",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const validateStep2 = (): boolean => {
    if (cvsData.files.length === 0) {
      toast({
        title: "Error de validación",
        description: "Por favor, sube al menos un CV para analizar",
        variant: "destructive",
      });
      return false;
    }
    
    if (cvsData.files.length > 20) {
      toast({
        title: "Error de validación",
        description: "No puedes subir más de 20 CVs",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cvs') => {
    const files = event.target.files;
    if (!files) return;
    
    if (type === 'profile') {
      const file = files[0];
      if (file.type !== 'text/plain') {
        toast({
          title: "Formato incorrecto",
          description: "Por favor sube un archivo .txt",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({
          ...profileData,
          fileContent: e.target?.result as string,
        });
      };
      reader.readAsText(file);
    } else if (type === 'cvs') {
      const fileArray = Array.from(files);
      
      const invalidFiles = fileArray.filter(file => file.type !== 'application/pdf');
      if (invalidFiles.length > 0) {
        toast({
          title: "Formato incorrecto",
          description: "Todos los archivos deben ser PDFs",
          variant: "destructive",
        });
        return;
      }
      
      setCvsData({ files: fileArray });
    }
  };
  
  const { data: service } = useQuery({
    queryKey: ['service', 'cv-comparator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('name', 'cv-comparator')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!service || !user?.id) return;
    
    setLoading(true);
    try {
      const { error: executionError } = await supabase
        .from('service_executions')
        .insert({
          service_id: service.id,
          user_id: user.id,
          status: 'pending',
          credits_used: service.price
        });

      if (executionError) throw executionError;

      toast({
        title: "Análisis iniciado",
        description: "Recibirás los resultados por correo electrónico en los próximos 10 minutos.",
      });
      navigate('/dashboard/servicios');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleFileDrop = (e: React.DragEvent, type: 'profile' | 'cvs') => {
    e.preventDefault();
    e.stopPropagation();
    
    const items = e.dataTransfer.items;
    if (!items) return;
    
    if (type === 'profile') {
      const item = items[0];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type === 'text/plain') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setProfileData({
              ...profileData,
              fileContent: e.target?.result as string,
            });
          };
          reader.readAsText(file);
        } else {
          toast({
            title: "Formato incorrecto",
            description: "Por favor arrastra un archivo .txt",
            variant: "destructive",
          });
        }
      }
    } else if (type === 'cvs') {
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.type === 'application/pdf') {
            files.push(file);
          }
        }
      }
      
      if (files.length > 0) {
        setCvsData({ files });
      }
    }
  };
  
  const removeCVFile = (index: number) => {
    const newFiles = [...cvsData.files];
    newFiles.splice(index, 1);
    setCvsData({ files: newFiles });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-400">
      <div className="w-full bg-blue-600/30 backdrop-blur-sm py-16 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Análisis de Perfiles Profesionales
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            Compara CVs con requisitos de puestos para encontrar los mejores candidatos
            mediante nuestro proceso de 3 pasos.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/dashboard/servicios" 
          className="inline-flex items-center text-white hover:text-white/90 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a servicios
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">Descripción del Servicio</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Nuestro sistema de análisis de perfiles profesionales utiliza tecnología avanzada para comparar
                currículums con los requisitos específicos de cada puesto. A través de un proceso de tres pasos,
                identificamos a los candidatos más adecuados para cada posición, ahorrándote tiempo y recursos en
                el proceso de selección.
              </p>

              <h3 className="text-xl font-semibold mb-4">Características</h3>
              <ul className="space-y-3">
                {[
                  "Análisis detallado de competencias técnicas y blandas",
                  "Comparación con requisitos específicos del puesto",
                  "Evaluación de compatibilidad cultural con la empresa",
                  "Recomendaciones personalizadas para cada candidato",
                  "Informes detallados con puntuaciones y justificaciones"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">Comienza ahora</h2>
              
              {currentStep === CVComparatorStep.PROFILE_DEFINITION && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-2 text-blue-600 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-sm font-medium">
                      1
                    </span>
                    <span className="text-lg font-medium">de 3</span>
                  </div>
                  <h3 className="text-xl font-semibold">Perfil profesional</h3>
                  <p className="text-gray-600">
                    Contanos qué perfil profesional estás buscando. Podés subir un archivo .txt o
                    escribirlo directamente.
                  </p>
                  
                  {profileData.method === "file" && (
                    <div className="space-y-4">
                      <label 
                        htmlFor="file-upload" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Subí el archivo con el requerimiento (.txt)
                      </label>
                      
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleFileDrop(e, 'profile')}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <input
                          id="file-upload"
                          type="file"
                          accept=".txt"
                          onChange={(e) => handleFileUpload(e, 'profile')}
                          className="hidden"
                        />
                        
                        {!profileData.fileContent ? (
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Arrastra y suelta tu archivo aquí o{" "}
                              <span className="text-blue-600 hover:underline">
                                haz clic para seleccionar
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Solo archivos .txt
                            </p>
                          </label>
                        ) : (
                          <div className="text-center">
                            <FileText className="mx-auto h-12 w-12 text-green-500" />
                            <p className="mt-2 text-sm text-green-600 font-medium">
                              Archivo cargado correctamente
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setProfileData({ ...profileData, fileContent: null })}
                              className="mt-2"
                            >
                              <X className="h-4 w-4 mr-1" /> Eliminar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {profileData.method === "text" && (
                    <div className="space-y-4">
                      <label
                        htmlFor="manual-input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Pegá o escribí el perfil del cargo
                      </label>
                      <Textarea
                        id="manual-input"
                        placeholder="Ej: Buscamos un desarrollador Fullstack con experiencia en React, Node.js y bases de datos SQL."
                        value={profileData.textContent}
                        onChange={(e) => setProfileData({ ...profileData, textContent: e.target.value })}
                        rows={6}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div className="mt-8 flex justify-end">
                    <Button 
                      onClick={() => {
                        if (validateStep1()) {
                          goToNextStep();
                        }
                      }}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
              
              {currentStep === CVComparatorStep.UPLOAD_CVS && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-2 text-blue-600 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-sm font-medium">
                      2
                    </span>
                    <span className="text-lg font-medium">de 3</span>
                  </div>
                  <h3 className="text-xl font-semibold">CVs para analizar</h3>
                  <p className="text-gray-600">
                    Sube los CVs en formato PDF que quieras comparar (máximo 20 archivos).
                  </p>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleFileDrop(e, 'cvs')}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors mb-6"
                  >
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'cvs')}
                      className="hidden"
                    />
                    
                    <label htmlFor="cv-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Arrastra y suelta tus archivos aquí o{" "}
                        <span className="text-blue-600 hover:underline">
                          haz clic para seleccionar
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Solo archivos PDF (máximo 20)
                      </p>
                    </label>
                  </div>
                  
                  {cvsData.files.length > 0 && (
                    <div className="mb-6">
                      <p className="font-medium mb-2">
                        Archivos seleccionados ({cvsData.files.length}):
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <ul className="space-y-2">
                          {cvsData.files.map((file, index) => (
                            <li key={index} className="flex justify-between items-center text-sm text-gray-700">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                {file.name}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCVFile(index)}
                              >
                                <X className="h-4 w-4 text-gray-500" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8 flex justify-between">
                    <Button variant="outline" onClick={goToPreviousStep}>
                      Anterior
                    </Button>
                    <Button 
                      onClick={() => {
                        if (validateStep2()) {
                          goToNextStep();
                        }
                      }}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
              
              {currentStep === CVComparatorStep.CONFIRMATION && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-2 text-blue-600 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-sm font-medium">
                      3
                    </span>
                    <span className="text-lg font-medium">de 3</span>
                  </div>
                  <h3 className="text-xl font-semibold">Confirmación</h3>
                  <p className="text-gray-600">
                    Revisa y confirma los detalles de tu solicitud.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <p className="mb-2">
                      Estás comparando <strong>{cvsData.files.length} CVs</strong> para el rol de:
                    </p>
                    <p className="italic text-gray-800 mb-4">
                      {profileData.method === "file" 
                        ? "Perfil definido por archivo" 
                        : `"${profileData.textContent.substring(0, 100)}${profileData.textContent.length > 100 ? '...' : ''}"`}
                    </p>
                    
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Esto costará aproximadamente: 
                      <strong className="text-blue-600 ml-1">{service?.price || '...'} créditos</strong>
                    </p>
                    
                    <p className="text-sm text-gray-600">
                      Te enviaremos los resultados por email en los próximos 10 minutos.
                    </p>
                  </div>
                  
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
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Análisis de Perfiles Profesionales</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Compara CVs con requisitos de puestos para encontrar los mejores candidatos mediante
                nuestro proceso de 3 pasos.
              </p>
              <div className="space-y-4">
                <h4 className="font-medium">¿Necesitas ayuda?</h4>
                <p className="text-sm text-gray-600">
                  Nuestro equipo está disponible para resolver tus dudas y proporcionarte más información sobre este
                  servicio.
                </p>
                <Input 
                  type="email" 
                  placeholder="info@empresa.com"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVComparator;
