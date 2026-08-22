-- ─────────────────────────────────────────────────────────────
--  Queridômetro — cole isso no SQL Editor do Supabase e rode.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.votos (
  id            uuid primary key default gen_random_uuid(),
  semana        text not null,          -- "2026-W33"
  votante       text not null,          -- id do participante (src/config/participantes.ts)
  alvo          text not null,          -- em quem votou
  emoji         text not null,          -- id do emoji (src/config/emojis.ts)
  justificativa text,
  criado_em     timestamptz not null default now(),

  -- Um voto por pessoa, por alvo, por semana. Refazer o voto sobrescreve.
  constraint votos_unicos unique (semana, votante, alvo),
  -- Ninguém vota em si mesmo.
  constraint votos_sem_autovoto check (votante <> alvo)
);

create index if not exists votos_semana_idx on public.votos (semana);

-- Trava total pra chave pública: o site só fala com o banco pelo servidor
-- (rotas em src/app/api), usando a service_role key, que ignora RLS.
-- Assim ninguém consegue ler quem votou em quem abrindo o devtools.
alter table public.votos enable row level security;

-- Sem nenhuma policy criada, anon e authenticated não leem nem escrevem nada.
-- (Se você já tinha criado alguma policy antes, remova-a.)
revoke all on public.votos from anon, authenticated;
