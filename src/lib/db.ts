/**
 * Camada de dados. Roda SÓ NO SERVIDOR (rotas em src/app/api).
 *
 * Dois drivers:
 *   • supabase — quando SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY estão no .env.local
 *   • arquivo  — senão, grava num JSON local em .dados/votos.json
 *
 * O driver de arquivo existe pra você já rodar o site agora, antes de criar
 * a conta do Supabase. Ele NÃO funciona na Vercel (o disco de lá é temporário),
 * então pra publicar de verdade configure o Supabase.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ResultadoSemana, Voto, VotoRecebido } from "./tipos";
import {
  PARTICIPANTES,
  PARTICIPANTES_ATIVOS,
  acharParticipante,
} from "@/config/participantes";

const URL_SUPABASE = process.env.SUPABASE_URL;
const CHAVE_SUPABASE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const usandoSupabase = Boolean(URL_SUPABASE && CHAVE_SUPABASE);

let cliente: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(URL_SUPABASE!, CHAVE_SUPABASE!, {
      auth: { persistSession: false },
    });
  }
  return cliente;
}

/* ────────────────────────────── driver: arquivo ───────────────────────────── */

const ARQUIVO = path.join(process.cwd(), ".dados", "votos.json");

/** Serializa as escritas pra duas requisições simultâneas não se atropelarem. */
let fila: Promise<unknown> = Promise.resolve();
function emFila<T>(fn: () => Promise<T>): Promise<T> {
  const proxima = fila.then(fn, fn);
  fila = proxima.catch(() => {});
  return proxima;
}

async function lerArquivo(): Promise<Voto[]> {
  try {
    return JSON.parse(await fs.readFile(ARQUIVO, "utf8")) as Voto[];
  } catch {
    return [];
  }
}

async function gravarArquivo(votos: Voto[]): Promise<void> {
  await fs.mkdir(path.dirname(ARQUIVO), { recursive: true });
  await fs.writeFile(ARQUIVO, JSON.stringify(votos, null, 2), "utf8");
}

/* ──────────────────────────────── operações ───────────────────────────────── */

/**
 * Grava a rodada inteira de uma pessoa. Se ela já tinha votado nessa semana,
 * os votos antigos são substituídos (upsert pela chave semana+votante+alvo).
 */
export async function registrarVotos(votos: Voto[]): Promise<void> {
  if (votos.length === 0) return;

  if (usandoSupabase) {
    const { error } = await supabase()
      .from("votos")
      .upsert(
        votos.map((v) => ({
          semana: v.semana,
          votante: v.votante,
          alvo: v.alvo,
          emoji: v.emoji,
          justificativa: v.justificativa?.trim() || null,
        })),
        { onConflict: "semana,votante,alvo" },
      );
    if (error) throw new Error(`Supabase: ${error.message}`);
    return;
  }

  await emFila(async () => {
    const todos = await lerArquivo();
    const chave = (v: Voto) => `${v.semana}|${v.votante}|${v.alvo}`;
    const novos = new Set(votos.map(chave));
    const mantidos = todos.filter((v) => !novos.has(chave(v)));
    await gravarArquivo([
      ...mantidos,
      ...votos.map((v) => ({ ...v, justificativa: v.justificativa?.trim() || null })),
    ]);
  });
}

/** Em quem essa pessoa já votou nesta semana (usado pra saber se ela terminou). */
export async function alvosJaVotados(
  semana: string,
  votante: string,
): Promise<string[]> {
  if (usandoSupabase) {
    const { data, error } = await supabase()
      .from("votos")
      .select("alvo")
      .eq("semana", semana)
      .eq("votante", votante);
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data ?? []).map((l) => l.alvo as string);
  }

  const todos = await lerArquivo();
  return todos
    .filter((v) => v.semana === semana && v.votante === votante)
    .map((v) => v.alvo);
}

/**
 * Consolida a semana, com nome e sobrenome: o painel mostra quem deu qual
 * emoji pra quem, igual ao mural do BBB. Nada aqui é anônimo.
 */
export async function resultadosDaSemana(semana: string): Promise<ResultadoSemana> {
  let votos: Voto[];

  if (usandoSupabase) {
    const { data, error } = await supabase()
      .from("votos")
      .select("semana, votante, alvo, emoji, justificativa")
      .eq("semana", semana);
    if (error) throw new Error(`Supabase: ${error.message}`);
    votos = (data ?? []) as Voto[];
  } else {
    votos = (await lerArquivo()).filter((v) => v.semana === semana);
  }

  /*
   * Quem entra no mural desta semana: os ativos de hoje MAIS quem aparece nos
   * votos dela. Sem a segunda metade, desativar alguém apagaria retroativamente
   * os votos que essa pessoa levou — o histórico das semanas em que ela ainda
   * jogava ficaria torto.
   */
  const daSemana = new Map<string, string>();
  for (const p of PARTICIPANTES_ATIVOS) daSemana.set(p.id, p.id);
  for (const v of votos) {
    for (const id of [v.votante, v.alvo]) {
      if (!daSemana.has(id) && acharParticipante(id)) daSemana.set(id, id);
    }
  }

  const porAlvo = new Map<string, VotoRecebido[]>();
  for (const id of daSemana.keys()) porAlvo.set(id, []);

  const votantes = new Set<string>();
  for (const v of votos) {
    votantes.add(v.votante);
    const recebidos = porAlvo.get(v.alvo);
    if (!recebidos) continue; // votou em alguém que sumiu da config de vez
    recebidos.push({
      votante: v.votante,
      emoji: v.emoji,
      justificativa: v.justificativa?.trim() || null,
    });
  }

  // Ordem estável (a da lista de participantes) em vez da ordem de gravação,
  // pra a tabela não dançar a cada visita.
  const posicao = new Map(PARTICIPANTES.map((p, i) => [p.id, i]));
  const ordem = (id: string) => posicao.get(id) ?? Number.MAX_SAFE_INTEGER;

  const ids = [...daSemana.keys()].sort((a, b) => ordem(a) - ordem(b));

  return {
    semana,
    votantes: [...votantes].sort((a, b) => ordem(a) - ordem(b)),
    resultados: ids.map((id) => {
      const recebidos = porAlvo.get(id)!.sort((a, b) => ordem(a.votante) - ordem(b.votante));

      const contagem: Record<string, number> = {};
      for (const r of recebidos) contagem[r.emoji] = (contagem[r.emoji] ?? 0) + 1;

      return { alvo: id, contagem, total: recebidos.length, recebidos };
    }),
  };
}
