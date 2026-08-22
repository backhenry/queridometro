import { NextResponse } from "next/server";
import { participantePorCodigo } from "@/config/codigos";
import { acharParticipante, PARTICIPANTES_ATIVOS } from "@/config/participantes";
import { alvosJaVotados } from "@/lib/db";
import { podeVotarNaSemana } from "@/lib/participacao";
import { semanaAtual } from "@/lib/semana";

export const dynamic = "force-dynamic";

/**
 * POST /api/entrar  { codigo }
 *
 * Troca o código pela identidade da pessoa e já diz se ela votou esta semana,
 * pra a tela inicial não precisar de uma segunda ida ao servidor.
 */
export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const { codigo } = (corpo ?? {}) as { codigo?: string };
  if (typeof codigo !== "string" || codigo.length === 0) {
    return NextResponse.json({ erro: "Digite seu código." }, { status: 400 });
  }

  const id = participantePorCodigo(codigo);
  const pessoa = id ? acharParticipante(id) : undefined;

  // Mesma resposta para código inexistente e para participante desativado:
  // não vale entregar quem existe e quem não existe pra quem fica tentando.
  if (!id || !pessoa || pessoa.ativo === false) {
    return NextResponse.json({ erro: "Código não confere." }, { status: 401 });
  }

  const semana = semanaAtual();
  const alvos = await alvosJaVotados(semana, id);
  const precisaVotarEm = PARTICIPANTES_ATIVOS.filter((p) => p.id !== id).length;

  return NextResponse.json({
    id,
    nome: pessoa.nome,
    semana,
    alvosVotados: alvos,
    jaVotou: precisaVotarEm > 0 && alvos.length >= precisaVotarEm,
    // Ela entra normalmente e vê o mural — só não vota nesta rodada.
    podeVotar: podeVotarNaSemana(pessoa, semana),
  });
}
