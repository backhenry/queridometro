import { NextResponse } from "next/server";
import { registrarVotos } from "@/lib/db";
import { semanaAtual } from "@/lib/semana";
import { PARTICIPANTES_ATIVOS, acharParticipante } from "@/config/participantes";
import { podeVotarNaSemana } from "@/lib/participacao";
import { participantePorCodigo } from "@/config/codigos";
import { emojiValido } from "@/lib/emoji";
import type { Voto } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const IDS_VALIDOS = new Set(PARTICIPANTES_ATIVOS.map((p) => p.id));
const LIMITE_JUSTIFICATIVA = 500;

/**
 * POST /api/votos  { codigo, votos: [{ alvo, emoji, justificativa }] }
 *
 * Quem está votando sai do código, nunca do que o navegador diz ser.
 * Sem isso qualquer um mandaria um POST se passando por outro.
 */
export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const { codigo, votos } = (corpo ?? {}) as {
    codigo?: string;
    votos?: { alvo?: string; emoji?: string; justificativa?: string | null }[];
  };

  const votante = typeof codigo === "string" ? participantePorCodigo(codigo) : null;
  if (!votante || !IDS_VALIDOS.has(votante)) {
    return NextResponse.json({ erro: "Código não confere." }, { status: 401 });
  }

  if (!Array.isArray(votos) || votos.length === 0) {
    return NextResponse.json({ erro: "Nenhum voto enviado." }, { status: 400 });
  }

  const semana = semanaAtual();

  // De castigo: continua levando voto dos outros, mas não vota nesta rodada.
  const pessoa = acharParticipante(votante)!;
  if (!podeVotarNaSemana(pessoa, semana)) {
    return NextResponse.json(
      { erro: "Você está de castigo essa semana e não pode votar." },
      { status: 403 },
    );
  }
  const vistos = new Set<string>();
  const paraGravar: Voto[] = [];

  for (const v of votos) {
    if (!v?.alvo || !IDS_VALIDOS.has(v.alvo)) {
      return NextResponse.json({ erro: "Participante desconhecido." }, { status: 400 });
    }
    if (v.alvo === votante) {
      return NextResponse.json({ erro: "Você não pode votar em si mesmo." }, { status: 400 });
    }
    if (vistos.has(v.alvo)) {
      return NextResponse.json({ erro: "Voto duplicado." }, { status: 400 });
    }
    if (typeof v.emoji !== "string" || !emojiValido(v.emoji)) {
      return NextResponse.json({ erro: "Emoji desconhecido." }, { status: 400 });
    }

    vistos.add(v.alvo);
    paraGravar.push({
      semana,
      votante,
      alvo: v.alvo,
      emoji: v.emoji,
      justificativa: v.justificativa?.slice(0, LIMITE_JUSTIFICATIVA) ?? null,
    });
  }

  // Só aceita a rodada completa — nada de votar em meia turma.
  const esperados = PARTICIPANTES_ATIVOS.filter((p) => p.id !== votante).length;
  if (paraGravar.length !== esperados) {
    return NextResponse.json({ erro: "Vote em todo mundo antes de enviar." }, { status: 400 });
  }

  try {
    await registrarVotos(paraGravar);
  } catch (e) {
    console.error("Falha ao gravar votos:", e);
    return NextResponse.json({ erro: "Não consegui salvar seus votos." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, semana });
}
