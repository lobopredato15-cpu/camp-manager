import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_SERVICE_KEY: Boolean(process.env.SUPABASE_SERVICE_KEY),
    SERVICE_ROLE_KEY: Boolean(process.env.SERVICE_ROLE_KEY),
    AUTH_COOKIE_SECRET: Boolean(process.env.AUTH_COOKIE_SECRET),
    NODE_ENV: process.env.NODE_ENV,
  });
}
