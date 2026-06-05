import { NextResponse } from "next/server";
import { consolidarUnidadesClub } from "@/src/lib/consolidarUnidades";

const ADMIN_PIN = "1844";

/** POST { "pin": "1844" } — unifica «Unidad de Gacelas» → «Gacelas», etc. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { pin?: string };
    if (body.pin !== ADMIN_PIN) {
      return NextResponse.json({ ok: false, error: "PIN admin requerido." }, { status: 401 });
    }
    const res = await consolidarUnidadesClub();
    return NextResponse.json({ ok: true, ...res });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[consolidar-unidades]", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
