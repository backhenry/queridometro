import Link from "next/link";
import Avatar from "@/components/Avatar";
import { EMOJIS, MOSTRAR_JUSTIFICATIVAS } from "@/config/emojis";
import { acharParticipante } from "@/config/participantes";
import { podeVotarNaSemana } from "@/lib/participacao";
import { resolverEmoji } from "@/lib/emoji";
import { resultadosDaSemana } from "@/lib/db";
import { rotuloDaSemana, semanaAtual, semanaRelativa } from "@/lib/semana";

export const dynamic = "force-dynamic";

export default async function Resultados({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana: pedida } = await searchParams;
  const semana = pedida && /^\d{4}-W\d{2}$/.test(pedida) ? pedida : semanaAtual();
  const ehSemanaAtual = semana === semanaAtual();

  const { votantes, resultados } = await resultadosDaSemana(semana);
  const temVoto = votantes.length > 0;

  // Quem levou mais votos primeiro; empate desempata pelo nome.
  const ordenados = [...resultados].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    const na = acharParticipante(a.alvo)?.nome ?? "";
    const nb = acharParticipante(b.alvo)?.nome ?? "";
    return na.localeCompare(nb, "pt-BR");
  });

  /** Consulta rápida pro mural: quem deu o quê pra quem. */
  const mural = new Map<string, string>();
  for (const r of resultados) {
    for (const v of r.recebidos) mural.set(`${v.votante}→${r.alvo}`, v.emoji);
  }

  /*
   * As colunas saem do resultado da semana, não da lista de ativos de hoje.
   * Assim quem saiu do queridômetro continua aparecendo nas semanas em que
   * ainda jogava, em vez de virar uma lacuna no histórico.
   */
  const colunas = resultados
    .map((r) => acharParticipante(r.alvo))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // Quem estava de castigo não conta no "x de y já votaram" — senão o placar
  // dessa semana nunca fecha.
  const podemVotar = colunas.filter((p) => podeVotarNaSemana(p, semana)).length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <header className="mb-6 text-center">
        <Link href="/" className="text-xs text-[var(--color-texto-suave)]">
          ← início
        </Link>
        <h1 className="mt-2 bg-gradient-to-br from-white via-fuchsia-100 to-fuchsia-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          O Queridômetro
        </h1>
        <p className="mt-1 text-sm text-[var(--color-texto-suave)]">
          {rotuloDaSemana(semana)}
          {ehSemanaAtual && " · rolando agora"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-texto-suave)]">
          {votantes.length === 0
            ? "ninguém votou ainda"
            : votantes.length === 1
              ? "1 pessoa votou"
              : `${votantes.length} de ${podemVotar} já votaram`}
        </p>
      </header>

      {!temVoto ? (
        <div className="vidro flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center">
          <p className="text-5xl">🫧</p>
          <p className="font-semibold">Semana em branco</p>
          <p className="text-sm text-[var(--color-texto-suave)]">
            Assim que a galera votar, os emojis aparecem aqui.
          </p>
          {ehSemanaAtual && (
            <Link
              href="/votar"
              className="mt-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-bold transition active:scale-95"
            >
              Ser o primeiro
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ───────────────────────────── o mural ───────────────────────── */}
          <section className="vidro mb-6 overflow-hidden rounded-3xl">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="font-bold">O mural</h2>
              <p className="text-xs text-[var(--color-texto-suave)]">
                Cada linha é quem votou · cada coluna é quem levou · arraste pro lado
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="border-collapse text-center">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-[#160c28] p-2 text-left text-[10px] font-medium text-[var(--color-texto-suave)]">
                      deu ↓ / levou →
                    </th>
                    {colunas.map((p) => (
                      <th key={p.id} className="w-12 min-w-12 px-1 pb-2 pt-3 font-normal">
                        <Avatar
                          participante={p}
                          tamanhoFonte="text-[9px]"
                          className="mx-auto size-8 rounded-full ring-1 ring-white/15"
                        />
                        <span className="mt-1 block truncate text-[9px] text-[var(--color-texto-suave)]">
                          {p.nome}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {votantes.map((idVotante) => {
                    const votante = acharParticipante(idVotante);
                    if (!votante) return null;
                    return (
                      <tr key={idVotante} className="border-t border-white/5">
                        <th className="sticky left-0 z-10 bg-[#160c28] p-2 text-left font-normal">
                          <span className="flex items-center gap-1.5">
                            <Avatar
                              participante={votante}
                              tamanhoFonte="text-[8px]"
                              className="size-6 shrink-0 rounded-full ring-1 ring-white/15"
                            />
                            <span className="truncate text-[11px]">{votante.nome}</span>
                          </span>
                        </th>
                        {colunas.map((alvo) => {
                          if (alvo.id === idVotante) {
                            return (
                              <td key={alvo.id} className="bg-white/[0.03] text-white/15">
                                ·
                              </td>
                            );
                          }
                          const voto = mural.get(`${idVotante}→${alvo.id}`);
                          return (
                            <td key={alvo.id} className="py-1.5 text-xl">
                              {voto ? (
                                <span title={resolverEmoji(voto).nome}>
                                  {resolverEmoji(voto).emoji}
                                </span>
                              ) : (
                                <span className="text-white/15">–</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ──────────────────────── um por um ──────────────────────────── */}
          <div className="flex flex-col gap-3">
            {ordenados.map((r) => {
              const pessoa = acharParticipante(r.alvo);
              if (!pessoa) return null;

              // Emojis que essa pessoa recebeu, do mais votado pro menos.
              const recebidos = Object.entries(r.contagem)
                .map(([id, qtd]) => ({ ...resolverEmoji(id), qtd }))
                .sort((a, b) => b.qtd - a.qtd);
              const campeao = recebidos[0];

              return (
                <article key={r.alvo} className="vidro overflow-hidden rounded-3xl">
                  <div className="flex items-center gap-3 p-4">
                    <Avatar
                      participante={pessoa}
                      tamanhoFonte="text-lg"
                      className="size-14 shrink-0 rounded-2xl ring-1 ring-white/15"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold">{pessoa.nome}</p>
                      <p className="text-xs text-[var(--color-texto-suave)]">
                        {r.total === 0 ? "sem votos" : `${r.total} voto${r.total > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    {campeao && (
                      <span className="shrink-0 text-4xl drop-shadow" title={campeao.nome}>
                        {campeao.emoji}
                      </span>
                    )}
                  </div>

                  {recebidos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                      {recebidos.map((e) => (
                        <span
                          key={e.id}
                          className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm"
                          style={{ borderColor: `${e.cor}55`, background: `${e.cor}1a` }}
                        >
                          {e.emoji}
                          <span className="text-xs font-bold tabular-nums">{e.qtd}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {r.recebidos.length > 0 && (
                    <details className="border-t border-white/10 bg-black/20">
                      <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-texto-suave)]">
                        Quem votou
                      </summary>
                      <ul className="flex flex-col gap-2 px-4 pb-4">
                        {r.recebidos.map((v) => {
                          const quem = acharParticipante(v.votante);
                          const e = resolverEmoji(v.emoji);
                          return (
                            <li key={v.votante} className="flex items-start gap-2.5">
                              {quem && (
                                <Avatar
                                  participante={quem}
                                  tamanhoFonte="text-[8px]"
                                  className="mt-0.5 size-7 shrink-0 rounded-full ring-1 ring-white/15"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    {quem?.nome ?? v.votante}
                                  </span>{" "}
                                  <span className="text-[var(--color-texto-suave)]">deu</span>{" "}
                                  <span className="text-base">{e.emoji}</span>
                                </p>
                                {MOSTRAR_JUSTIFICATIVAS && v.justificativa && (
                                  <p className="mt-1 rounded-lg border-l-2 border-fuchsia-400/50 bg-white/5 px-2.5 py-1.5 text-sm text-white/85">
                                    {v.justificativa}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      <nav className="mt-8 flex items-center justify-between text-sm">
        <Link
          href={`/resultados?semana=${semanaRelativa(semana, -1)}`}
          className="vidro rounded-full px-4 py-2 transition active:scale-95"
        >
          ← semana anterior
        </Link>
        {!ehSemanaAtual && (
          <Link href="/resultados" className="vidro rounded-full px-4 py-2 transition active:scale-95">
            semana atual →
          </Link>
        )}
      </nav>

      {/* Legenda: o que cada emoji da galeria fixa quer dizer. */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs text-[var(--color-texto-suave)]">
        {EMOJIS.map((e) => (
          <span key={e.id}>
            {e.emoji} {e.nome}
          </span>
        ))}
      </div>
    </main>
  );
}
