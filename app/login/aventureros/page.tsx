"use client";

import LoginConPin from "@/src/components/auth/LoginConPin";
import LoginShell from "@/src/components/auth/LoginShell";

export default function LoginAventurerosPage() {
  return (
    <LoginShell programa="aventureros">
      <LoginConPin programa="aventureros" />
    </LoginShell>
  );
}
