import { useState, type ReactNode } from "react";
import { Lock, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignInValues = { email: string; password: string };
export type SignUpValues = { fullName: string; email: string; password: string };

export type AuthSwitchProps = {
  onSignIn: (values: SignInValues) => void;
  onSignUp: (values: SignUpValues) => void;
  busy?: boolean;
  error?: string;
  notice?: string;
  /** Rendered inside the sign-in form, under the password field. */
  forgotPassword?: ReactNode;
  className?: string;
};

/**
 * Sliding sign-in / sign-up card, replicated from OctoOdds and restyled with
 * the OctoOdds sportsbook palette (header blue panel, green call-to-action).
 */
export function AuthSwitch({
  onSignIn,
  onSignUp,
  busy,
  error,
  notice,
  forgotPassword,
  className,
}: AuthSwitchProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [signIn, setSignIn] = useState<SignInValues>({ email: "", password: "" });
  const [signUp, setSignUp] = useState<SignUpValues>({ fullName: "", email: "", password: "" });

  return (
    <div className={cn("auth-switch", className)}>
      <style>{`
        .auth-switch {
          background: var(--background);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 20px;
        }
        .auth-switch *, .auth-switch *::before, .auth-switch *::after { box-sizing: border-box; }
        .auth-switch .as-brand { text-align: center; color: var(--header-deep); }
        .auth-switch .as-brand-img {
          display: block; margin: 0 auto;
          width: min(340px, 74vw); height: auto;
        }
        .auth-switch .as-container {
          position: relative; width: 100%; max-width: 900px; height: 550px;
          background: var(--card); border-radius: 16px;
          box-shadow: 0 25px 50px oklch(0.3 0.06 250 / 0.22); overflow: hidden;
        }
        .auth-switch .forms-container { position: absolute; width: 100%; height: 100%; top: 0; left: 0; }
        .auth-switch .signin-signup {
          position: absolute; top: 50%; transform: translate(-50%, -50%); left: 75%; width: 50%;
          transition: 1s 0.7s ease-in-out; display: grid; grid-template-columns: 1fr; z-index: 5;
        }
        .auth-switch form {
          display: flex; align-items: center; justify-content: center; flex-direction: column;
          padding: 0 5rem; transition: all 0.2s 0.7s; overflow: hidden;
          grid-column: 1 / 2; grid-row: 1 / 2;
        }
        .auth-switch form.sign-up-form { opacity: 0; z-index: 1; }
        .auth-switch form.sign-in-form { z-index: 2; }
        .auth-switch .title {
          font-family: var(--font-display); font-size: 2.2rem; font-weight: 700;
          color: var(--foreground); margin: 0 0 10px;
        }
        .auth-switch .as-message {
          max-width: 380px; width: 100%; margin: 6px 0 0;
          font-size: 0.85rem; text-align: center; line-height: 1.35;
        }
        .auth-switch .as-message.error { color: var(--destructive); }
        .auth-switch .as-message.notice { color: var(--up); }
        .auth-switch .input-field {
          max-width: 380px; width: 100%; background-color: var(--secondary); margin: 10px 0; height: 55px;
          border-radius: 55px; display: grid; grid-template-columns: 15% 85%; align-items: center;
          padding: 0 0.4rem; transition: 0.3s;
        }
        .auth-switch .input-field:focus-within { box-shadow: 0 0 0 2px var(--primary); }
        .auth-switch .input-field svg { justify-self: center; width: 18px; height: 18px; color: var(--muted-foreground); }
        .auth-switch .input-field input {
          background: none; outline: none; border: none; line-height: 1;
          font-weight: 500; font-size: 1rem; color: var(--foreground); width: 100%;
        }
        .auth-switch .input-field input::placeholder { color: var(--muted-foreground); font-weight: 400; }
        .auth-switch .as-forgot {
          max-width: 380px; width: 100%; text-align: right; padding: 2px 1rem 0 0; font-size: 0.85rem;
        }
        .auth-switch .as-forgot a { color: var(--primary); font-weight: 500; text-decoration: none; }
        .auth-switch .as-forgot a:hover { text-decoration: underline; }
        .auth-switch .btn {
          width: 150px; background-color: var(--cta); color: var(--cta-foreground); border: none; outline: none;
          height: 49px; border-radius: 49px; text-transform: uppercase; font-weight: 700;
          margin: 10px 0; cursor: pointer; transition: 0.3s; font-size: 0.9rem;
        }
        .auth-switch .btn:hover { background-color: var(--cta-hover); transform: translateY(-2px); box-shadow: var(--shadow-cta); }
        .auth-switch .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; background-color: var(--cta); }
        .auth-switch .panels-container {
          position: absolute; height: 100%; width: 100%; top: 0; left: 0;
          display: grid; grid-template-columns: repeat(2, 1fr);
        }
        .auth-switch .panel {
          display: flex; flex-direction: column; align-items: flex-end;
          justify-content: space-around; text-align: center; z-index: 6;
        }
        .auth-switch .left-panel { pointer-events: all; padding: 3rem 17% 2rem 12%; }
        .auth-switch .right-panel { pointer-events: none; padding: 3rem 12% 2rem 17%; }
        .auth-switch .panel .content { color: var(--header-foreground); transition: transform 0.9s ease-in-out; transition-delay: 0.6s; }
        .auth-switch .panel h3 { font-family: var(--font-display); font-weight: 700; line-height: 1; font-size: 1.5rem; margin: 0 0 10px; }
        .auth-switch .panel p { font-size: 0.95rem; margin: 0; padding: 0.7rem 0; color: var(--header-muted); }
        .auth-switch .btn.transparent {
          margin: 0; background: none; border: 2px solid var(--header-foreground); color: var(--header-foreground);
          width: 130px; height: 41px; font-weight: 700; font-size: 0.8rem;
        }
        .auth-switch .btn.transparent:hover { background: oklch(1 0 0 / 0.1); box-shadow: none; }
        .auth-switch .right-panel .content { transform: translateX(800px); }
        .auth-switch .as-container:before {
          content: ""; position: absolute; height: 2000px; width: 2000px; top: -10%; right: 48%;
          transform: translateY(-50%); background: linear-gradient(-45deg, var(--header) 0%, var(--header-deep) 100%);
          transition: 1.8s ease-in-out; border-radius: 50%; z-index: 6;
        }
        .auth-switch .as-container.sign-up-mode:before { transform: translate(100%, -50%); right: 52%; }
        .auth-switch .as-container.sign-up-mode .left-panel .content { transform: translateX(-800px); }
        .auth-switch .as-container.sign-up-mode .signin-signup { left: 25%; }
        .auth-switch .as-container.sign-up-mode form.sign-up-form { opacity: 1; z-index: 2; }
        .auth-switch .as-container.sign-up-mode form.sign-in-form { opacity: 0; z-index: 1; }
        .auth-switch .as-container.sign-up-mode .right-panel .content { transform: translateX(0%); }
        .auth-switch .as-container.sign-up-mode .left-panel { pointer-events: none; }
        .auth-switch .as-container.sign-up-mode .right-panel { pointer-events: all; }

        @media (max-width: 870px) {
          .auth-switch .as-container { min-height: 700px; height: calc(100vh - 140px); }
          .auth-switch .as-brand-img { width: min(260px, 70vw); }
          .auth-switch .signin-signup { width: 100%; top: 95%; transform: translate(-50%, -100%); transition: 1s 0.8s ease-in-out; }
          .auth-switch .signin-signup,
          .auth-switch .as-container.sign-up-mode .signin-signup { left: 50%; }
          .auth-switch .panels-container { grid-template-columns: 1fr; grid-template-rows: 1fr 2fr 1fr; }
          .auth-switch .panel { flex-direction: row; justify-content: space-around; align-items: center; padding: 2.5rem 8%; grid-column: 1 / 2; }
          .auth-switch .right-panel { grid-row: 3 / 4; }
          .auth-switch .left-panel { grid-row: 1 / 2; }
          .auth-switch .panel .content { padding-right: 15%; transition: transform 0.9s ease-in-out; transition-delay: 0.8s; }
          .auth-switch .panel h3 { font-size: 1.2rem; }
          .auth-switch .panel p { font-size: 0.7rem; padding: 0.5rem 0; }
          .auth-switch .btn.transparent { width: 110px; height: 35px; font-size: 0.7rem; }
          .auth-switch .as-container:before {
            width: 1500px; height: 1500px; transform: translateX(-50%);
            left: 30%; bottom: 68%; right: initial; top: initial; transition: 2s ease-in-out;
          }
          .auth-switch .as-container.sign-up-mode:before { transform: translate(-50%, 100%); bottom: 32%; right: initial; }
          .auth-switch .as-container.sign-up-mode .left-panel .content { transform: translateY(-300px); }
          .auth-switch .as-container.sign-up-mode .right-panel .content { transform: translateY(0px); }
          .auth-switch .right-panel .content { transform: translateY(300px); }
          .auth-switch .as-container.sign-up-mode .signin-signup { top: 5%; transform: translate(-50%, 0); }
        }

        @media (max-width: 570px) {
          .auth-switch form { padding: 0 1.5rem; }
          .auth-switch .panel .content { padding: 0.5rem 1rem; }
        }
      `}</style>

      <div className="as-brand">
        <img src="/octoodds-logo.png" alt="OctOdds — Even the odds" className="as-brand-img" />
      </div>

      <div className={cn("as-container", isSignUp && "sign-up-mode")}>
        <div className="forms-container">
          <div className="signin-signup">
            <form
              className="sign-in-form"
              onSubmit={(e) => {
                e.preventDefault();
                onSignIn(signIn);
              }}
            >
              <h2 className="title">Sign in</h2>
              {!isSignUp && error && <p className="as-message error">{error}</p>}
              {!isSignUp && notice && <p className="as-message notice">{notice}</p>}
              <div className="input-field">
                <Mail aria-hidden />
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  required
                  value={signIn.email}
                  onChange={(e) => setSignIn((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="input-field">
                <Lock aria-hidden />
                <input
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  value={signIn.password}
                  onChange={(e) => setSignIn((s) => ({ ...s, password: e.target.value }))}
                />
              </div>
              {forgotPassword && <div className="as-forgot">{forgotPassword}</div>}
              <button type="submit" className="btn" disabled={busy}>
                {busy ? "Signing in…" : "Login"}
              </button>
            </form>

            <form
              className="sign-up-form"
              onSubmit={(e) => {
                e.preventDefault();
                onSignUp(signUp);
              }}
            >
              <h2 className="title">Sign up</h2>
              {isSignUp && error && <p className="as-message error">{error}</p>}
              {isSignUp && notice && <p className="as-message notice">{notice}</p>}
              <div className="input-field">
                <User aria-hidden />
                <input
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  value={signUp.fullName}
                  onChange={(e) => setSignUp((s) => ({ ...s, fullName: e.target.value }))}
                />
              </div>
              <div className="input-field">
                <Mail aria-hidden />
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  required
                  value={signUp.email}
                  onChange={(e) => setSignUp((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="input-field">
                <Lock aria-hidden />
                <input
                  type="password"
                  placeholder="Password (6+ characters)"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={signUp.password}
                  onChange={(e) => setSignUp((s) => ({ ...s, password: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn" disabled={busy}>
                {busy ? "Creating…" : "Sign up"}
              </button>
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>New here?</h3>
              <p>Create your OctoOdds account in seconds and start covering every outcome.</p>
              <button type="button" className="btn transparent" onClick={() => setIsSignUp(true)}>
                Sign up
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>One of us?</h3>
              <p>Welcome back. Sign in to keep evening the odds.</p>
              <button type="button" className="btn transparent" onClick={() => setIsSignUp(false)}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
