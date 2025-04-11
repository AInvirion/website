
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
        console.log(`✅ ${credits} credits added for user ${userId}`);
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
  // Similar to completed, but for asynchronous payments that succeeded
  console.log(`💰 Async payment success: ${session.id}`);
  await handleCheckoutSessionCompleted(session, supabaseClient);
}

// Handle checkout.session.async_payment_failed
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

// Handle checkout.session.expired
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
