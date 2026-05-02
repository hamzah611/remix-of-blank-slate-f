import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";

// ── Decorative components ──────────────────────────────────

function HorizontalGeoBorder() {
  return (
    <svg width="100%" height="20" aria-hidden="true" style={{ display: "block" }}>
      <defs>
        <pattern id="geo-auth-h" x="0" y="0" width="48" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="48" y2="10" stroke="#1E2D3D" strokeWidth="0.75" strokeOpacity="0.18" />
          <path d="M 24 5 L 29 10 L 24 15 L 19 10 Z" stroke="#1E2D3D" strokeWidth="0.75" strokeOpacity="0.18" fill="#FAF6F0" />
          <circle cx="0"  cy="10" r="1.5" fill="#1E2D3D" fillOpacity="0.18" />
          <circle cx="48" cy="10" r="1.5" fill="#1E2D3D" fillOpacity="0.18" />
        </pattern>
      </defs>
      <rect width="100%" height="20" fill="url(#geo-auth-h)" />
    </svg>
  );
}

function VerticalGeoBorder() {
  return (
    <svg
      width="24"
      height="100%"
      aria-hidden="true"
      style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "block" }}
    >
      <defs>
        <pattern id="geo-auth-v" x="0" y="0" width="24" height="48" patternUnits="userSpaceOnUse">
          <line x1="12" y1="0" x2="12" y2="48" stroke="#1E2D3D" strokeWidth="0.75" strokeOpacity="0.15" />
          <path d="M 7 24 L 12 19 L 17 24 L 12 29 Z" stroke="#1E2D3D" strokeWidth="0.75" strokeOpacity="0.15" fill="#FAF6F0" />
          <circle cx="12" cy="0"  r="1.5" fill="#1E2D3D" fillOpacity="0.15" />
          <circle cx="12" cy="48" r="1.5" fill="#1E2D3D" fillOpacity="0.15" />
        </pattern>
      </defs>
      <rect width="24" height="100%" fill="url(#geo-auth-v)" />
    </svg>
  );
}

// ── Error message component ────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        color: "#C17B4A",
        marginTop: 4,
        animation: "page-entry 200ms ease-out both",
      }}
    >
      {message}
    </p>
  );
}

// ── Main component ─────────────────────────────────────────

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/course-map", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/course-map", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirmation(false);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        // If no session returned, email confirmation is required
        if (!data.session) {
          setNeedsConfirmation(true);
          toast({ title: "Check your email", description: `We sent a confirmation link to ${email}` });
        }
        // If session returned, onAuthStateChange handles the redirect automatically
      } else {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out — check your connection and try again.")), 10000)
        );
        const { error } = await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          timeout,
        ]);
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setNeedsConfirmation(true);
            throw new Error("Please confirm your email first. Check your inbox for the confirmation link.");
          }
          throw error;
        }
      }
    } catch (err) {
      toast({
        title: "Authentication failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast({ title: "Email resent", description: `Confirmation link sent to ${email}` });
    } catch (err) {
      toast({
        title: "Failed to resend",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({
        title: "Google sign-in failed",
        description: result.error.message ?? "Try again",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const formPanel = (
    <div
      className="animate-page-entry"
      style={{ width: "100%", maxWidth: 400 }}
    >
      {/* Logo (mobile: visible, desktop: hidden — shown in left panel instead) */}
      <div className="md:hidden text-center mb-8">
        <p
          style={{
            fontFamily: "'Amiri', serif",
            fontSize: 56,
            fontWeight: 700,
            color: "#D4A853",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          گفتگو
        </p>
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#1E2D3D",
            letterSpacing: "-0.01em",
          }}
        >
          Guftugu
        </p>
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 40,
          fontWeight: 700,
          color: "#1E2D3D",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          marginBottom: 8,
        }}
      >
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 15,
          color: "#1E2D3D",
          opacity: 0.55,
          marginBottom: 32,
        }}
      >
        {mode === "signin" ? "Sign in to continue learning" : "Start your language journey"}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "signup" && (
          <div>
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="gf-input"
            />
          </div>
        )}
        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="gf-input"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="gf-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="gf-btn-primary"
          style={{ marginTop: 8 }}
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(30,45,61,0.1)" }} />
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#1E2D3D",
              opacity: 0.35,
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(30,45,61,0.1)" }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="gf-btn-secondary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 10, flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </form>

      {/* Resend confirmation notice */}
      {needsConfirmation && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            backgroundColor: "rgba(212,168,83,0.1)",
            border: "1px solid rgba(212,168,83,0.3)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            color: "#1E2D3D",
          }}
        >
          <p style={{ marginBottom: 8 }}>
            Didn't get the email? Check your spam folder or resend it.
          </p>
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendLoading}
            className="gf-link"
          >
            {resendLoading ? "Sending…" : "Resend confirmation email"}
          </button>
        </div>
      )}

      {/* Toggle */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setNeedsConfirmation(false); }}
          className="gf-link"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {/* ── Left panel (desktop only) ── */}
      <div
        className="hidden md:flex flex-col justify-between relative"
        style={{
          width: 420,
          flexShrink: 0,
          backgroundColor: "#FAF6F0",
          padding: "64px 56px",
        }}
      >
        <VerticalGeoBorder />

        {/* Wordmark */}
        <div>
          <p
            style={{
              fontFamily: "'Amiri', serif",
              fontSize: 56,
              fontWeight: 700,
              color: "#D4A853",
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            گفتگو
          </p>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#1E2D3D",
              letterSpacing: "-0.01em",
            }}
          >
            Guftugu
          </p>
        </div>

        {/* Tagline */}
        <div>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: 26,
              fontWeight: 400,
              color: "#1E2D3D",
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
              opacity: 0.8,
            }}
          >
            "The language of your ancestors, one lesson at a time."
          </p>
        </div>

        {/* Bottom decoration */}
        <div>
          <HorizontalGeoBorder />
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 12,
              color: "#1E2D3D",
              opacity: 0.35,
              marginTop: 16,
            }}
          >
            Urdu · Sindhi · and more coming soon
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ padding: "64px 24px", backgroundColor: "#FFFFFF" }}
      >
        {formPanel}
      </div>
    </div>
  );
};

export default Auth;
