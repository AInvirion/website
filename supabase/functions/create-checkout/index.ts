import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Función para verificar una sesión de Stripe y crear una transacción manual si es necesario
async function verifyStripeSession(stripe, sessionId, userId, supabaseAdmin) {
  try {
    console.log(`Verificando sesión: ${sessionId} para usuario: ${userId}`);
    
    // Buscar la sesión en Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return { 
        success: false, 
        message: "No se encontró la sesión de pago" 
      };
    }
    
    // Verificar que la sesión pertenece al usuario correcto
    if (session.metadata?.user_id !== userId) {
      return { 
        success: false, 
        message: "La sesión no pertenece a este usuario" 
      };
    }
    
    // Verificar si el pago fue exitoso
    if (session.payment_status !== "paid") {
      return { 
        success: false, 
        message: `El estado del pago es: ${session.payment_status}` 
      };
    }
    
    // Verificar si ya existe una transacción para esta sesión
    const { data: existingTransaction } = await supabaseAdmin
      .from("credit_transactions")
      .select("id")
      .eq("reference_id", sessionId)
      .maybeSingle();
    
    if (existingTransaction) {
      return { 
        success: true, 
        message: "Transacción ya registrada",
        session 
      };
    }
    
    // Si la sesión es válida pero no hay transacción, crear una
    if (session.metadata?.type === "credit_package" && session.metadata?.credits) {
      const credits = Number(session.metadata.credits);
      
      // Crear transacción
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: credits,
          type: "purchase",
          reference_id: sessionId,
        })
        .select();
      
      if (transactionError) {
        console.error("Error al crear transacción:", transactionError);
        return { 
          success: false, 
          message: "Error al registrar la transacción" 
        };
      }
      
      // Actualizar los créditos del usuario
      const { data: userData } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();
      
      const currentCredits = userData?.credits || 0;
      
      await supabaseAdmin
        .from("profiles")
        .update({ credits: currentCredits + credits })
        .eq("id", userId);
      
      return { 
        success: true, 
        message: `Se han añadido ${credits} créditos a tu cuenta`,
        transaction: transaction[0],
        session
      };
    }
    
    return { 
      success: true, 
      message: "Sesión verificada pero no se requieren acciones adicionales",
      session
    };
  } catch (error) {
    console.error("Error en verificación de sesión:", error);
    return { 
      success: false, 
      message: `Error: ${error.message}` 
    };
  }
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, sessionId, userId, packageId, serviceId, price, mode } = await req.json();

    // Get secret keys from Supabase
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with SERVICE_ROLE key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verificar y recuperar sesión si es necesario
    if (action === "verify_session" && sessionId && userId) {
      const result = await verifyStripeSession(stripe, sessionId, userId, supabaseAdmin);
      
      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: result.success ? 200 : 400,
        }
      );
    }

    // El resto del código existente para crear sesiones de checkout...
    // (Asumiendo que hay más código aquí)

    return new Response(
      JSON.stringify({ error: "Acción no soportada" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
