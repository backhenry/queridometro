"use client";

import { useState } from "react";
import type { Participante } from "@/config/participantes";

/**
 * Cor estável por pessoa: o mesmo id sempre gera o mesmo tom.
 * FNV-1a porque ids parecidos ("amigo-1", "amigo-2") precisam cair
 * em cores bem diferentes, e não em tons vizinhos.
 */
function tom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Finalizador do murmur3: sem ele, ids em sequência caem sempre no mesmo
  // par de cores, porque a diferença entre eles vira um passo fixo no módulo.
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) % 360;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : nome.slice(0, 2);
  return letras.toUpperCase();
}

export default function Avatar({
  participante,
  className = "",
  tamanhoFonte = "text-5xl",
  priority = false,
}: {
  participante: Participante;
  className?: string;
  tamanhoFonte?: string;
  priority?: boolean;
}) {
  const [falhou, setFalhou] = useState(false);
  const h = tom(participante.id);

  if (!participante.foto || falhou) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: `linear-gradient(150deg, hsl(${h} 70% 55%), hsl(${(h + 55) % 360} 70% 38%))`,
        }}
        aria-hidden
      >
        <span className={`font-bold tracking-tight text-white/95 ${tamanhoFonte}`}>
          {iniciais(participante.nome)}
        </span>
      </div>
    );
  }

  return (
    // <img> em vez de next/image: as fotos são locais e já vêm no tamanho certo,
    // e assim nada quebra se você trocar um arquivo por outro de dimensão diferente.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={participante.foto}
      alt={participante.nome}
      draggable={false}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFalhou(true)}
      className={`object-cover ${className}`}
    />
  );
}
