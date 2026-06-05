"use client";

import LoginConPin from "@/src/components/auth/LoginConPin";
import LoginShell from "@/src/components/auth/LoginShell";

export default function LoginConquistadoresPage() {
  return (
    <LoginShell programa="conquistadores">
      <LoginConPin programa="conquistadores" />
    </LoginShell>
  );
}
