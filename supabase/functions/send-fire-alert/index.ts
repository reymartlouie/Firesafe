import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface FireEvent {
  id: string;
  risk: string;
  latitude: number;
  longitude: number;
  event_timestamp: string;
}

interface PushToken {
  expo_push_token: string;
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse the incoming request
    const { event_id } = await req.json();

    if (!event_id) {
      return new Response(
        JSON.stringify({ error: "event_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the fire event details
    const { data: fireEvent, error: eventError } = await supabase
      .from("fire_events")
      .select("id, risk, latitude, longitude, event_timestamp")
      .eq("id", event_id)
      .single();

    if (eventError || !fireEvent) {
      console.error("Error fetching fire event:", eventError);
      return new Response(
        JSON.stringify({ error: "Fire event not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch all push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("expo_push_token");

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log("No push tokens found");
      return new Response(
        JSON.stringify({ message: "No devices to notify" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare push notification messages
    const messages = tokens.map((token: PushToken) => ({
      to: token.expo_push_token,
      sound: "default",
      title: `🔥 ${fireEvent.risk} Fire Risk Alert`,
      body: `Fire detected at ${fireEvent.latitude.toFixed(4)}, ${fireEvent.longitude.toFixed(4)}`,
      data: {
        event_id: fireEvent.id,
        risk: fireEvent.risk,
        latitude: fireEvent.latitude,
        longitude: fireEvent.longitude,
        event_timestamp: fireEvent.event_timestamp,
      },
      priority: "high",
      channelId: "fire-alerts",
    }));

    // Send push notifications to Expo
    const expoPushResponse = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!expoPushResponse.ok) {
      const errorText = await expoPushResponse.text();
      console.error("Expo push failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send push notifications" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const expoPushResult = await expoPushResponse.json();
    console.log("Expo push result:", expoPushResult);

    // Mark the event as notified
    const { error: updateError } = await supabase
      .from("fire_events")
      .update({ notified: true })
      .eq("id", event_id);

    if (updateError) {
      console.error("Error updating notified status:", updateError);
      // Don't fail the request if this fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: messages.length,
        expo_result: expoPushResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});