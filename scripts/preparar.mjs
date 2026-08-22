/**
 * Primeira vez rodando o projeto? Este script monta os arquivos que o git
 * não guarda — os que têm os dados da SUA turma.
 *
 *   npm run preparar
 *
 * Ele nunca sobrescreve nada: se o arquivo já existe, passa direto.
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const passos = [];

function copiarSeFaltar(exemplo, destino) {
  if (existsSync(destino)) {
    passos.push(`  ja existia   ${destino}`);
    return false;
  }
  copyFileSync(exemplo, destino);
  passos.push(`  criado       ${destino}`);
  return true;
}

const criouParticipantes = copiarSeFaltar(
  "src/config/participantes.example.ts",
  "src/config/participantes.ts",
);

if (!existsSync(".env.local")) {
  copyFileSync(".env.local.example", ".env.local");
  passos.push("  criado       .env.local  (preencha com as chaves do Supabase)");
} else {
  passos.push("  ja existia   .env.local");
}

mkdirSync("public/participantes", { recursive: true });

console.log("");
for (const p of passos) console.log(p);
console.log("");

if (!existsSync("src/config/codigos.ts")) {
  console.log("  Falta gerar os códigos de acesso. Rode:");
  console.log("");
  console.log("    npm run codigos -- --gravar");
  console.log("");
} 

if (criouParticipantes) {
  console.log("  Depois edite src/config/participantes.ts com a sua turma");
  console.log("  e jogue as fotos em public/participantes/.");
  console.log("");
}
