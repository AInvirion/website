
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendIcon, BotIcon, UserIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const simulateResponse = async (query: string) => {
    setIsLoading(true);
    
    // Simular respuestas básicas
    let response = '';
    
    if (query.toLowerCase().includes('crédito') || query.toLowerCase().includes('credito')) {
      response = 'Los créditos son la moneda de nuestra plataforma. Cada servicio cuesta un número específico de créditos. Puedes comprar más créditos en la sección de Créditos.';
    } 
    else if (query.toLowerCase().includes('servicio')) {
      response = 'Ofrecemos diversos servicios para búsqueda y análisis de datos. Cada servicio tiene un costo en créditos que se muestra en su tarjeta correspondiente.';
    } 
    else if (query.toLowerCase().includes('ayuda') || query.toLowerCase().includes('problema')) {
      response = 'Si necesitas ayuda adicional, puedes contactar a nuestro equipo de soporte desde la sección de Ayuda o enviando un correo a soporte@ejemplo.com.';
    } 
    else {
      response = 'Entiendo tu consulta. Para información más específica sobre nuestros servicios o cómo utilizar la plataforma, te recomiendo revisar la documentación disponible o especificar más tu pregunta.';
    }
    
    // Simular tiempo de respuesta
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: response }
    ]);
    
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    simulateResponse(userMessage.content);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <BotIcon className="h-5 w-5" />
          Asistente Virtual
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-80">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex gap-3 max-w-[80%] rounded-lg p-3",
                  message.role === 'assistant' 
                    ? "bg-blue-50 text-blue-900" 
                    : "bg-gray-100 text-gray-800 ml-auto"
                )}
              >
                {message.role === 'assistant' ? (
                  <BotIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                ) : (
                  <UserIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-600" />
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-900 max-w-[80%] rounded-lg p-3">
                <BotIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm">Escribiendo...</p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..." 
              className="flex-1"
            />
            <Button type="submit" size="sm">
              <SendIcon className="h-4 w-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
