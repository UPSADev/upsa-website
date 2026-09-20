"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortalSignUpPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(true);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!agree) {
      setError("Please confirm that you understand the portal is free to use.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/users/signup/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create your account.");
        return;
      }

      // Account was successfully created.
      // Move the user to your existing onboarding page.
      router.push("/portal/onboarding");

    } catch (error) {
      console.error(error);
      setError(
        "Could not connect to the UPSA server. Make sure Django is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-guest">
      <header className="portal-guest-header">
        <div className="portal-guest-brand">
          <img
            src="/images/logos/upsa-logo.png"
            alt="UPSA"
            width={32}
            height={32}
          />
          UPSA Portal
        </div>

        <Link href="/portal" className="portal-guest-back">
          &larr; Back
        </Link>
      </header>

      <div className="portal-auth-wrap">
        <div className="portal-auth-card">

          <h1>Create your account</h1>

          <p className="sub">
            Join the UPSA Community &amp; Mentor Portal. It&apos;s free.
          </p>

          {/* Google login can be connected later */}
          <button
            type="button"
            className="btn-google"
            disabled
          >
            <span className="dot" />
            Continue with Google
          </button>

          <div className="portal-auth-divider">
            or
          </div>

          <form onSubmit={handleSignUp}>

            <div className="field-row">

              <div className="field">
                <label htmlFor="fname">
                  First name
                </label>

                <input
                  id="fname"
                  type="text"
                  placeholder="Aisha"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="lname">
                  Last name
                </label>

                <input
                  id="lname"
                  type="text"
                  placeholder="Raza"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

            </div>

            <div className="field">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <label
              className="portal-checkbox-row"
              htmlFor="agree"
            >
              <input
                id="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />

              <span>
                The portal is free to use. No payment or donation is
                ever required to access mentorship or networking.
              </span>
            </label>

            {error && (
              <p
                style={{
                  color: "red",
                  marginTop: "12px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: "16px",
              }}
            >
              {loading
                ? "Creating account..."
                : "Create account →"}
            </button>

          </form>

          <p className="portal-auth-foot">
            Already have an account?{" "}
            <Link href="/portal/sign-in">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}