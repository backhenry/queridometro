export type Voto = {
  semana: string;
  votante: string;
  alvo: string;
  emoji: string;
  justificativa?: string | null;
};

/** Um voto recebido, já com o nome de quem deu. */
export type VotoRecebido = {
  votante: string;
  emoji: string;
  justificativa: string | null;
};

/** Resultado consolidado de uma pessoa numa semana. */
export type ResultadoParticipante = {
  alvo: string;
  /** Quantos votos cada emoji recebeu: { coracao: 3, cobra: 1 } */
  contagem: Record<string, number>;
  total: number;
  /** Quem votou nessa pessoa e o que deu, na ordem da lista de participantes. */
  recebidos: VotoRecebido[];
};

export type ResultadoSemana = {
  semana: string;
  /** Ids de quem já fechou a rodada nesta semana. */
  votantes: string[];
  resultados: ResultadoParticipante[];
};
