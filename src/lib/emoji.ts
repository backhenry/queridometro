/**
 * Um voto guarda ou o id de um emoji da galeria fixa ("coracao"), ou um emoji
 * livre que a pessoa escolheu no teclado dela, gravado como "livre:🥸".
 *
 * O prefixo existe pra não confundir os dois: assim dá pra trocar o emoji de
 * uma opção fixa em src/config/emojis.ts sem mexer no histórico de votos, e ao
 * mesmo tempo aceitar qualquer emoji que ainda nem existia quando o site nasceu.
 */

import { EMOJIS, type OpcaoEmoji } from "@/config/emojis";

export const PREFIXO_LIVRE = "livre:";

/** Emojis com ZWJ (👨‍👩‍👧‍👦) chegam a 25+ caracteres; 40 dá folga sem virar campo livre. */
const TAMANHO_MAXIMO = 40;

const segmentador =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("pt-BR", { granularity: "grapheme" })
    : null;

/**
 * Extrai o último emoji digitado num texto, ou null se não tiver nenhum.
 * Segmenta por grafema pra não partir no meio 👍🏽 (emoji + tom de pele) nem
 * 🏳️‍🌈 (sequência com ZWJ), que são vários pontos de código num símbolo só.
 */
export function ultimoEmoji(texto: string): string | null {
  if (!texto) return null;

  const pedacos = segmentador
    ? [...segmentador.segment(texto)].map((s) => s.segment)
    : [...texto]; // sem Intl.Segmenter, ao menos não parte pares substitutos

  for (let i = pedacos.length - 1; i >= 0; i--) {
    const p = pedacos[i];
    if (p.length <= TAMANHO_MAXIMO && /\p{Extended_Pictographic}/u.test(p)) return p;
  }
  return null;
}

export function ehLivre(id: string): boolean {
  return id.startsWith(PREFIXO_LIVRE);
}

export function montarLivre(emoji: string): string {
  return PREFIXO_LIVRE + emoji;
}

/** Verifica se um valor vindo do navegador é um voto de emoji válido. */
export function emojiValido(id: string): boolean {
  if (EMOJIS.some((e) => e.id === id)) return true;
  if (!ehLivre(id)) return false;

  const char = id.slice(PREFIXO_LIVRE.length);
  return (
    char.length > 0 &&
    char.length <= TAMANHO_MAXIMO &&
    // Tem que ser um grafema só: nada de mandar um texto inteiro disfarçado.
    ultimoEmoji(char) === char
  );
}

/** O que desenhar na tela para um voto, venha ele da galeria fixa ou do teclado. */
export function resolverEmoji(id: string): OpcaoEmoji {
  const fixo = EMOJIS.find((e) => e.id === id);
  if (fixo) return fixo;

  if (ehLivre(id)) {
    const char = id.slice(PREFIXO_LIVRE.length);
    // Cor derivada do próprio emoji: o mesmo símbolo sempre sai da mesma cor.
    const matiz = ((char.codePointAt(0) ?? 0) * 47) % 360;
    return { id, emoji: char, nome: "escolhido na hora", cor: `hsl(${matiz} 70% 55%)` };
  }

  // Emoji que existia na config e foi removido depois.
  return { id, emoji: "❔", nome: "emoji antigo", cor: "#94a3b8" };
}
