"use client";

import LoginConPin from "@/src/components/auth/LoginConPin";
import LoginShell from "@/src/components/auth/LoginShell";

export default function LoginJaPage() {
  return (
    <LoginShell programa="ja">
      <LoginConPin programa="ja" />
    </LoginShell>
  );
}
