
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  
  if (!stripeSecretKey) {
    console.error("⚠️ STRIPE_SECRET_KEY not configured in environment");
    return new Response(
      JSON.stringify({ error: "STRIPE_SECRET_KEY missing in environment" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("⚠️ No Stripe signature found");
      return new Response(JSON.stringify({ error: "No Stripe signature found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    console.log("📩 Received webhook with payload:", body.substring(0, 100) + "...");
    console.log("🔑 Using webhook secret (first few chars):", endpointSecret.substring(0, 4) + "...");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
      console.log("✅ Webhook signature verified successfully");
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("⚠️ Supabase credentials missing");
      return new Response(JSON.stringify({ error: "Supabase configuration missing" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get session object
    const session = event.data.object;
    console.log(`🔄 Processing event ${event.type} for session ${session.id}`);
    console.log(`📝 Session metadata:`, session.metadata);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(session, supabaseClient);
        break;
        
      case "checkout.session.async_payment_succeeded":
        await handleAsyncPaymentSucceeded(session, supabaseClient);
        break;
        
      case "checkout.session.async_payment_failed":
        await handleAsyncPaymentFailed(session, supabaseClient);
        break;
        
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(session, supabaseClient);
        break;
        
      default:
        console.log(`ℹ️ Event not handled: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`❌ Error processing webhook: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Funciones para manejar cada tipo de evento

// Manejo de checkout.session.completed
async function handleCheckoutSessionCompleted(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("❌ No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;
  console.log(`🧑 Processing for user: ${userId}`);
  
  // Procesar según el tipo de compra
  if (session.metadata.type === "credit_package") {
    const credits = Number(session.metadata.credits) || 0;
    
    if (credits > 0) {
      console.log(`💰 Adding ${credits} credits for user ${userId}`);
      
      try {
        // Registrar la transacción de créditos
        const { data: transactionData, error: transactionError } = await supabaseClient
          .from("credit_transactions")
          .insert({
            user_id: userId,
            amount: credits,
            type: "purchase",
            reference_id: session.metadata.package_id,
          })
          .select();
          
        if (transactionError) {
          console.error(`❌ Error registering transaction: ${transactionError.message}`);
          throw transactionError;
        }
        
        console.log(`✅ Transaction registered: ${transactionData?.[0]?.id || 'unknown ID'}`);
        console.log(`✅ ${credits} credits added for user ${userId}`);
        
      } catch (error) {
        console.error(`❌ Error processing credit purchase: ${error.message}`);
      }
    }
  } 
  else if (session.metadata.type === "direct_service") {
    // Implementar lógica para procesar el pago directo por un servicio
    console.log(`✅ Direct payment for service ${session.metadata.service_id} for user ${userId}`);
    
    try {
      // Registrar la ejecución del servicio como "pagado"
      const { data: serviceData, error: serviceError } = await supabaseClient
        .from("service_executions")
        .insert({
          service_id: session.metadata.service_id,
          user_id: userId,
          credits_used: 0, // No se usaron créditos, fue pago directo
          status: "paid",
        })
        .select();
        
      if (serviceError) {
        console.error(`❌ Error registering service execution: ${serviceError.message}`);
        throw serviceError;
      }
      
      console.log(`✅ Service execution registered: ${serviceData?.[0]?.id || 'unknown ID'}`);
    } catch (error) {
      console.error(`❌ Error processing service payment: ${error.message}`);
    }
  }
}

// Manejo de checkout.session.async_payment_succeeded
async function handleAsyncPaymentSucceeded(session, supabaseClient) {
  // Similar al completed, pero para pagos asíncronos exitosos
  console.log(`💰 Async payment success: ${session.id}`);
  await handleCheckoutSessionCompleted(session, supabaseClient);
}

// Manejo de checkout.session.async_payment_failed
async function handleAsyncPaymentFailed(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("❌ No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;
  console.log(`❌ Async payment failed for user ${userId}`);

  try {
    // Registrar el fallo del pago
    const { error } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: 0,
        type: "payment_failed",
        reference_id: session.id,
      });
      
    if (error) {
      console.error(`❌ Error registering payment failure: ${error.message}`);
    }
  } catch (error) {
    console.error(`❌ Error processing payment failure: ${error.message}`);
  }
}

// Manejo de checkout.session.expired
async function handleCheckoutSessionExpired(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("❌ No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;
  console.log(`⏱️ Payment session expired for user ${userId}`);

  try {
    // Registrar la expiración de la sesión
    const { error } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: 0,
        type: "session_expired",
        reference_id: session.id,
      });
      
    if (error) {
      console.error(`❌ Error registering session expiration: ${error.message}`);
    }
  } catch (error) {
    console.error(`❌ Error processing session expiration: ${error.message}`);
  }
}
