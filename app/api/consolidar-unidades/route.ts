import { NextResponse } from "next/server";
import { consolidarUnidadesClub } from "@/src/lib/consolidarUnidades";
import { validarPinAdminApi } from "@/src/lib/validarAdminApi";

/** POST { "pin": "...", "club": "codigo-club" } — unifica unidades duplicadas. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      pin?: string;
      club?: string;
    };
    if (!(await validarPinAdminApi(body.club, body.pin))) {
      return NextResponse.json(
        { ok: false, error: "Código de club o PIN de administrador inválido." },
        { status: 401 }
      );
    }
    const res = await consolidarUnidadesClub();
    return NextResponse.json({ ok: true, ...res });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[consolidar-unidades]", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
