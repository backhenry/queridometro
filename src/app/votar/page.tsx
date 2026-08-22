"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Avatar from "@/components/Avatar";
import CartaoVoto from "@/components/CartaoVoto";
import EscolherEmoji from "@/components/EscolherEmoji";
import { EMOJIS } from "@/config/emojis";
import { montarLivre, resolverEmoji } from "@/lib/emoji";
import {
  PARTICIPANTES_ATIVOS,
  acharParticipante,
  type Participante,
} from "@/config/participantes";
import { lerCodigo } from "@/lib/eu";

type Etapa = "votando" | "revisando" | "enviado";

/** Quanto tempo o cartão leva pra sair da tela, em ms. */
const DURACAO_SAIDA = 260;

/** Toques mais rápidos que isso (em ms) são ignorados. */
const INTERVALO_MINIMO = 150;

export default function Votar() {
  const router = useRouter();

  const [eu, setEu] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("votando");
  const [indice, setIndice] = useState(0);
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [justificativas, setJustificativas] = useState<Record<string, string>>({});
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** O cartão que está voando pra fora da tela agora. */
  const [saindo, setSaindo] = useState<Participante | null>(null);
  /** Janelinha do "+", pra votar com um emoji fora da galeria fixa. */
  const [escolhendoLivre, setEscolhendoLivre] = useState(false);

  /**
   * Ignora toques colados um no outro (dedo tremido, duplo-toque), que senão
   * votariam por duas pessoas de uma vez. É comparação de relógio no momento
   * do clique — de propósito, porque timer em aba de fundo o navegador atrasa.
   */
  const ultimoToque = useRef(0);

  useEffect(() => {
    const guardado = lerCodigo();
    if (!guardado) {
      router.replace("/");
      return;
    }

    // Quem é a pessoa quem decide é o servidor, a partir do código.
    // O navegador não escolhe mais a própria identidade.
    let cancelado = false;
    fetch("/api/entrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: guardado }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("codigo invalido"))))
      .then((d) => {
        if (cancelado) return;
        if (!acharParticipante(d.id)) throw new Error("participante sumiu da config");
        // De castigo nesta semana: nem começa a rodada. Sem isso ela votaria
        // em todo mundo pra só então levar um 403 na hora de enviar.
        if (d.podeVotar === false) throw new Error("de castigo nesta semana");
        setEu(d.id);
        setCodigo(guardado);
        setPronto(true);
      })
      .catch(() => {
        if (!cancelado) router.replace("/");
      });

    return () => {
      cancelado = true;
    };
  }, [router]);

  /** Todo mundo menos você. */
  const fila = useMemo(
    () => PARTICIPANTES_ATIVOS.filter((p) => p.id !== eu),
    [eu],
  );

  const atual = fila[indice];
  const proximo = fila[indice + 1];
  // Anda junto com o contador "3/7": no último cartão a barra fecha em 100%.
  const progresso = fila.length ? ((indice + 1) / fila.length) * 100 : 0;

  function votar(idEmoji: string) {
    if (!atual) return;

    const agora = performance.now();
    if (agora - ultimoToque.current < INTERVALO_MINIMO) return;
    ultimoToque.current = agora;

    setEscolhas((e) => ({ ...e, [atual.id]: idEmoji }));
    setSaindo(atual);

    // Avança na hora: o cartão voando é só enfeite, o voto já está registrado.
    if (indice + 1 >= fila.length) setEtapa("revisando");
    else setIndice((i) => i + 1);
  }

  function voltarUm() {
    if (indice === 0) return;
    const anterior = fila[indice - 1];
    setSaindo(null);
    setEscolhas((e) => {
      const copia = { ...e };
      delete copia[anterior.id];
      return copia;
    });
    setIndice((i) => i - 1);
  }

  async function enviar() {
    if (!codigo) return;
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/votos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          votos: fila.map((p) => ({
            alvo: p.id,
            emoji: escolhas[p.id],
            justificativa: justificativas[p.id]?.trim() || null,
          })),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados?.erro ?? "Deu ruim ao enviar.");
      setEtapa("enviado");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Deu ruim ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  if (!pronto) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-[var(--color-texto-suave)]">
        carregando…
      </main>
    );
  }

  if (fila.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-4xl">🫥</p>
        <p className="font-semibold">Não tem em quem votar ainda.</p>
        <p className="text-sm text-[var(--color-texto-suave)]">
          Adicione mais gente em <code>src/config/participantes.ts</code>.
        </p>
        <Link href="/" className="vidro rounded-full px-5 py-2.5 text-sm">
          Voltar
        </Link>
      </main>
    );
  }

  /* ─────────────────────────────── enviado ─────────────────────────────── */
  if (etapa === "enviado") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <motion.p
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="text-6xl"
        >
          🎉
        </motion.p>
        <h1 className="text-2xl font-black">Votos enviados!</h1>
        <p className="text-sm text-[var(--color-texto-suave)]">
          Já estão no mural. A próxima rodada abre na segunda.
        </p>
        <div className="mt-2 flex w-full flex-col gap-3">
          <Link
            href="/resultados"
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 py-4 font-bold shadow-lg shadow-fuchsia-500/25 transition active:scale-95"
          >
            Ver o queridômetro
          </Link>
          <Link href="/" className="vidro rounded-full px-6 py-3.5 font-semibold transition active:scale-95">
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  /* ────────────────────────────── revisando ────────────────────────────── */
  if (etapa === "revisando") {
    return (
      <main className="sem-selecao mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
        <header className="mb-5 text-center">
          <h1 className="text-2xl font-black">Quer justificar?</h1>
          <p className="mt-1 text-sm text-[var(--color-texto-suave)]">
            É opcional — e aparece no mural com o seu nome.
          </p>
        </header>

        <div className="flex flex-col gap-2.5">
          {fila.map((p) => {
            const emoji = resolverEmoji(escolhas[p.id]);
            const aberta = abertas[p.id];
            return (
              <div key={p.id} className="vidro overflow-hidden rounded-2xl">
                <div className="flex items-center gap-3 p-3">
                  <Avatar
                    participante={p}
                    tamanhoFonte="text-sm"
                    className="size-11 shrink-0 rounded-full ring-1 ring-white/15"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.nome}</p>
                    <button
                      onClick={() => setAbertas((a) => ({ ...a, [p.id]: !aberta }))}
                      className="text-xs text-fuchsia-300/90 underline-offset-2 hover:underline"
                    >
                      {justificativas[p.id]?.trim()
                        ? "editar justificativa"
                        : aberta
                          ? "deixar em branco"
                          : "+ justificar"}
                    </button>
                  </div>
                  <span className="shrink-0 text-3xl" title={emoji.nome}>
                    {emoji.emoji}
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {aberta && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <textarea
                          autoFocus
                          maxLength={500}
                          rows={3}
                          value={justificativas[p.id] ?? ""}
                          onChange={(ev) =>
                            setJustificativas((j) => ({ ...j, [p.id]: ev.target.value }))
                          }
                          placeholder={`Por que ${emoji.emoji} pra ${p.nome}?`}
                          className="w-full resize-none rounded-xl border border-white/15 bg-black/25 p-3 text-sm outline-none placeholder:text-white/30 focus:border-fuchsia-400/60"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {erro && (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-center text-sm text-red-200">
            {erro}
          </p>
        )}

        <div className="safe-bottom mt-6 flex flex-col gap-3">
          <button
            onClick={enviar}
            disabled={enviando}
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 py-4 text-lg font-bold shadow-lg shadow-fuchsia-500/25 transition active:scale-95 disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Enviar meus votos"}
          </button>
          <button
            onClick={() => {
              setSaindo(null);
              setEtapa("votando");
              setIndice(fila.length - 1);
            }}
            className="text-sm text-[var(--color-texto-suave)]"
          >
            ← refazer o último voto
          </button>
        </div>
      </main>
    );
  }

  /* ─────────────────────────────── votando ─────────────────────────────── */
  return (
    <main className="sem-selecao mx-auto flex h-dvh w-full max-w-md flex-col px-5 pt-6">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={indice === 0 ? () => router.push("/") : voltarUm}
          aria-label="Voltar"
          className="vidro flex size-9 shrink-0 items-center justify-center rounded-full text-sm transition active:scale-90"
        >
          ←
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-400"
            // Sem isso a barra nasce com 100% (largura natural do div) e encolhe.
            initial={false}
            animate={{ width: `${progresso}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-[var(--color-texto-suave)]">
          {indice + 1}/{fila.length}
        </span>
      </div>

      {/*
        Pilha de cartões. A ordem no DOM é que define quem fica por cima:
        o de trás primeiro, depois o da frente, e por último o que está voando.
        (Uma versão anterior usava AnimatePresence aqui e os cartões que saíam
        se acumulavam no DOM quando os toques vinham rápido.)
      */}
      <div className="relative min-h-0 flex-1">
        {[proximo, atual].map((p, posicao) => {
          if (!p) return null;
          const naFrente = posicao === 1;
          return (
            <motion.div
              key={p.id}
              className="absolute inset-0"
              // Sem animação de entrada: o cartão já nasce na posição certa.
              // Quem anima é o de trás quando vira o da frente — e aí o nó do
              // DOM é o mesmo, então o framer faz a transição sozinho.
              initial={false}
              animate={{ scale: naFrente ? 1 : 0.94, opacity: naFrente ? 1 : 0.4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <CartaoVoto participante={p} prioridade={naFrente} />
            </motion.div>
          );
        })}

        {saindo && (
          <motion.div
            key={`saindo-${saindo.id}`}
            className="absolute inset-0"
            initial={{ x: 0, rotate: 0, opacity: 1, scale: 1 }}
            animate={{ x: 420, rotate: 14, opacity: 0 }}
            transition={{ duration: DURACAO_SAIDA / 1000, ease: "easeIn" }}
            onAnimationComplete={() => setSaindo(null)}
          >
            <CartaoVoto participante={saindo} />
          </motion.div>
        )}
      </div>

      {/* emojis */}
      <div className="safe-bottom pt-4">
        <div className="grid grid-cols-4 gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e.id}
              onClick={() => votar(e.id)}
              className="vidro group flex flex-col items-center gap-1 rounded-2xl py-3 transition active:scale-90"
              style={{ ["--brilho" as string]: e.cor }}
            >
              <span className="text-3xl transition-transform group-active:scale-125">
                {e.emoji}
              </span>
              <span className="text-[10px] font-medium text-[var(--color-texto-suave)]">
                {e.nome}
              </span>
            </button>
          ))}

          {/* Escapatória: qualquer emoji do teclado da pessoa. */}
          <button
            onClick={() => setEscolhendoLivre(true)}
            className="col-span-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 py-2.5 transition active:scale-95"
          >
            <span className="text-xl leading-none">＋</span>
            <span className="text-xs font-medium text-[var(--color-texto-suave)]">
              outro emoji
            </span>
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-[var(--color-texto-suave)]">
          Toque num emoji para votar e ir pro próximo
        </p>
      </div>

      <AnimatePresence>
        {escolhendoLivre && atual && (
          <EscolherEmoji
            nomeDaPessoa={atual.nome}
            aoFechar={() => setEscolhendoLivre(false)}
            aoEscolher={(emoji) => {
              setEscolhendoLivre(false);
              votar(montarLivre(emoji));
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
