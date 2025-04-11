
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Define CORS headers to allow requests from any origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Function to verify a Stripe session and create a manual transaction if necessary
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
  // Handle preflight OPTIONS requests for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Obtain the request body
    const requestData = await req.json().catch(e => {
      console.error("Error parsing request body:", e);
      throw new Error("Invalid request format");
    });
    
    const { action, sessionId, userId, packageId, serviceId, price, origin, checkoutType } = requestData;

    console.log("Received data:", { action, sessionId, packageId, serviceId, origin, checkoutType });

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

    // Verify and recover session if necessary
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

    // Extract JWT from authorization header
    const authHeader = req.headers.get('authorization');
    let userId;

    if (authHeader) {
      try {
        const jwt = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt);
        
        if (error || !user) {
          console.error("Error verifying JWT:", error);
          throw new Error("User not authenticated");
        }
        
        userId = user.id;
        console.log("Authenticated user:", userId);
      } catch (error) {
        console.error("Error verifying JWT:", error);
        throw new Error("Authentication error");
      }
    } else {
      console.error("No authentication token provided");
      throw new Error("No authentication token provided");
    }

    // Create checkout session based on type
    if (checkoutType === "package" && packageId) {
      console.log(`Creating checkout session for package: ${packageId}`);
      
      // Get package information
      const { data: packageData, error: packageError } = await supabaseAdmin
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .single();
      
      if (packageError || !packageData) {
        console.error("Error getting package:", packageError);
        throw new Error("Could not get package information");
      }
      
      console.log("Package found:", packageData);
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: packageData.name,
                description: `${packageData.credits} credits`,
              },
              unit_amount: packageData.price,  // Price in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/dashboard/creditos/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/creditos`,
        metadata: {
          user_id: userId,
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
    else if (checkoutType === "service" && serviceId) {
      console.log(`Creating checkout session for service: ${serviceId}`);
      
      // Get service information
      const { data: serviceData, error: serviceError } = await supabaseAdmin
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();
      
      if (serviceError || !serviceData) {
        console.error("Error getting service:", serviceError);
        throw new Error("Could not get service information");
      }
      
      console.log("Service found:", serviceData);
      
      // Convert credit price to dollars (4 dollars per credit)
      const priceInCents = serviceData.price * 400;  // $4.00 = 400 cents per credit
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: serviceData.name,
                description: serviceData.description || "Premium service",
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/dashboard/servicios/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/servicios`,
        metadata: {
          user_id: userId,
          type: "direct_service",
          service_id: serviceId,
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

    return new Response(
      JSON.stringify({ error: "Unsupported checkout type or incomplete data" }),
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
