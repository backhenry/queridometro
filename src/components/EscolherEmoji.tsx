"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ultimoEmoji } from "@/lib/emoji";

/**
 * Atalhos pra quem está no computador, onde o teclado de emoji não aparece
 * sozinho. No celular o caminho normal é tocar no campo e usar o 😀 do teclado.
 */
const SUGESTOES = [
  "🥹", "🫶", "😎", "🤝", "🙏", "👑", "🎉", "🍀",
  "🤓", "🫠", "😴", "🙃", "🤨", "🫡", "🤌", "💅",
  "🐐", "🦥", "🐒", "🦅", "🍿", "☕", "🧠", "💣",
];

export default function EscolherEmoji({
  nomeDaPessoa,
  aoEscolher,
  aoFechar,
}: {
  nomeDaPessoa: string;
  aoEscolher: (emoji: string) => void;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  // Esc fecha, como em qualquer janelinha.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  function digitou(valor: string) {
    setTexto(valor);
    const achado = ultimoEmoji(valor);
    if (achado) setEscolhido(achado);
  }

  function confirmar() {
    if (escolhido) aoEscolher(escolhido);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-label="Escolher outro emoji"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom w-full max-w-sm rounded-3xl border border-white/15 bg-[#180d2b] p-5 shadow-2xl"
      >
        <p className="text-center text-sm text-[var(--color-texto-suave)]">
          Emoji pra {nomeDaPessoa}
        </p>

        <div className="my-4 flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
          {escolhido ? (
            <motion.span
              key={escolhido}
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="text-6xl"
            >
              {escolhido}
            </motion.span>
          ) : (
            <span className="px-6 text-center text-xs text-white/35">
              escolha abaixo ou use o 😀 do seu teclado
            </span>
          )}
        </div>

        <input
          ref={campo}
          value={texto}
          onChange={(e) => digitou(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmar();
          }}
          placeholder="toque aqui e escolha no teclado"
          aria-label="Digite ou cole um emoji"
          className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-center text-lg outline-none placeholder:text-sm placeholder:text-white/30 focus:border-fuchsia-400/60"
        />

        <div className="mt-4 grid grid-cols-8 gap-1">
          {SUGESTOES.map((e) => (
            <button
              key={e}
              onClick={() => setEscolhido(e)}
              className={`rounded-lg py-1.5 text-xl transition active:scale-90 ${
                escolhido === e ? "bg-fuchsia-500/30 ring-1 ring-fuchsia-400/60" : "hover:bg-white/10"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={aoFechar}
            className="flex-1 rounded-full border border-white/15 py-3 text-sm text-[var(--color-texto-suave)] transition active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!escolhido}
            className="flex-[2] rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3 font-bold transition active:scale-95 disabled:opacity-40"
          >
            Votar {escolhido ?? ""}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
