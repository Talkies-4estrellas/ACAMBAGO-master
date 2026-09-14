import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";

// Crea (si hace falta) la cuenta conectada Express del negocio del vendedor
// y devuelve el link de onboarding de Stripe. Cada negocio tiene su propia
// cuenta, así el dinero de sus ventas cae ahí, no en una cuenta de AcambaGo.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { business_id } = await request.json().catch(() => ({ business_id: undefined }));
    if (!business_id) {
      return NextResponse.json({ error: "Falta el id del negocio" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, name, stripe_account_id")
      .eq("id", business_id)
      .eq("owner_id", userId)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 });
    }

    const stripe = getStripe();
    let accountId = business.stripe_account_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "MX",
        business_type: "individual",
        business_profile: { name: business.name },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await supabase.from("businesses").update({ stripe_account_id: accountId }).eq("id", business.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/business/settings?stripe_refresh=1&business_id=${business.id}`,
      return_url: `${appUrl}/dashboard/business/settings?stripe_return=1&business_id=${business.id}`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Error creando cuenta de Stripe Connect:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// Se llama al volver del onboarding para refrescar si Stripe ya habilitó
// los cobros de esa cuenta conectada.
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = new URL(request.url).searchParams.get("business_id");
    if (!businessId) {
      return NextResponse.json({ error: "Falta el id del negocio" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, stripe_account_id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 });
    }

    if (!business.stripe_account_id) {
      return NextResponse.json({ connected: false, chargesEnabled: false });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(business.stripe_account_id);
    const chargesEnabled = !!account.charges_enabled;

    await supabase.from("businesses").update({ stripe_charges_enabled: chargesEnabled }).eq("id", business.id);

    return NextResponse.json({ connected: true, chargesEnabled });
  } catch (err) {
    console.error("Error consultando estado de Stripe Connect:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
