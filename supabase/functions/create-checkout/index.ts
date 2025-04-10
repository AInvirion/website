
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

  try {
    // Get request body
    const { checkoutType, packageId, serviceId, origin } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get auth header and user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Set up checkout line items based on type
    let lineItems;
    let metadata = {};
    let successUrl = `${origin}/dashboard/creditos/success?session_id={CHECKOUT_SESSION_ID}`;
    
    if (checkoutType === "package") {
      // Obtener información del paquete de créditos
      const { data: packageData, error: packageError } = await supabaseClient
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .single();
      
      if (packageError || !packageData) {
        return new Response(
          JSON.stringify({ error: "Paquete de créditos no encontrado" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404 
          }
        );
      }
      
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${packageData.name} - ${packageData.credits} créditos`,
              description: `Paquete de ${packageData.credits} créditos`,
            },
            unit_amount: packageData.price, // Precio en centavos
          },
          quantity: 1,
        },
      ];
      
      metadata = {
        type: "credit_package",
        package_id: packageId,
        credits: packageData.credits,
        user_id: user.id,
      };
      
    } else if (checkoutType === "service") {
      // Obtener información del servicio
      const { data: serviceData, error: serviceError } = await supabaseClient
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();
      
      if (serviceError || !serviceData) {
        return new Response(
          JSON.stringify({ error: "Servicio no encontrado" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404 
          }
        );
      }
      
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: serviceData.name,
              description: serviceData.description || "Pago directo por servicio",
            },
            unit_amount: serviceData.price * 400, // Convertir precio en créditos a centavos (1 crédito = $4.00)
          },
          quantity: 1,
        },
      ];
      
      metadata = {
        type: "direct_service",
        service_id: serviceId,
        user_id: user.id,
      };
      
      // Redireccionar al dashboard después de un servicio
      successUrl = `${origin}/dashboard/servicios/success?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      return new Response(
        JSON.stringify({ error: "Tipo de checkout inválido" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: `${origin}/dashboard/creditos`,
      customer_email: user.email,
      metadata: metadata,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: "Error al crear la sesión de pago" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
