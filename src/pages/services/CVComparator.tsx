
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, X, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
      
      // Validar que sean PDFs
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
  
  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      toast({
        title: "Análisis iniciado",
        description: "Recibirás los resultados por correo electrónico en los próximos 10 minutos.",
      });
      navigate('/dashboard/servicios');
      setLoading(false);
    }, 1500);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Comparador de CV</h1>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
      
      {currentStep === CVComparatorStep.PROFILE_DEFINITION && (
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-8 transition-all duration-300">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Paso 1 de 3
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Contanos qué perfil profesional estás buscando. Podés subir un archivo <span className="font-medium">.txt</span> o escribirlo directamente.
          </p>
          
          {/* Toggle between upload and text input */}
          <div className="flex gap-4 mb-6">
            <Button
              variant={profileData.method === "file" ? "default" : "outline"}
              onClick={() => setProfileData({ ...profileData, method: "file" })}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir archivo
            </Button>
            <Button
              variant={profileData.method === "text" ? "default" : "outline"}
              onClick={() => setProfileData({ ...profileData, method: "text" })}
            >
              <FileText className="mr-2 h-4 w-4" />
              Ingresar texto
            </Button>
          </div>
          
          {/* File upload section */}
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
          
          {/* Text input section */}
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
          
          {/* Navigation buttons */}
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
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-8 transition-all duration-300">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Paso 2 de 3
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Sube los CVs en formato PDF que quieras comparar (máximo 20 archivos).
          </p>
          
          {/* CV upload area */}
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
          
          {/* Selected files list */}
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
          
          {/* Navigation buttons */}
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
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-8 transition-all duration-300">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Paso 3 de 3
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Revisa y confirma los detalles de tu solicitud.
          </p>
          
          {/* Summary information */}
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
              <strong className="text-blue-600 ml-1">14 créditos</strong>
            </p>
            
            <p className="text-sm text-gray-600">
              Te enviaremos los resultados por email en los próximos 10 minutos.
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
        </div>
      )}
    </div>
  );
};

export default CVComparator;
