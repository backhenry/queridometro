/**
 * ─────────────────────────────────────────────────────────────
 *  SEUS AMIGOS  —  é aqui que você mexe
 * ─────────────────────────────────────────────────────────────
 *
 * Este é o arquivo de exemplo. O `npm run preparar` copia ele para
 * `participantes.ts`, que é o que o site usa de verdade e que o git ignora
 * (pra você não publicar as fotos e os nomes da sua turma sem querer).
 *
 * Para adicionar alguém:
 *   1. Jogue a foto em  public/participantes/  (ex.: joao.jpg)
 *   2. Adicione uma linha na lista abaixo
 *
 *   { id: "joao", nome: "João", foto: "/participantes/joao.jpg" }
 *
 * REGRAS:
 *   - `id` é o que vai gravado no banco. Depois que a galera votar,
 *     NÃO mude o id de ninguém (os votos antigos ficariam órfãos).
 *     Mudar o `nome` ou a `foto` pode, sem problema.
 *   - `foto` é opcional. Sem foto, o site gera um avatar com as
 *     iniciais e uma cor fixa por pessoa.
 *   - Foto ideal: quadrada, uns 600x600px. Serve qualquer .jpg/.png/.webp.
 *
 * Para tirar alguém do queridômetro sem apagar o histórico de votos,
 * use `ativo: false` em vez de deletar a linha.
 *
 * ⚠️  Mexeu aqui? Rode `npm run codigos` pra gerar o código de quem entrou.
 */

export type Participante = {
  id: string;
  nome: string;
  foto?: string;
  ativo?: boolean;
};

export const PARTICIPANTES: Participante[] = [
  { id: "ana", nome: "Ana" },
  { id: "bruno", nome: "Bruno" },
  { id: "carla", nome: "Carla" },
  { id: "diego", nome: "Diego" },
  { id: "elisa", nome: "Elisa" },
  { id: "felipe", nome: "Felipe" },
];

/** Só quem está ativo entra na votação e nos resultados. */
export const PARTICIPANTES_ATIVOS = PARTICIPANTES.filter((p) => p.ativo !== false);

export function acharParticipante(id: string): Participante | undefined {
  return PARTICIPANTES.find((p) => p.id === id);
}
