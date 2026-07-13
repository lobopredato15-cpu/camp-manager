import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY,
  };
}

async function authenticate(formData: FormData) {
  "use server";

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    redirect("/login?error=missing");
  }

  const { url, serviceKey } = supabaseConfig();

  if (!url && !serviceKey) {
    redirect("/login?error=config_all");
  }

  if (!url) {
    redirect("/login?error=config_url");
  }

  if (!serviceKey) {
    redirect("/login?error=config_key");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("verify_app_login", {
    p_username: username,
    p_password: password,
  });

  const user = Array.isArray(data) ? data[0] : data;

  if (error || !user) {
    redirect("/login?error=invalid");
  }

  const token = createSessionToken({
    userId: user.user_id,
    username: user.username,
    role: user.role,
    organizationId: user.organization_id,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/dashboard");
}

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const messages: Record<string, string> = {
  missing: "Enter username and password.",
  invalid: "Invalid username or password, or the Supabase login SQL has not been executed yet.",
  config: "Supabase environment variables are missing.",
  config_all: "Supabase URL and service role key are missing in Vercel.",
  config_url: "Supabase URL is missing in Vercel.",
  config_key: "Supabase service role key is missing in Vercel.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error ? messages[params.error] : null;

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Secure access</p>
        <h1>Camp Accommodation Manager</h1>
        <p className="login-copy">Sign in with a database-backed user account to access the accommodation dashboard.</p>
        <form action={authenticate} className="login-form">
          <label>
            Username
            <input name="username" autoComplete="username" defaultValue="admin" />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" defaultValue="admin" />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button className="primary" type="submit">Sign in</button>
        </form>
        <p className="login-note">Initial credentials: admin / admin. Change them before real use.</p>
      </section>
    </main>
  );
}
