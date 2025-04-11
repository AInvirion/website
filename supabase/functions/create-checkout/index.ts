
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
    const requestData = await req.json();
    const { checkoutType, packageId, serviceId, origin } = requestData;

    if (!origin) {
      console.error("Origin URL missing in request");
      return new Response(
        JSON.stringify({ error: "URL de origen no proporcionada" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get auth header and user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No Authorization header found");
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      console.error("No user found with provided token");
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured in environment");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    // Set up checkout line items based on type
    let lineItems;
    let metadata = {};
    let successUrl = `${origin}/dashboard/creditos/success?session_id={CHECKOUT_SESSION_ID}`;
    
    if (checkoutType === "package") {
      if (!packageId) {
        console.error("Package ID missing for package checkout");
        return new Response(
          JSON.stringify({ error: "ID de paquete no proporcionado" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Obtener información del paquete de créditos
      const { data: packageData, error: packageError } = await supabaseClient
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .single();
      
      if (packageError || !packageData) {
        console.error("Error getting package data:", packageError);
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
      if (!serviceId) {
        console.error("Service ID missing for service checkout");
        return new Response(
          JSON.stringify({ error: "ID de servicio no proporcionado" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }

      // Obtener información del servicio
      const { data: serviceData, error: serviceError } = await supabaseClient
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();
      
      if (serviceError || !serviceData) {
        console.error("Error getting service data:", serviceError);
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
      console.error("Invalid checkout type:", checkoutType);
      return new Response(
        JSON.stringify({ error: "Tipo de checkout inválido" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log("Creating Stripe checkout session with:", {
      email: user.email,
      successUrl,
      cancelUrl: `${origin}/dashboard/creditos`,
      lineItems,
      metadata
    });

    try {
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

      console.log("Checkout session created successfully:", session.id);

      return new Response(
        JSON.stringify({ url: session.url }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error("Stripe error creating checkout session:", stripeError);
      return new Response(
        JSON.stringify({ error: "Error al crear la sesión de pago con Stripe", details: stripeError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("General error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: "Error al crear la sesión de pago", details: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
