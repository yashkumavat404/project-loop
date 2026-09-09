"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    // Signup endpoint/session flow will be connected after the backend contract is merged.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">L</div>
          <h1 className="mt-4 text-2xl font-bold">Create your LOOP workspace</h1>
          <p className="mt-1 text-sm text-muted">The creator becomes the workspace ADMIN.</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Your name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Workspace name</label>
            <input className="input" value={workspace} onChange={(e) => setWorkspace(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          <button className="btn-primary w-full">Create workspace</button>
          <p className="text-center text-sm text-muted">
            Already have an account? <Link className="font-semibold text-indigo-600" href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}