
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

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      if (!session.metadata || !session.metadata.user_id) {
        return new Response(JSON.stringify({ error: "No user ID in metadata" }), { status: 400 });
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
        // Aquí podríamos registrar el servicio como pagado, etc.
        console.log(`✅ Pago directo por servicio ${session.metadata.service_id} para el usuario ${userId}`);
        
        // Podríamos implementar aquí la ejecución del servicio
      }
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
