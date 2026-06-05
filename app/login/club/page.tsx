"use client";

import LoginClubAdmin from "@/src/components/auth/LoginClubAdmin";
import LoginShell from "@/src/components/auth/LoginShell";

export default function LoginClubPage() {
  return (
    <LoginShell programa="club">
      <LoginClubAdmin />
    </LoginShell>
  );
}
