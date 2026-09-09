"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    // Auth.js integration will be connected after the backend auth contract is merged.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">L</div>
          <h1 className="mt-4 text-2xl font-bold">Welcome to LOOP</h1>
          <p className="mt-1 text-sm text-muted">Customer feedback intelligence</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full">Sign in</button>
          <p className="text-center text-sm text-muted">
            Don't have an account? <Link className="font-semibold text-indigo-600" href="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </main>
  );
}