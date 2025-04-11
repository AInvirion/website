
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No Stripe signature found" }), {
      status: 400,
    });
  }

  try {
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed.`, err);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Obtener el objeto de la sesión
    const session = event.data.object;
    console.log(`Procesando evento ${event.type}`);

    // Manejar diferentes tipos de eventos
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
        console.log(`Evento no manejado: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (err) {
    console.error(`❌ Error processing webhook: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook error: ${err.message}` }), {
      status: 500,
    });
  }
});

// Funciones para manejar cada tipo de evento

// Manejo de checkout.session.completed
async function handleCheckoutSessionCompleted(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;
  
  // Procesar según el tipo de compra
  if (session.metadata.type === "credit_package") {
    const credits = Number(session.metadata.credits) || 0;
    
    if (credits > 0) {
      // Registrar la transacción de créditos
      await supabaseClient.from("credit_transactions").insert({
        user_id: userId,
        amount: credits,
        type: "purchase",
        reference_id: session.metadata.package_id,
      });
      
      console.log(`✅ ${credits} créditos añadidos para el usuario ${userId}`);
    }
  } 
  else if (session.metadata.type === "direct_service") {
    // Implementar lógica para procesar el pago directo por un servicio
    console.log(`✅ Pago directo por servicio ${session.metadata.service_id} para el usuario ${userId}`);
    
    // Registrar la ejecución del servicio como "pagado"
    await supabaseClient.from("service_executions").insert({
      service_id: session.metadata.service_id,
      user_id: userId,
      credits_used: 0, // No se usaron créditos, fue pago directo
      status: "paid",
    });
  }
}

// Manejo de checkout.session.async_payment_succeeded
async function handleAsyncPaymentSucceeded(session, supabaseClient) {
  // Similar al completed, pero para pagos asíncronos exitosos
  await handleCheckoutSessionCompleted(session, supabaseClient);
  console.log(`💰 Pago asíncrono exitoso: ${session.id}`);
}

// Manejo de checkout.session.async_payment_failed
async function handleAsyncPaymentFailed(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;

  // Registrar el fallo del pago
  await supabaseClient.from("credit_transactions").insert({
    user_id: userId,
    amount: 0,
    type: "payment_failed",
    reference_id: session.id,
  });

  console.log(`❌ Pago asíncrono fallido: ${session.id}`);
}

// Manejo de checkout.session.expired
async function handleCheckoutSessionExpired(session, supabaseClient) {
  if (!session.metadata || !session.metadata.user_id) {
    console.error("No user ID in metadata");
    return;
  }

  const userId = session.metadata.user_id;

  // Registrar la expiración de la sesión
  await supabaseClient.from("credit_transactions").insert({
    user_id: userId,
    amount: 0,
    type: "session_expired",
    reference_id: session.id,
  });

  console.log(`⏱️ Sesión de pago expirada: ${session.id}`);
}
