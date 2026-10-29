import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthSwitch, type SignInValues, type SignUpValues } from "@/components/auth/AuthSwitch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — OctoOdds" },
      {
        name: "description",
        content:
          "Sign in or create a OctoOdds account to use the calculator, scanner and bet tracker.",
      },
      { property: "og:title", content: "Log in — OctoOdds" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (!loading && user) void navigate({ to: "/calculator", replace: true });
  }, [loading, user, navigate]);

  const handleSignIn = async ({ email, password }: SignInValues) => {
    setError("");
    setNotice("");
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) setError(signInError.message);
    else void navigate({ to: "/calculator", replace: true });
  };

  const handleSignUp = async ({ fullName, email, password }: SignUpValues) => {
    setError("");
    setNotice("");
    setBusy(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Stored on the auth user; the profiles row picks it up.
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setBusy(false);
    if (signUpError) setError(signUpError.message);
    else setNotice(`We sent a confirmation link to ${email}. Confirm it, then sign in.`);
  };

  return (
    <AuthSwitch
      onSignIn={(values) => void handleSignIn(values)}
      onSignUp={(values) => void handleSignUp(values)}
      busy={busy}
      error={error}
      notice={notice}
    />
  );
}
