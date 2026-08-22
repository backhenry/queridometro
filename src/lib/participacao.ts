import type { Participante } from "@/config/participantes";

/**
 * Pode votar nesta semana?
 *
 * Levar voto é uma coisa, dar voto é outra. Quem está de castigo (`semVoto`)
 * continua aparecendo no mural e recebendo emoji dos outros — só não vota.
 * Pra sumir de vez, o campo é o `ativo: false`.
 */
export function podeVotarNaSemana(p: Participante, semana: string): boolean {
  if (p.ativo === false) return false;
  if (!p.semVoto) return true;

  const castigos = Array.isArray(p.semVoto) ? p.semVoto : [p.semVoto];
  return !castigos.includes(semana);
}
