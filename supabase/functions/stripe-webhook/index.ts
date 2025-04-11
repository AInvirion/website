
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
  const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeSecretKey) {
    console.error("⚠️ STRIPE_SECRET_KEY not configured in environment");
    return new Response(
      JSON.stringify({ error: "STRIPE_SECRET_KEY missing in environment" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  if (!endpointSecret) {
    console.error("⚠️ STRIPE_WEBHOOK_SECRET not configured in environment");
    return new Response(
      JSON.stringify({ error: "STRIPE_WEBHOOK_SECRET missing in environment" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16", // Mantener esta versión para compatibilidad
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
    console.log("📩 Received webhook with payload size:", body.length);
    console.log("📩 Signature:", signature.substring(0, 20) + "...");
    
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
    
    let event;
    
    // Verify webhook signature
    try {
      console.log("🔐 Verifying webhook signature with secret:", 
        endpointSecret.substring(0, 10) + "...");
      
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

    // Get session object
    const session = event.data.object;
    console.log(`🔄 Processing event ${event.type} for session ${session.id}`);
    
    if (session.metadata) {
      console.log(`📝 Session metadata:`, JSON.stringify(session.metadata));
    } else {
      console.warn("⚠️ No metadata found in session");
    }

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
    return new Response(JSON.stringify({ received: true, event_type: event.type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`❌ Error processing webhook: ${err.message}`);
    console.error("Error stack:", err.stack);
    return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Functions to handle each type of event

// Handle checkout.session.completed
async function handleCheckoutSessionCompleted(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("❌ No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;
  console.log(`🧑 Processing for user: ${userId}`);
  
  try {
    // Process based on purchase type
    if (session.metadata.type === "credit_package") {
      const credits = Number(session.metadata.credits) || 0;
      
      if (credits > 0) {
        console.log(`💰 Adding ${credits} credits for user ${userId}`);
        
        // Register the credit transaction
        const { data: transactionData, error: transactionError } = await supabaseClient
          .from("credit_transactions")
          .insert({
            user_id: userId,
            amount: credits,
            type: "purchase",
            reference_id: session.id, // Using session ID as reference
          })
          .select();
          
        if (transactionError) {
          console.error(`❌ Error registering transaction: ${transactionError.message}`);
          console.error("Transaction error details:", JSON.stringify(transactionError));
          throw transactionError;
        }
        
        console.log(`✅ Transaction registered: ${transactionData?.[0]?.id || 'unknown ID'}`);
        
        // Verificar el saldo actual del usuario para diagnóstico
        const { data: userData, error: userError } = await supabaseClient
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();
        
        if (userError) {
          console.error(`❌ Error checking user credits: ${userError.message}`);
        } else {
          console.log(`ℹ️ User credits before update: ${userData?.credits || 0}`);
        }
        
        // El gatillo de base de datos update_user_credits debe actualizar los créditos automáticamente
        // cuando se inserta la transacción. Si no está funcionando, verificamos aquí.
        
        // Verificar nuevamente el saldo después de la transacción
        const { data: updatedUserData, error: updatedUserError } = await supabaseClient
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();
        
        if (updatedUserError) {
          console.error(`❌ Error checking updated user credits: ${updatedUserError.message}`);
        } else {
          console.log(`ℹ️ User credits after update: ${updatedUserData?.credits || 0}`);
          
          // Si los créditos no se actualizaron, intentamos actualizarlos manualmente
          if (updatedUserData?.credits === userData?.credits) {
            console.log(`⚠️ Credits not updated by trigger, updating manually`);
            
            const { error: updateError } = await supabaseClient
              .from("profiles")
              .update({ credits: (userData?.credits || 0) + credits })
              .eq("id", userId);
            
            if (updateError) {
              console.error(`❌ Error updating credits manually: ${updateError.message}`);
            } else {
              console.log(`✅ Credits updated manually: ${credits} added to user ${userId}`);
            }
          }
        }
      }
    } 
    else if (session.metadata.type === "direct_service") {
      // Implement logic to process the direct payment for a service
      console.log(`✅ Direct payment for service ${session.metadata.service_id} for user ${userId}`);
      
      try {
        // Register the service execution as "paid"
        const { data: serviceData, error: serviceError } = await supabaseClient
          .from("service_executions")
          .insert({
            service_id: session.metadata.service_id,
            user_id: userId,
            credits_used: 0, // No credits used, it was direct payment
            status: "paid",
          })
          .select();
          
        if (serviceError) {
          console.error(`❌ Error registering service execution: ${serviceError.message}`);
          console.error("Service error details:", JSON.stringify(serviceError));
          throw serviceError;
        }
        
        console.log(`✅ Service execution registered: ${serviceData?.[0]?.id || 'unknown ID'}`);
      } catch (error) {
        console.error(`❌ Error processing service payment: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error in handleCheckoutSessionCompleted: ${error.message}`);
    console.error("Error details:", JSON.stringify(error));
    // We don't re-throw here to avoid failing the webhook overall
  }
}

// Handle checkout.session.async_payment_succeeded
async function handleAsyncPaymentSucceeded(session, supabaseClient) {
  console.log(`💰 Async payment success: ${session.id}`);
  await handleCheckoutSessionCompleted(session, supabaseClient);
}

async function handleAsyncPaymentFailed(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("❌ No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;
  console.log(`❌ Async payment failed for user ${userId}`);

  try {
    // Register the failed payment
    const { error } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: 0, // No credits added for failed payment
        type: "payment_failed",
        reference_id: session.id,
      });
      
    if (error) {
      console.error(`❌ Error registering payment failure: ${error.message}`);
      console.error("Error details:", JSON.stringify(error));
    }
  } catch (error) {
    console.error(`❌ Error in handleAsyncPaymentFailed: ${error.message}`);
    console.error("Error details:", JSON.stringify(error));
  }
}

async function handleCheckoutSessionExpired(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("❌ No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;
  console.log(`⏱️ Payment session expired for user ${userId}`);

  try {
    // Register the session expiration
    const { error } = await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: 0, // No credits for expired session
        type: "session_expired",
        reference_id: session.id,
      });
      
    if (error) {
      console.error(`❌ Error registering session expiration: ${error.message}`);
      console.error("Error details:", JSON.stringify(error));
    }
  } catch (error) {
    console.error(`❌ Error in handleCheckoutSessionExpired: ${error.message}`);
    console.error("Error details:", JSON.stringify(error));
  }
}
