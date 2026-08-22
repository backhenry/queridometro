"use client";

import Avatar from "@/components/Avatar";
import type { Participante } from "@/config/participantes";

/** O cartão com a foto grande. Usado tanto no topo da pilha quanto na prévia de trás. */
export default function CartaoVoto({
  participante,
  prioridade = false,
}: {
  participante: Participante;
  prioridade?: boolean;
}) {
  return (
    <div className="relative size-full overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 shadow-2xl shadow-black/50">
      <Avatar
        participante={participante}
        priority={prioridade}
        tamanhoFonte="text-7xl"
        className="size-full"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-5 pb-5 pt-16">
        <p className="text-3xl font-black tracking-tight drop-shadow">{participante.nome}</p>
      </div>
    </div>
  );
}
