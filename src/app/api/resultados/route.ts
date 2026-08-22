import { NextResponse } from "next/server";
import { resultadosDaSemana } from "@/lib/db";
import { semanaAtual } from "@/lib/semana";

export const dynamic = "force-dynamic";

/** GET /api/resultados[?semana=2026-W33] → agregado da semana (nunca quem votou em quem). */
export async function GET(req: Request) {
  const pedida = new URL(req.url).searchParams.get("semana");
  const semana = pedida && /^\d{4}-W\d{2}$/.test(pedida) ? pedida : semanaAtual();

  try {
    return NextResponse.json(await resultadosDaSemana(semana));
  } catch (e) {
    console.error("Falha ao ler resultados:", e);
    return NextResponse.json({ erro: "Não consegui carregar os resultados." }, { status: 500 });
  }
}
