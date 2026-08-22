/**
 * O código de acesso da pessoa, guardado no próprio aparelho pra ela não
 * ter que digitar toda semana. É ele que vai junto de cada voto — quem
 * está votando é sempre decidido no servidor, a partir daqui.
 */

const CHAVE = "queridometro:codigo";

export function lerCodigo(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CHAVE);
}

export function salvarCodigo(codigo: string): void {
  window.localStorage.setItem(CHAVE, codigo);
}

export function limparCodigo(): void {
  window.localStorage.removeItem(CHAVE);
  // A chave antiga guardava o id direto, sem código nenhum. Se sobrou de uma
  // visita antiga, sai fora: ela não vale mais como identidade.
  window.localStorage.removeItem("queridometro:eu");
}
