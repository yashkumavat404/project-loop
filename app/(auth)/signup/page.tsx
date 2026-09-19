"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          workspace,
          email,
          password,
        }),
      });

      const data: {
        message?: string;
      } = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create workspace.");
        return;
      }

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!loginResult || loginResult.error) {
        setError(
          "Workspace was created, but automatic login failed. Please sign in manually."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Signup error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            L
          </div>

          <h1 className="mt-4 text-2xl font-bold">
            Create your LOOP workspace
          </h1>

          <p className="mt-1 text-sm text-muted">
            The creator becomes the workspace ADMIN.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="card space-y-4 p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              Your name
            </label>

            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Workspace name
            </label>

            <input
              className="input"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Password
            </label>

            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              disabled={loading}
            />

            <p className="mt-1 text-xs text-muted">
              Password must contain at least 8 characters.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Creating workspace..." : "Create workspace"}
          </button>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              className="font-semibold text-indigo-600"
              href="/login"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}