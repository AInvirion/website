
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { checkoutType, packageId, serviceId, origin, action, sessionId, userId } = await req.json();

    console.log("Request received:", { checkoutType, packageId, serviceId, origin, action });

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

    // Verify and recover session if needed
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

    // Handle credit package purchase request
    if (checkoutType === "package" && packageId) {
      console.log("Creating checkout session for package:", packageId);
      
      // Get the auth token from the request
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("Missing authorization header");
      }
      const token = authHeader.replace("Bearer ", "");
      
      // Get the user from the auth token
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData?.user) {
        throw new Error("Invalid or expired authorization token");
      }
      
      const user = userData.user;
      console.log("User authenticated:", user.id);
      
      // Get the credit package details
      const { data: packageData, error: packageError } = await supabaseAdmin
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .single();
        
      if (packageError || !packageData) {
        throw new Error(`Credit package not found: ${packageId}`);
      }
      
      console.log("Package details:", packageData);
      
      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: packageData.name,
                description: `${packageData.credits} créditos`,
              },
              unit_amount: packageData.price, // Price is stored in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/dashboard/creditos/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/creditos`,
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
          type: "credit_package",
          credits: packageData.credits.toString(),
        },
      });
      
      console.log("Checkout session created:", session.id);
      
      return new Response(
        JSON.stringify({ url: session.url }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Handle service purchase checkout request
    if (checkoutType === "service" && serviceId) {
      console.log("Creating checkout session for service:", serviceId);
      
      // Get the auth token from the request
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("Missing authorization header");
      }
      const token = authHeader.replace("Bearer ", "");
      
      // Get the user from the auth token
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData?.user) {
        throw new Error("Invalid or expired authorization token");
      }
      
      const user = userData.user;
      console.log("User authenticated:", user.id);
      
      // Get the service details
      const { data: serviceData, error: serviceError } = await supabaseAdmin
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();
        
      if (serviceError || !serviceData) {
        throw new Error(`Service not found: ${serviceId}`);
      }
      
      console.log("Service details:", serviceData);
      
      // Calculate price in cents (4 USD per credit)
      const priceInCents = serviceData.price * 400; // 4 USD = 400 cents per credit
      
      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: serviceData.name,
                description: serviceData.description || `Servicio: ${serviceData.name}`,
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/dashboard/servicios/success?session_id={CHECKOUT_SESSION_ID}&service_id=${serviceId}`,
        cancel_url: `${origin}/dashboard/servicios/${serviceId}/pagar`,
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          user_id: user.id,
          type: "service",
          service_id: serviceId,
        },
      });
      
      console.log("Service checkout session created:", session.id);
      
      return new Response(
        JSON.stringify({ url: session.url }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // If none of the supported actions were requested
    return new Response(
      JSON.stringify({ error: "Acción no soportada o parámetros incompletos" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
