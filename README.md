# Queridômetro

O queridômetro do BBB, mas pra sua turma. Uma rodada por semana, votação em
estilo Tinder: toca no emoji e já pula pro próximo. No fim, quem quiser
justifica o voto. Tudo vai pro mural, onde dá pra ver quem deu o quê pra quem.

- **Votação semanal** que zera sozinha toda segunda-feira, 00:00 de Brasília
- **Um cartão por vez**, com foto grande e os emojis logo abaixo
- **Botão "+"** pra votar com qualquer emoji do teclado, além da galeria fixa
- **Justificativa opcional** por pessoa, no fim da rodada
- **Mural** em tabela: cada linha é quem votou, cada coluna é quem levou
- **Código de acesso** por pessoa, pra ninguém votar no lugar de outro
- **Histórico** por semana, preservado mesmo quando alguém sai da turma

Feito com Next.js, Tailwind e Supabase. Roda de graça na Vercel.

---

## Subir o seu

Dá uns 15 minutos. Você vai precisar de:

- **Node 20 ou mais novo** — confira com `node -v`
- **Conta no [Supabase](https://supabase.com)** (grátis) pro banco de votos
- **Conta na [Vercel](https://vercel.com)** (grátis) pra hospedar
- As **fotos** da galera

### 1. Baixe e prepare

```bash
git clone https://github.com/backhenry/queridometro.git
cd queridometro
npm install
npm run preparar
```

O `npm run preparar` cria os arquivos que o git não guarda, porque eles têm os
dados da *sua* turma: `src/config/participantes.ts` e `.env.local`.

### 2. Coloque a sua turma

Jogue as fotos em `public/participantes/` e edite
`src/config/participantes.ts`:

```ts
export const PARTICIPANTES: Participante[] = [
  { id: "joao",  nome: "João",  foto: "/participantes/joao.jpg" },
  { id: "maria", nome: "Maria", foto: "/participantes/maria.jpg" },
  { id: "bia",   nome: "Bia" },   // sem foto = avatar com as iniciais
];
```

Sobre as fotos: quadradas ficam melhor, uns 600×600px bastam. Serve `.jpg`,
`.png`, `.jpeg` ou `.webp`. Acima de uns 300 KB vale comprimir, pra abrir
rápido no 4G — no Mac, `sips -s formatOptions 80 foto.jpg --out foto.jpg`
resolve.

O `id` é o que vai gravado no banco. **Depois que a galera começar a votar,
não mude o id de ninguém** — os votos antigos ficariam órfãos. Nome e foto
você troca à vontade.

### 3. Gere os códigos de acesso

```bash
npm run codigos -- --gravar
```

Sai uma lista assim:

```
  João    3KQF7M
  Maria   H8ZNPD
  Bia     WR52TX
```

É esse código que a pessoa digita pra entrar. **Mande cada um no privado,
nunca no grupo** — quem tem o código da Maria vota como a Maria.

Rodou de novo depois de adicionar alguém? Quem já tinha código mantém o mesmo,
só entra código novo pra quem entrou.

### 4. Crie o banco no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Abra o **SQL Editor**, cole o conteúdo de [`supabase.sql`](supabase.sql) e rode
3. Vá em **Project Settings → API** e copie a **Project URL** e a chave **`service_role`**
4. Cole as duas no `.env.local`:

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> É a `service_role` mesmo, não a `anon`. Ela é secreta e só roda no servidor —
> por isso não tem `NEXT_PUBLIC_` no nome, e por isso o `.env.local` está no
> `.gitignore`. Nunca publique essa chave.

### 5. Veja rodando

```bash
npm run dev
```

Abra http://localhost:3000, entre com um dos códigos e dê uma volta pelo site.

### 6. Publique

```bash
npx vercel
```

Ele pergunta algumas coisas — pode aceitar os padrões. Depois cadastre as duas
variáveis de ambiente, uma de cada vez:

```bash
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

E publique pra valer:

```bash
npx vercel --prod
```

No fim ele mostra os endereços. **Use o mais curto** (algo como
`seu-projeto-abc.vercel.app`). O endereço longo, que tem o nome da sua conta no
meio, é protegido por login da Vercel e seus amigos não conseguem abrir.

### 7. Mande pra galera

Um por um, no privado:

> Oi Maria! Criei um queridômetro pra gente 👀
> https://seu-projeto.vercel.app
> Seu código: **H8ZNPD**

Pronto. A rodada vira sozinha toda segunda.

---

## Depois que estiver no ar

**Mudou alguma coisa?** Republique:

```bash
npx vercel --prod
```

Vale pra trocar foto, adicionar gente, mudar emoji — qualquer coisa. O endereço
continua o mesmo.

**Entrou alguém novo:** adicione em `participantes.ts`, jogue a foto na pasta,
rode `npm run codigos -- --gravar` (só ele ganha código novo) e republique.

**Alguém saiu:** use `ativo: false` em vez de apagar a linha:

```ts
{ id: "joao", nome: "João", foto: "/participantes/joao.jpg", ativo: false },
```

Assim o código dele para de funcionar, ele some da votação, mas os votos das
semanas em que ele ainda jogava continuam no mural. Apagar a linha deixaria
esses votos órfãos.

**Castigo do monstro:** pra alguém ficar uma semana sem votar, mas continuar
levando voto dos outros, use `semVoto` com a chave da semana:

```ts
{ id: "joao", nome: "João", foto: "/participantes/joao.jpg", semVoto: "2026-W35" },
```

Ele entra no site normalmente e vê o mural, só não abre a votação. **O castigo
acaba sozinho** quando virar a semana — não precisa lembrar de tirar de lá.
Pra mais de uma semana, passe uma lista: `semVoto: ["2026-W35", "2026-W36"]`.

Não confunda com `ativo: false`, que tira a pessoa do queridômetro inteiro:
ela some da votação de todo mundo e para de receber voto.

**Código vazou ou a pessoa perdeu:** troque na mão em `src/config/codigos.ts` e
republique. O antigo morre na hora e os votos que ela já deu ficam intactos.

---

## Personalizar

**Os emojis** ficam em [`src/config/emojis.ts`](src/config/emojis.ts):

```ts
export const EMOJIS: OpcaoEmoji[] = [
  { id: "coracao", emoji: "❤️", nome: "Coração", cor: "#f43f5e" },
  { id: "cobra",   emoji: "🐍", nome: "Cobra",   cor: "#22c55e" },
];
```

Entre 6 e 9 cabem bem na tela do celular. O `id` é o que vai pro banco — não
mude depois que a galera votar; o `emoji`, o `nome` e a `cor` pode.

Independente dessa lista, todo mundo tem o botão **"+"** pra usar qualquer
emoji do próprio teclado. Esses votos ficam gravados como `livre:🐐`.

**As justificativas** podem sair do mural com `MOSTRAR_JUSTIFICATIVAS = false`
no mesmo arquivo. Elas continuam gravadas no banco, só não aparecem.

---

## Como funciona por dentro

**Semana** — cada rodada é uma semana ISO (`2026-W34`), virando toda segunda
00:00 de Brasília. As semanas passadas continuam visíveis em
`/resultados?semana=2026-W33`.

**Identidade** — a pessoa entra com o código, que fica guardado no
`localStorage` do aparelho pra não digitar toda semana. **Quem está votando é
sempre decidido no servidor**, a partir do código: mandar um `votante: "maria"`
na requisição não adianta nada, o campo é ignorado.

**Os códigos nunca chegam ao navegador.** O arquivo que os guarda tem um
`import "server-only"` no topo, que faz a build *quebrar* se alguém tentar
importá-lo numa tela do site. É proposital — não remova essa linha.

**O banco também não.** O navegador nunca fala com o Supabase direto: tudo
passa pelas rotas em `src/app/api/`, que rodam no servidor. A tabela de votos
fica com RLS ligado e sem nenhuma policy, então a chave pública não lê nem
escreve nada.

**Aberto, não anônimo** — o mural mostra quem deu qual emoji pra quem, e as
justificativas saem assinadas. Quem vota sabe: está escrito na tela antes de
enviar.

**Regras** — ninguém vota em si mesmo, nem envia rodada pela metade. Refazer o
voto na mesma semana substitui o anterior em vez de somar.

---

## Estrutura

```
src/
  config/
    participantes.ts   a sua turma          (git ignora)
    codigos.ts         os códigos           (git ignora)
    emojis.ts          a galeria de emojis
  app/
    page.tsx           entrada pelo código
    votar/             a votação estilo Tinder
    resultados/        o mural da semana
    api/               rotas que falam com o banco
  lib/
    semana.ts          chave ISO da semana, rótulos, virada
    emoji.ts           galeria fixa + emoji livre do teclado
    db.ts              Supabase, ou arquivo local se não configurado
scripts/
  preparar.mjs         monta os arquivos da primeira vez
  gerar-codigos.mjs    gera/atualiza os códigos de acesso
```

Sem o Supabase configurado, os votos vão pra `.dados/votos.json` — dá pra
testar tudo localmente antes de criar conta em lugar nenhum. Esse modo **não
funciona na Vercel**, porque o disco de lá é temporário.

---

## Privacidade

Este repositório não contém foto, nome nem código de ninguém: `participantes.ts`,
`codigos.ts`, `.env.local` e `public/participantes/*` estão no `.gitignore`.

Se você for publicar o *seu* fork, confira antes se eles continuam ignorados —
são fotos de pessoas de verdade e códigos que dão acesso à identidade delas.
