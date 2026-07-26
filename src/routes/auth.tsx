import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Kirish — Linny" },
      { name: "description", content: "Google orqali kiring va progressingizni bulutda saqlang." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function signIn() {
    setBusy(true);
    setErr(null);
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) {
      setErr(r.error.message);
      setBusy(false);
      return;
    }
    if (!r.redirected) navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-surface max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full gradient-brand flex items-center justify-center text-3xl">
          🦉
        </div>
        <h1 className="mt-4 text-2xl font-bold">Linny ga xush kelibsiz</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Google orqali kiring — natijalaringiz, streak va xatolaringiz bulutda saqlanadi.
        </p>
        <button
          onClick={signIn}
          disabled={busy}
          className="btn-primary mt-6 w-full disabled:opacity-50"
        >
          {busy ? "Yuklanmoqda..." : "Google bilan kirish"}
        </button>
        {err && <div className="mt-3 text-sm text-red-500">{err}</div>}
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 text-sm text-muted-foreground hover:underline"
        >
          Kirmasdan davom etish →
        </button>
      </div>
    </div>
  );
}
