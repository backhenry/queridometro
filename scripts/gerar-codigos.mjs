/**
 * Gera os códigos de acesso a partir da sua lista de participantes.
 *
 *   npm run codigos           mostra os códigos na tela
 *   npm run codigos -- --gravar   escreve em src/config/codigos.ts
 *
 * Quem já tem código mantém o mesmo — só entra código novo pra quem entrou
 * na lista depois. Assim ninguém precisa reaprender o código toda vez que
 * você adiciona um amigo.
 */

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ARQUIVO_CODIGOS = "src/config/codigos.ts";
const ARQUIVO_PARTICIPANTES = "src/config/participantes.ts";

// Sem I, O, 0 e 1: some gente confunde na hora de digitar.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TAMANHO = 6;

function novoCodigo(jaUsados) {
  for (let tentativa = 0; tentativa < 1000; tentativa++) {
    let c = "";
    for (const b of randomBytes(TAMANHO)) c += ALFABETO[b % ALFABETO.length];
    if (!jaUsados.has(c)) return c;
  }
  throw new Error("Não consegui gerar um código novo. Isso não deveria acontecer.");
}

function lerParticipantes() {
  if (!existsSync(ARQUIVO_PARTICIPANTES)) {
    console.error(`\n  Falta o ${ARQUIVO_PARTICIPANTES}. Rode primeiro:\n\n    npm run preparar\n`);
    process.exit(1);
  }
  const src = readFileSync(ARQUIVO_PARTICIPANTES, "utf8");

  // Só o que está DENTRO do array. Sem recortar, os exemplos que aparecem
  // nos comentários do arquivo entram na lista como se fossem gente de verdade.
  const bloco = src.match(/PARTICIPANTES\s*:\s*Participante\[\]\s*=\s*\[([\s\S]*?)\n\];/);
  if (!bloco) {
    console.error(`\n  Não achei a lista PARTICIPANTES em ${ARQUIVO_PARTICIPANTES}.\n`);
    process.exit(1);
  }

  const semComentarios = bloco[1]
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");

  return [...semComentarios.matchAll(/id:\s*"([^"]+)",\s*nome:\s*"([^"]+)"/g)].map((m) => ({
    id: m[1],
    nome: m[2],
  }));
}

function lerCodigosExistentes() {
  if (!existsSync(ARQUIVO_CODIGOS)) return {};
  const src = readFileSync(ARQUIVO_CODIGOS, "utf8");
  const bloco = src.match(/const CODIGOS[^{]*\{([\s\S]*?)\n\};/);
  if (!bloco) return {};
  return Object.fromEntries([...bloco[1].matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
}

function montarArquivo(codigos) {
  const linhas = Object.entries(codigos)
    .map(([id, c]) => `  ${id}: "${c}",`)
    .join("\n");

  return `/**
 * ─────────────────────────────────────────────────────────────
 *  CÓDIGOS DE ACESSO  —  um por pessoa, secreto
 * ─────────────────────────────────────────────────────────────
 *
 * GERADO POR \`npm run codigos -- --gravar\`. Dá pra editar na mão também.
 *
 * É o código que prova quem é quem. Quem tem o código da Ana vota como a
 * Ana — então mande cada um no privado, nunca no grupo.
 *
 * ⚠️  O \`import "server-only"\` aqui embaixo não é decoração: ele faz a build
 *     QUEBRAR se alguém importar este arquivo numa tela do site. Sem isso os
 *     códigos iriam parar no navegador e qualquer um leria no devtools.
 *     Nunca remova essa linha.
 *
 * Para trocar o código de alguém (vazou, a pessoa perdeu): muda aqui e
 * republica. O antigo para de funcionar na hora, e os votos que a pessoa
 * já deu continuam intactos.
 */

import "server-only";
import { PARTICIPANTES } from "./participantes";

const CODIGOS: Record<string, string> = {
${linhas}
};

/** Descobre de quem é um código. Devolve null se não for de ninguém. */
export function participantePorCodigo(codigo: string): string | null {
  const limpo = normalizarCodigo(codigo);
  if (!limpo) return null;

  for (const [id, esperado] of Object.entries(CODIGOS)) {
    if (esperado === limpo) return id;
  }
  return null;
}

/** Aceita "ab1 2cd", "ab1-2cd" ou "AB12CD" — tudo vira AB12CD. */
export function normalizarCodigo(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Confere na hora da build que ninguém ficou de fora nem sobrando.
 * Melhor estourar aqui do que a pessoa descobrir na hora de votar.
 */
const idsSemCodigo = PARTICIPANTES.filter((p) => !CODIGOS[p.id]).map((p) => p.id);
if (idsSemCodigo.length > 0) {
  throw new Error(
    \`Participantes sem código em src/config/codigos.ts: \${idsSemCodigo.join(", ")}\`,
  );
}
`;
}

const participantes = lerParticipantes();
if (participantes.length === 0) {
  console.error(`\n  Não achei ninguém em ${ARQUIVO_PARTICIPANTES}.\n`);
  process.exit(1);
}

const existentes = lerCodigosExistentes();
const usados = new Set(Object.values(existentes));
const codigos = {};
const novos = [];

for (const p of participantes) {
  if (existentes[p.id]) {
    codigos[p.id] = existentes[p.id];
  } else {
    const c = novoCodigo(usados);
    usados.add(c);
    codigos[p.id] = c;
    novos.push(p.id);
  }
}

const gravar = process.argv.includes("--gravar");
if (gravar) {
  writeFileSync(ARQUIVO_CODIGOS, montarArquivo(codigos));
}

const largura = Math.max(...participantes.map((p) => p.nome.length)) + 2;
console.log("");
for (const p of participantes) {
  const marca = novos.includes(p.id) ? "  (novo)" : "";
  console.log(`  ${p.nome.padEnd(largura)}${codigos[p.id]}${marca}`);
}
console.log("");
console.log(
  gravar
    ? `  Gravado em ${ARQUIVO_CODIGOS}. Mande cada código no privado — nunca no grupo.`
    : `  Nada foi gravado. Use --gravar pra escrever em ${ARQUIVO_CODIGOS}.`,
);
console.log("");
