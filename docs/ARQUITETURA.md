# Ranch Sorting Pro — Documentação de Arquitetura

Aplicação web para organização e apuração de provas de **Ranch Sorting** (prova
equestre de separação de bois em duplas). Permite ao **organizador** cadastrar
competidores, sortear duplas, registrar passadas das qualificatórias e finais e
gerar classificações/relatórios; e ao **competidor** consultar seu histórico
através de um portal público.

> ⚠️ Apesar de o pedido original mencionar "React Native", **este projeto é uma
> aplicação web React** (Create React App + `react-app-rewired`), não React
> Native. As recomendações de performance abaixo são as equivalentes do
> ecossistema web (code-splitting, memoização, etc.).

---

## 1. Stack técnica

| Camada | Tecnologia |
| --- | --- |
| UI | React 19, React Router 6, Tailwind CSS 3 |
| Build | Create React App 5 + `react-app-rewired` (`config-overrides.js`) |
| Linguagem | TypeScript 4.9 (`strict: true`) |
| Backend / persistência | Firebase (Auth + Cloud Firestore) |
| Offline | Firestore `persistentLocalCache` (multi-aba) |
| Exportação | `xlsx` (planilhas), Canvas API (PNG) |
| Importação | `xlsx` (Excel), `pdfjs-dist` (PDF) |
| Testes | Jest + Testing Library (via CRA) |

---

## 2. Arquitetura em camadas (Clean Architecture)

O código é organizado em camadas concêntricas, do **domínio puro** (sem
dependências externas) até a **UI**. A dependência sempre aponta para dentro:
a UI conhece o domínio, mas o domínio não conhece a UI nem o Firebase.

```
┌─────────────────────────────────────────────────────────────┐
│  screens/  +  components/         (UI — React)                │
│  "o que o usuário vê e clica"                                 │
│        │ usa hooks/context, nunca chama Firebase direto*      │
│        ▼                                                       │
│  context/  +  hooks/              (Estado de aplicação)       │
│  AuthContext, CompetitionContext, ResultContext, useSubscription │
│        │ orquestra domínio + serviços                         │
│        ▼                                                       │
│  services/                        (Infraestrutura / API)      │
│  services/firebase/*  — única camada que fala com o Firestore │
│        │ converte documentos ⇄ modelos de domínio            │
│        ▼                                                       │
│  core/                            (Domínio puro — sem I/O)    │
│  models/ (tipos)  +  logic/ (regras: pairing, scoring, finals)│
└─────────────────────────────────────────────────────────────┘
```

\* Exceções pontuais: algumas telas de leitura (Dashboard, portal) chamam
funções de `services/` diretamente para buscar dados — sempre passando pela
camada de serviço, nunca acessando o SDK do Firestore na tela.

### Por que essa separação importa

- **`core/logic`** contém as regras de negócio como funções puras
  (`generateUniqueDuos`, `buildBestQualifierScorePerDuo`, `selectFinalists`,
  `aggregateFinals`, `computeTimeToBeat`). São determinísticas e testáveis sem
  React nem Firebase — é onde está a maior cobertura de testes unitários.
- **`services/firebase`** isola o SDK do Firestore. Cada arquivo expõe funções
  de alto nível (`listCompetitions`, `createCompetitor…`) e converte os
  documentos crus (`any`) em modelos tipados via funções `toX(...)`, aplicando
  migrações de dados legados (categorias antigas, IDs de dupla com separador
  `🤝`).
- **`context/`** guarda o estado vivo da competição em memória e cuida da
  sincronização com o Firestore (com _debounce_).

---

## 3. Estrutura de pastas

```
src/
├── App.tsx                  # Árvore de Providers + rotas (lazy-loaded)
├── main.tsx / index.js      # Bootstrap do React
├── firebase.ts              # Inicialização do SDK Firebase (Auth + Firestore)
│
├── core/                    # DOMÍNIO PURO (sem React, sem Firebase)
│   ├── index.ts             # Barrel — reexporta models + logic
│   ├── constants.ts         # STATUS_ROUTES, CATEGORIES, PLAN_LIMITS, cortes…
│   ├── models/              # Tipos e regras de tipo
│   │   ├── Competidor.ts    # Competitor, RiderCategory, normalizeCategory()
│   │   ├── Duo.ts           # Duo, canPair(), computeDuoGroup()…
│   │   ├── PassResult.ts    # PassResult, DuoScore, normalizeSAT()
│   │   ├── CompetitionStatus.ts
│   │   └── CompetitorProfile.ts
│   └── logic/               # REGRAS DE NEGÓCIO (funções puras + testes)
│       ├── pairing.ts       # Sorteio de duplas (round-robin / Havel–Hakimi)
│       ├── scoring.ts       # Melhor placar por dupla + ordenação
│       └── finals.ts        # Seleção de finalistas, agregação, "tempo a bater"
│
├── services/                # INFRAESTRUTURA — acesso a dados
│   ├── competitorLinking.ts # Auto-vínculo competidor ⇄ perfil (best-effort)
│   └── firebase/            # Único ponto que fala com o Firestore
│       ├── competitions.ts      # CRUD de competições
│       ├── auth.ts              # signUp/signIn/Google/signOut
│       ├── athletes.ts         # Base pessoal de atletas (users/{uid}/athletes)
│       ├── competitorProfiles.ts # Perfis públicos de competidor + claim
│       ├── competitorLinks.ts   # Vínculos perfil ⇄ (competição, competidor)
│       ├── competitorHistory.ts # Monta histórico agregado de um perfil
│       └── firestoreHelpers.ts  # timestampToISO()
│
├── context/                 # ESTADO DE APLICAÇÃO (React Context)
│   ├── AuthContext.tsx      # Usuário logado, papel (basic/pro), profileId
│   ├── CompetitionContext.tsx # Competição ativa + persistência com debounce
│   └── ResultContext.tsx    # Resultados (quali/final) + seletores memoizados
│
├── hooks/
│   ├── useDebouncedFirestoreSave.ts # Acumula patches e grava após 1,5 s
│   └── useSubscription.ts          # Deriva limites do plano (basic/pro)
│
├── components/
│   ├── layout/              # CompetitionLayout, PrivateRoute, ResultSyncBridge
│   └── ui/                  # Design system (Button, Card, Modal, Toast, Badge…)
│
├── screens/                 # TELAS (rotas)
│   ├── Login, Register, Dashboard
│   ├── Registration/        # Inscrições (form + lista + importadores)
│   ├── Duos/                # Duplas sorteadas + import Excel/PDF
│   ├── Qualifiers/          # Registro das qualificatórias
│   ├── Final/               # Registro das finais (1D/2D)
│   ├── FinalResults/        # Classificação final
│   ├── RoundsOverview/      # Visão geral das passadas
│   ├── Announcer/           # Painel do locutor (próxima dupla, tempo a bater)
│   ├── CompetitorHistory/   # Histórico de um competidor dentro da prova
│   └── competitor/          # PORTAL DO COMPETIDOR
│       ├── Landing, Search, PublicProfile   (público)
│       └── portal/          (autenticado: Dashboard, MyPasses, ClaimProfile…)
│
└── utils/                   # Utilidades puras (I/O de arquivos, formatação)
    ├── exportExcel.ts / exportPng.ts
    ├── importExcel.ts / importPdf.ts
    ├── formatTime.ts / getDuoKey.ts / nameNormalization.ts
```

### Aliases de import

Imports absolutos são resolvidos por `baseUrl: "src"` no `tsconfig.json`, com os
prefixos `core/`, `context/`, `components/`, `screens/`, `hooks/`, `services/` e
`utils/`. Esse esquema funciona igualmente no **build (webpack)**, no
**TypeScript** e no **Jest**, sem necessidade de configuração extra de alias.

```ts
// ✔ Padrão adotado (alias a partir de src)
import { generateUniqueDuos } from 'core/logic/pairing';
import { useCompetition } from 'context/CompetitionContext';
import { listCompetitions } from 'services/firebase/competitions';

// ✔ Exceção: o módulo local src/firebase.ts continua relativo
//   (um import 'firebase' resolveria para o pacote npm, não para o arquivo).
import { db } from '../../firebase';
```

Imports de irmãos no mesmo diretório (`./CompetitorForm`) continuam relativos —
apenas os que "subiam" diretórios (`../../…`) foram convertidos para alias.

---

## 4. Modelo de dados (Cloud Firestore)

```
competitions/{competitionId}          ← documento "gordo": guarda TUDO da prova
  ownerId, name, location, eventDate
  status: 'draft' | 'qualifier' | 'final' | 'finished'
  numRounds, finalsCutoff
  competitors: Competitor[]            (array embutido)
  duos: Duo[]                          (array embutido)
  qualifierResults: PassResult[]       (array embutido)
  finalResults: PassResult[]           (array embutido)
  createdAt, updatedAt (serverTimestamp)

users/{uid}
  displayName, email
  role: 'basic' | 'pro'                (controla PLAN_LIMITS)
  competitorProfileId?                 (perfil reivindicado pelo usuário)
  athletes/{athleteId}                 (subcoleção: base pessoal de atletas)
    name, category, createdAt

competitorProfiles/{profileId}         ← identidade pública do competidor
  displayName, normalizedName, aliases[]
  status: 'unclaimed' | 'claimed' | 'merged'
  userId?, email?, claimedAt?

competitorLinks/{linkId}               ← liga um perfil a uma inscrição
  profileId, competitionId, competitorId
  matchType: 'auto_exact' | 'auto_fuzzy' | 'organizer' | 'claimed'
  confidence
```

**Decisão de modelagem:** toda a competição vive em **um único documento**
(competidores, duplas e resultados como arrays embutidos). Isso simplifica a
leitura/gravação (uma prova = um `getDoc`/`updateDoc`) e casa com o cache
offline, mas tem o custo descrito na seção de performance (§7).

---

## 5. APIs / chamadas ao Firestore (detalhado)

Todas as chamadas ao Firestore passam por `src/services/firebase/`. Resumo por
arquivo:

### `competitions.ts` — CRUD da prova
| Função | Operação Firestore | Descrição |
| --- | --- | --- |
| `createCompetition(ownerId, name, …)` | `addDoc(competitions)` | Cria prova em `draft`, com arrays vazios. |
| `updateCompetition(id, partial)` | `updateDoc` | Grava um _patch_ + `updatedAt`. Usado pelo save com debounce. |
| `deleteCompetition(id)` | `deleteDoc` | Exclui a prova. |
| `listCompetitions(ownerId)` | `getDocs + where(ownerId)` | Lista do organizador; ordena por `updatedAt` no cliente (evita índice composto). |
| `getCompetition(id)` | `getDoc` | Lê do cache local quando disponível. |
| `getCompetitionFromServer(id)` | `getDocFromServer` | Força leitura do servidor (usada em provas encerradas para não exibir cache velho). |

Utilitários internos: `toCompetition()` (documento → modelo, com
`normalizeCategory`), `normalizeDuoIds()` (migra IDs de dupla com `🤝` → `_`).

### `auth.ts` — autenticação
`signUp`, `signIn`, `signInWithGoogle`, `signOut`, `onAuthChange`. O primeiro
login cria `users/{uid}` com `role: 'basic'`; logins seguintes nunca sobrescrevem
o papel.

### `athletes.ts` — base pessoal de atletas (`users/{uid}/athletes`)
`listAthletes`, `saveAthlete`, `deleteAthlete`, e o helper puro
`importProfilesAsCompetitors()`.

### `competitorProfiles.ts` — perfis públicos
`getCompetitorProfile`, `getProfileByUserId`, `searchProfilesByNormalizedName`
(match exato p/ auto-vínculo), `searchProfilesForUser` (prefixo + fuzzy
client-side p/ busca do usuário), `createCompetitorProfile`, e
`claimCompetitorProfile()` — que roda em **transação** (`runTransaction`) para
evitar corrida ao reivindicar um perfil.

### `competitorLinks.ts` — vínculos
`createCompetitorLink`, `getLinksByProfileId`, `getLinkForCompetitor`.

### `competitorHistory.ts` — agregação de histórico
`getCompetitorHistory(profileId)`: busca os vínculos do perfil e, para cada um,
lê a competição inteira e extrai só as passadas daquele competidor
(N+1 leituras — ver §7).

### `competitorLinking.ts` (fora de `firebase/`) — orquestração
`tryAutoLinkCompetitor(competitor, competitionId)`: cria/reusa um perfil e o
vincula à inscrição. É **best-effort** — nunca lança, para não travar o fluxo do
organizador.

---

## 6. Fluxo das duas pontas

### 6.1 Ponta do organizador

A prova é uma **máquina de estados**: `draft → qualifier → final → finished`.
`STATUS_ROUTES` (core/constants) mapeia cada status para a rota inicial.

```
Login  ──►  Dashboard (lista/cria provas)
              │  createCompetition()  →  status: draft
              ▼
CompetitionLayout  ── carrega a prova (getCompetition / getCompetitionFromServer)
  │  hidrata CompetitionContext (loadCompetition) e ResultContext
  │  (initializeFromCompetition). Um <ResultSyncBridge/> observa mudanças
  │  em resultados e as persiste (debounce).
  │
  ├─ 1. Inscrições (Registration)
  │     CompetitorForm/List, importadores (Excel/base de atletas).
  │     setCompetitors() → salva no doc (debounce). Auto-vínculo em background.
  │
  ├─ 2. Duplas (Duos)  ── "Sortear Duplas"
  │     generateUniqueDuos(competitors)  [core/logic/pairing]
  │       • round-robin quando N é par e todos compatíveis
  │       • Havel–Hakimi caso contrário / N ímpar (1 passada extra sorteada)
  │       • nunca repete par; nunca forma Aberta+Aberta
  │     setDuos() + setDuosMeta().  advanceStatus('qualifier') implícito ao seguir.
  │
  ├─ 3. Qualificatória (Qualifiers)
  │     Para cada dupla pendente: registra bois + tempo (ou SAT).
  │     addQualifierResult() → ResultContext → ResultSyncBridge grava.
  │     Ranking parcial: buildBestQualifierScorePerDuo → compareByScore.
  │     "Ir para a Final" → advanceStatus('final').
  │
  ├─ 4. Final (Final)  ── abas 2D (primeiro) e 1D
  │     Finalistas: selectFinalists(bestScores, finalsCutoff) [core/logic/finals]
  │       • 1D = top X geral; 2D = top X das duplas 2D que NÃO subiram à 1D.
  │     Ordem de largada = pior colocado primeiro (lista revertida).
  │     "Tempo a bater": computeTimeToBeat(quali, líder do bracket).
  │     addFinalResult(duoId, bracket, …).
  │
  ├─ 5. Resultados Finais (FinalResults)
  │     aggregateFinals(bestScores, finalResults): total = quali + final,
  │     ordenado por mais bois e menor tempo, separado por bracket.
  │     "Finalizar" → advanceStatus('finished') (resultados tornam-se imutáveis).
  │
  └─ 6. Locutor (Announcer)  ── painel ao vivo: próxima/seguinte dupla, tempo a bater.
```

**Persistência:** as edições não gravam a cada tecla. `useDebouncedFirestoreSave`
acumula _patches_ e chama `updateCompetition` após ~1,5 s de inatividade;
`advanceStatus`/`Finalizar` fazem `flushNow` para gravar imediatamente antes de
mudar o status.

### 6.2 Ponta do competidor (Portal)

```
/competitor (Landing)  ──►  /competitor/search  ──►  /competitor/profile/:id
   público                    busca por nome            perfil público + histórico
                              (searchProfilesForUser)   (getCompetitorHistory)

Login ──► /portal (PortalDashboard, protegido por PrivateRoute)
   │  carrega o perfil (competitorProfileId do users/{uid}) e o histórico.
   │
   ├─ sem perfil vinculado ─► /portal/claim (ClaimProfile)
   │     busca um perfil e o reivindica: claimCompetitorProfile() (transação)
   │     grava users/{uid}.competitorProfileId.
   │
   ├─ /portal (index) ─► MyCompetitionsPage  (competições em que participou)
   ├─ /portal/passes  ─► MyPassesPage        (todas as passadas)
   └─ /portal/results/:competitionId ─► CompetitionResults
```

O elo entre as pontas são os **`competitorLinks`**: quando o organizador cadastra
um competidor, `tryAutoLinkCompetitor` cria/associa um `competitorProfile`; o
competidor, ao reivindicar esse perfil no portal, passa a enxergar todo o
histórico agregado por `getCompetitorHistory`.

---

## 7. Notas de performance

**Implementado nesta auditoria:**

- **Code-splitting por rota** (`React.lazy` + `Suspense` em `App.tsx`): o bundle
  inicial caiu de **479 kB → 205 kB gzip (−57%)**. As bibliotecas pesadas
  `xlsx` (~138 kB) e `pdfjs-dist` (~104 kB) agora vão em _chunks_ separados,
  carregados só ao abrir as telas de Duplas/Inscrições que as usam.
- **Memoização dos Contexts:** os objetos `value` de `CompetitionContext`,
  `ResultContext` e `Toast` passaram a usar `useMemo`, e os callbacks do
  `ResultContext` viraram `useCallback`. Isso evita re-renderizar todos os
  consumidores a cada render do Provider.

**Recomendações futuras (não aplicadas para não mudar o schema/deps):**

- `competitorHistory.getCompetitorHistory` faz **N+1 leituras** e baixa a
  competição inteira por vínculo. Para competidores com muito histórico, valeria
  desnormalizar as passadas do competidor numa coleção própria.
- O documento único por competição cresce sem limite (Firestore tem teto de
  1 MB/doc). Provas muito grandes podem exigir mover `qualifierResults`/
  `finalResults` para uma subcoleção.
- `jspdf` e `jspdf-autotable` estão em `dependencies` mas **não são importados**
  em nenhum lugar — podem ser removidos.

---

## 8. Testes

- **Domínio (`core/`)**: cobertura unitária de `pairing`, `scoring`, `finals`,
  `Duo`, `Competidor` (normalização de categoria) e `PassResult`. Os testes de
  `pairing` guardam explicitamente contra o bug de **duplas duplicadas**
  (unicidade de pares + contagem de passadas por competidor).
- **Utils**: `nameNormalization`, `formatTime`.
- **Tela**: `Qualifiers` é renderizada dentro da árvore real de Providers
  (teste de fumaça honesto).
- **Setup**: `src/setupTests.js` injeta variáveis `REACT_APP_FIREBASE_*` de
  teste para que `firebase.ts` inicialize sem lançar `auth/invalid-api-key`.

```bash
npm test            # roda a suíte
npm start           # dev server
npm run build       # build de produção (com code-splitting)
```

> Nota sobre falsos positivos: o teste antigo de `Qualifiers` passava `props`
> que a tela ignorava e afirmava um texto inexistente — validava nada. Foi
> reescrito para exercer a tela real. O `App.test.js` padrão do CRA (procurava
> "learn react") foi removido.
