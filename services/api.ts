const BASE_URL = "https://tekken-torneios.vercel.app";

// ─── Types ───────────────────────────────────────────────

export interface Personagem {
  id: number;
  nome: string;
}

export interface Participante {
  id: number;
  nome: string;
}

export interface Torneio {
  id: number;
  titulo: string;
  data_inicio: string;
  data_final: string;
  premio: number;
}

export interface NovoTorneio {
  titulo: string;
  data_inicio: string;
  data_final: string;
  premio: number;
}

export interface BracketParticipante {
  id: number;
  personagem_id: number;
}

export interface Jogador {
  id: number;
  nickname: string;
  personagem: string;
}

export interface Partida {
  id: number;
  fase: string;
  jogador1: Jogador;
  jogador2: Jogador;
  vencedor: string | null;
  status: "pendente" | "aguardando" | "em_andamento" | "finalizado" | "concluido";
}

export interface RankingEntry {
  jogador: Jogador;
  vitorias: number;
  derrotas: number;
  partidas: number;
  winRate: number;
}

export interface TournamentStats {
  totalPartidas: number;
  partidasFinalizadas: number;
  partidasEmAndamento: number;
  partidasPendentes: number;
  totalJogadores: number;
}

// ─── Health Check ───────────────────────────────────────

export async function healthCheck(): Promise<{ hello: string }> {
  const response = await fetch(`${BASE_URL}/`);
  if (!response.ok) throw new Error("API fora do ar");
  return response.json();
}

// ─── Personagens ─────────────────────────────────────────

export async function fetchPersonagens(): Promise<Personagem[]> {
  const response = await fetch(`${BASE_URL}/personagens`);
  if (!response.ok) throw new Error("Erro ao buscar personagens");
  return response.json();
}

export async function criarPersonagensMultiplos(
  nomes: string[]
): Promise<Personagem[]> {
  const response = await fetch(`${BASE_URL}/personagens-multiplos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nomes.map((nome) => ({ nome }))),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Erro ao criar personagens");
  }
  return response.json();
}

export async function fetchPersonagensTorneio(
  torneioId: number
): Promise<Personagem[]> {
  const response = await fetch(
    `${BASE_URL}/torneios/${torneioId}/personagens`
  );
  if (!response.ok) throw new Error("Erro ao buscar personagens do torneio");
  return response.json();
}

// ─── Participantes ───────────────────────────────────────

export async function criarParticipante(nome: string): Promise<Participante> {
  const response = await fetch(`${BASE_URL}/participantes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
  if (!response.ok) throw new Error("Erro ao criar participante");
  return response.json();
}

export async function fetchParticipantesTorneio(
  torneioId: number
): Promise<Participante[]> {
  const response = await fetch(
    `${BASE_URL}/torneios/${torneioId}/participantes`
  );
  if (!response.ok)
    throw new Error("Erro ao buscar participantes do torneio");
  return response.json();
}

// ─── Torneios ────────────────────────────────────────────

export async function fetchTorneios(): Promise<Torneio[]> {
  const response = await fetch(`${BASE_URL}/torneios`);
  if (!response.ok) throw new Error("Erro ao buscar torneios");
  return response.json();
}

export async function criarTorneio(torneio: NovoTorneio): Promise<Torneio> {
  const response = await fetch(`${BASE_URL}/torneios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(torneio),
  });
  if (!response.ok) throw new Error("Erro ao criar torneio");
  return response.json();
}

// ─── Bracket ─────────────────────────────────────────────

export async function gerarBracket(
  torneioId: number,
  participantes: BracketParticipante[]
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/torneios/${torneioId}/gerar-bracket`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantes }),
    }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Erro ao gerar bracket");
  }
}

// ─── Partidas por Torneio ───────────────────────────────

export async function fetchPartidas(torneioId: number): Promise<Partida[]> {
  const response = await fetch(
    `${BASE_URL}/torneios/${torneioId}/partidas`
  );
  if (!response.ok) throw new Error("Erro ao buscar partidas");
  return response.json();
}

// ─── Atualizar Vencedor ──────────────────────────────────

export async function atualizarVencedor(
  roundId: number,
  vencedorId: number
): Promise<void> {
  const response = await fetch(`${BASE_URL}/rounds/${roundId}/vencedor`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vencedor_id: vencedorId }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Erro ao atualizar vencedor");
  }
}

// ─── Computed helpers ────────────────────────────────────

export function computeRanking(partidas: Partida[]): RankingEntry[] {
  const jogadorMap = new Map<string, RankingEntry>();

  for (const partida of partidas) {
    for (const jogador of [partida.jogador1, partida.jogador2]) {
      if (!jogadorMap.has(jogador.nickname)) {
        jogadorMap.set(jogador.nickname, {
          jogador,
          vitorias: 0,
          derrotas: 0,
          partidas: 0,
          winRate: 0,
        });
      }
    }

    if (partida.vencedor) {
      const j1 = jogadorMap.get(partida.jogador1.nickname)!;
      const j2 = jogadorMap.get(partida.jogador2.nickname)!;

      j1.partidas++;
      j2.partidas++;

      if (partida.vencedor === partida.jogador1.nickname) {
        j1.vitorias++;
        j2.derrotas++;
      } else {
        j2.vitorias++;
        j1.derrotas++;
      }
    }
  }

  const entries = Array.from(jogadorMap.values());
  for (const entry of entries) {
    entry.winRate =
      entry.partidas > 0 ? (entry.vitorias / entry.partidas) * 100 : 0;
  }

  return entries.sort((a, b) => {
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    return a.derrotas - b.derrotas;
  });
}

export function computeStats(partidas: Partida[]): TournamentStats {
  const jogadores = new Set<string>();
  for (const p of partidas) {
    jogadores.add(p.jogador1.nickname);
    jogadores.add(p.jogador2.nickname);
  }

  return {
    totalPartidas: partidas.length,
    partidasFinalizadas: partidas.filter((p) => p.vencedor !== null).length,
    partidasEmAndamento: partidas.filter((p) => p.status === "em_andamento")
      .length,
    partidasPendentes: partidas.filter(
      (p) => p.status === "pendente" || p.status === "aguardando"
    ).length,
    totalJogadores: jogadores.size,
  };
}

export function sortPartidas(partidas: Partida[]): Partida[] {
  const ordemFases: Record<string, number> = {
    Final: 1,
    "Disputa de 3º Lugar": 2,
    Semifinal: 3,
    "Quartas de Final": 4,
    "Oitavas de Final": 5,
    Repescagem: 6,
  };

  return [...partidas].sort((a, b) => {
    const pesoA = ordemFases[a.fase] || 99;
    const pesoB = ordemFases[b.fase] || 99;
    if (pesoA !== pesoB) return pesoA - pesoB;

    const ordemStatus: Record<string, number> = {
      em_andamento: 1,
      pendente: 2,
      aguardando: 2,
      finalizado: 3,
      concluido: 3,
    };
    return (ordemStatus[a.status] || 9) - (ordemStatus[b.status] || 9);
  });
}
