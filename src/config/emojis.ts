/**
 * ─────────────────────────────────────────────────────────────
 *  OS EMOJIS DO QUERIDÔMETRO  —  edite à vontade
 * ─────────────────────────────────────────────────────────────
 *
 * `id` é o que vai gravado no banco: não mude depois que a galera
 * começar a votar. O `emoji`, o `nome` e a `cor` você troca quando quiser.
 *
 * Entre 6 e 9 emojis é o ideal — cabe na tela do celular sem apertar.
 */

export type OpcaoEmoji = {
  id: string;
  emoji: string;
  nome: string;
  /** Cor do brilho quando o emoji é escolhido. */
  cor: string;
};

export const EMOJIS: OpcaoEmoji[] = [
  { id: "coracao", emoji: "❤️", nome: "Coração", cor: "#f43f5e" },
  { id: "fogo", emoji: "🔥", nome: "Fogo", cor: "#f97316" },
  { id: "risada", emoji: "😂", nome: "Risada", cor: "#facc15" },
  { id: "palhaco", emoji: "🤡", nome: "Palhaço", cor: "#e879f9" },
  { id: "cobra", emoji: "🐍", nome: "Cobra", cor: "#22c55e" },
  { id: "planta", emoji: "🪴", nome: "Planta", cor: "#4ade80" },
  { id: "tedio", emoji: "🥱", nome: "Tédio", cor: "#94a3b8" },
  { id: "vomito", emoji: "🤮", nome: "Vômito", cor: "#84cc16" },
];

export function acharEmoji(id: string): OpcaoEmoji | undefined {
  return EMOJIS.find((e) => e.id === id);
}

/**
 * Mostrar as justificativas na página de resultados?
 * Deixe `false` se preferir que elas fiquem só no banco.
 *
 * Elas saem assinadas, junto do nome de quem votou.
 */
export const MOSTRAR_JUSTIFICATIVAS = true;

/**
 * Além destes, quem vota pode tocar no "+" e usar qualquer emoji do teclado
 * do próprio celular. Esses votos ficam gravados como "livre:🥸" e aparecem
 * no mural normalmente — só não entram nesta legenda.
 */
