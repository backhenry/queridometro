/**
 * A votação é semanal: a semana vira toda segunda-feira, 00:00 de Brasília.
 * A chave da semana ("2026-W33") é o que separa uma rodada da outra no banco.
 */

const FUSO = "America/Sao_Paulo";

/** Pega ano/mês/dia de uma data já convertidos para o fuso de Brasília. */
function dataEmBrasilia(d: Date): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const [ano, mes, dia] = partes.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** Chave da semana no padrão ISO-8601, ex.: "2026-W33". */
export function semanaAtual(agora: Date = new Date()): string {
  const d = dataEmBrasilia(agora);

  // ISO: a semana pertence ao ano da sua quinta-feira.
  const diaDaSemana = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - diaDaSemana + 3);
  const anoIso = d.getUTCFullYear();

  // Quinta-feira da semana 1 daquele ano.
  const primeiraQuinta = new Date(Date.UTC(anoIso, 0, 4));
  primeiraQuinta.setUTCDate(
    primeiraQuinta.getUTCDate() - ((primeiraQuinta.getUTCDay() + 6) % 7) + 3,
  );

  const semana =
    1 + Math.round((d.getTime() - primeiraQuinta.getTime()) / (7 * 86_400_000));

  return `${anoIso}-W${String(semana).padStart(2, "0")}`;
}

/** Segunda-feira que abre a semana informada (meia-noite UTC do dia). */
export function segundaDaSemana(chave: string): Date {
  const [ano, semanaStr] = chave.split("-W");
  const semana = Number(semanaStr);

  const primeiraQuinta = new Date(Date.UTC(Number(ano), 0, 4));
  primeiraQuinta.setUTCDate(
    primeiraQuinta.getUTCDate() - ((primeiraQuinta.getUTCDay() + 6) % 7) + 3,
  );

  const segunda = new Date(primeiraQuinta);
  segunda.setUTCDate(primeiraQuinta.getUTCDate() - 3 + (semana - 1) * 7);
  return segunda;
}

/** Anda `delta` semanas a partir de uma chave. `semanaRelativa("2026-W33", -1)` → "2026-W32". */
export function semanaRelativa(chave: string, delta: number): string {
  const segunda = segundaDaSemana(chave);
  segunda.setUTCDate(segunda.getUTCDate() + delta * 7);
  // Meio-dia UTC cai no mesmo dia em Brasília, então a conversão de fuso não escorrega.
  return semanaAtual(new Date(segunda.getTime() + 12 * 3_600_000));
}

/** Rótulo amigável, ex.: "10 a 16 de agosto". */
export function rotuloDaSemana(chave: string): string {
  const inicio = segundaDaSemana(chave);
  const fim = new Date(inicio);
  fim.setUTCDate(inicio.getUTCDate() + 6);

  const dia = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { day: "numeric", timeZone: "UTC" }).format(d);
  const mes = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(d);

  return mes(inicio) === mes(fim)
    ? `${dia(inicio)} a ${dia(fim)} de ${mes(fim)}`
    : `${dia(inicio)} de ${mes(inicio)} a ${dia(fim)} de ${mes(fim)}`;
}

/**
 * Quantos milissegundos faltam para a próxima segunda 00:00 de Brasília.
 * Usado no contador "a votação reabre em...".
 */
export function msAteProximaSemana(agora: Date = new Date()): number {
  const hoje = dataEmBrasilia(agora);
  const diaDaSemana = (hoje.getUTCDay() + 6) % 7;

  const proximaSegunda = new Date(hoje);
  proximaSegunda.setUTCDate(hoje.getUTCDate() - diaDaSemana + 7);

  // Meia-noite de Brasília = 03:00 UTC (BRT = UTC-3, sem horário de verão).
  const alvo = proximaSegunda.getTime() + 3 * 3_600_000;
  return Math.max(0, alvo - agora.getTime());
}
