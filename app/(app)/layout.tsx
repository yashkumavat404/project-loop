import { AppShell } from "@/components/layout/app-shell";

export default function ProtectedAppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Auth.js/session enforcement will be added here after the backend/auth contract is merged.
  return <AppShell>{children}</AppShell>;
}