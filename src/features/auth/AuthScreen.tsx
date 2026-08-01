import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banner, Button, TopBar } from "@/components/ui";
import { useSession } from "@/state/session";

export function AuthScreen() {
  const navigate = useNavigate();
  const { login, signup, oauth, error, clearError } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    clearError();
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, password, displayName);
      navigate("/");
    } catch {
      // The store already surfaced a message; stay on the form.
    } finally {
      setBusy(false);
    }
  };

  const doOauth = async (provider: "google" | "apple") => {
    setBusy(true);
    clearError();
    try {
      await oauth(provider);
      navigate("/");
    } catch {
      /* message shown below */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <TopBar
        left={
          <button
            className="btn btn--ghost"
            style={{ color: "var(--chrome-fg)", padding: 0, minHeight: 0 }}
            onClick={() => navigate("/")}
          >
            ← Back
          </button>
        }
      />

      <div className="pad stack">
        <div className="center">
          <h1 className="title h1">{mode === "signup" ? "Create an account" : "Welcome back"}</h1>
          <p className="small muted" style={{ lineHeight: 1.6 }}>
            An account syncs your progress across devices. Everything works without one — your
            data just stays on this device.
          </p>
        </div>

        {error && <Banner kind="error">{error}</Banner>}

        {mode === "signup" && (
          <div className="field">
            <label className="label" htmlFor="name">
              Display name
            </label>
            <input
              id="name"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          {mode === "signup" && <span className="small muted">At least 8 characters.</span>}
        </div>

        <Button block disabled={busy || !email || !password} onClick={() => void submit()}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>

        <div className="row" style={{ gap: 10 }}>
          <hr className="divider" style={{ flex: 1 }} />
          <span className="small muted">or</span>
          <hr className="divider" style={{ flex: 1 }} />
        </div>

        <Button variant="secondary" block disabled={busy} onClick={() => void doOauth("google")}>
          Continue with Google
        </Button>
        <Button variant="secondary" block disabled={busy} onClick={() => void doOauth("apple")}>
          Continue with Apple
        </Button>

        <Button
          variant="ghost"
          block
          onClick={() => {
            clearError();
            setMode(mode === "signup" ? "login" : "signup");
          }}
        >
          {mode === "signup" ? "I already have an account" : "Create an account instead"}
        </Button>
      </div>
    </div>
  );
}
