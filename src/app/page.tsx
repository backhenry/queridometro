"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { acharParticipante } from "@/config/participantes";
import { lerCodigo, limparCodigo, salvarCodigo } from "@/lib/eu";
import { rotuloDaSemana, semanaAtual } from "@/lib/semana";

type Sessao = {
  id: string;
  nome: string;
  jaVotou: boolean;
  alvosVotados: string[];
  podeVotar: boolean;
};

export default function Inicio() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [digitado, setDigitado] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [semana, setSemana] = useState("");

  const entrar = useCallback(async (codigo: string, salvandoAgora: boolean) => {
    setEntrando(true);
    setErro(null);
    try {
      const r = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const dados = await r.json();

      if (!r.ok) {
        // Código salvo que deixou de valer (você trocou): limpa e pede de novo.
        if (!salvandoAgora) limparCodigo();
        throw new Error(dados?.erro ?? "Código não confere.");
      }

      if (salvandoAgora) salvarCodigo(codigo);
      setSessao(dados);
      setDigitado("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Deu ruim ao entrar.");
    } finally {
      setEntrando(false);
    }
  }, []);

  useEffect(() => {
    setSemana(semanaAtual());
    const guardado = lerCodigo();
    if (guardado) entrar(guardado, false).finally(() => setCarregando(false));
    else setCarregando(false);
  }, [entrar]);

  const pessoa = sessao ? acharParticipante(sessao.id) : undefined;

  return (
    <main className="sem-selecao mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10">
      <header className="mb-8 text-center">
        <h1 className="bg-gradient-to-br from-white via-fuchsia-100 to-fuchsia-400 bg-clip-text text-4xl font-black tracking-tight text-transparent">
          Queridômetro
        </h1>
        {semana && (
          <p className="mt-2 text-sm text-[var(--color-texto-suave)]">
            Rodada de {rotuloDaSemana(semana)}
          </p>
        )}
      </header>

      {carregando ? (
        <div className="flex flex-1 items-center justify-center text-[var(--color-texto-suave)]">
          carregando…
        </div>
      ) : !pessoa || !sessao ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (digitado.trim()) entrar(digitado.trim(), true);
          }}
          className="flex flex-col"
        >
          <h2 className="mb-1 text-center text-lg font-semibold">Qual é o seu código?</h2>
          <p className="mb-5 text-center text-xs text-[var(--color-texto-suave)]">
            Aquele que o Henrique te mandou no privado
          </p>

          <input
            value={digitado}
            onChange={(e) => setDigitado(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            aria-label="Seu código de acesso"
            className="w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] outline-none placeholder:tracking-[0.3em] placeholder:text-white/20 focus:border-fuchsia-400/60"
          />

          {erro && (
            <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center text-sm text-red-200">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={entrando || digitado.trim().length === 0}
            className="mt-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 py-4 text-lg font-bold shadow-lg shadow-fuchsia-500/25 transition active:scale-95 disabled:opacity-40"
          >
            {entrando ? "Conferindo…" : "Entrar"}
          </button>

          <Link
            href="/resultados"
            className="mt-3 text-center text-sm text-[var(--color-texto-suave)] underline-offset-4 hover:underline"
          >
            só quero ver o mural
          </Link>
        </form>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="vidro flex items-center gap-4 rounded-3xl p-4">
            <Avatar
              participante={pessoa}
              tamanhoFonte="text-lg"
              priority
              className="size-14 shrink-0 rounded-full ring-2 ring-fuchsia-400/50"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[var(--color-texto-suave)]">Você é</p>
              <p className="truncate text-lg font-bold">{pessoa.nome}</p>
            </div>
            <button
              onClick={() => {
                limparCodigo();
                setSessao(null);
              }}
              className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[var(--color-texto-suave)] transition active:scale-95"
            >
              sair
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {!sessao.podeVotar ? (
              <div className="vidro rounded-3xl p-5 text-center">
                <p className="text-3xl">🙊</p>
                <p className="mt-2 font-semibold">Você está de castigo essa semana</p>
                <p className="mt-1 text-sm text-[var(--color-texto-suave)]">
                  Continua levando voto de todo mundo, mas não vota nessa rodada.
                  Na segunda você volta.
                </p>
              </div>
            ) : sessao.jaVotou ? (
              <div className="vidro rounded-3xl p-5 text-center">
                <p className="text-3xl">✅</p>
                <p className="mt-2 font-semibold">Você já votou essa semana</p>
                <p className="mt-1 text-sm text-[var(--color-texto-suave)]">
                  Dá pra refazer, se mudou de ideia.
                </p>
                <Link
                  href="/votar"
                  className="mt-4 inline-block rounded-full border border-white/15 px-4 py-2 text-sm transition active:scale-95"
                >
                  Refazer meus votos
                </Link>
              </div>
            ) : (
              <Link
                href="/votar"
                className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 py-4 text-center text-lg font-bold shadow-lg shadow-fuchsia-500/25 transition active:scale-95"
              >
                Começar a votar
              </Link>
            )}

            <Link
              href="/resultados"
              className="vidro rounded-full px-6 py-4 text-center font-semibold transition active:scale-95"
            >
              Ver o queridômetro
            </Link>
          </div>

          <p className="mt-auto pt-10 text-center text-xs text-[var(--color-texto-suave)]">
            A votação zera toda segunda-feira.
          </p>
        </div>
      )}
    </main>
  );
}
