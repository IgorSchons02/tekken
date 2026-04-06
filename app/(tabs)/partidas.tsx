import { Link, useFocusEffect } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import StatusBadge from "../../components/StatusBadge";

export default function PartidasTab() {
  const [partidas, setPartidas] = useState([]);

  async function fetchPartidas() {
    const response = await fetch(
      //"https://tournament-api.free.beeceptor.com/partidas",
      "http://localhost:3000/matches",
    );
    const data = await response.json();

    const ordemFases = {
      Final: 1,
      "Disputa de 3º Lugar": 2,
      Semifinal: 3,
      "Quartas de Final": 4,
      "Oitavas de Final": 5,
      Repescagem: 6,
    };

    const dadosOrdenados = data.sort((a, b) => {
      const pesoFaseA = ordemFases[a.fase] || 99;
      const pesoFaseB = ordemFases[b.fase] || 99;

      if (pesoFaseA !== pesoFaseB) {
        return pesoFaseA - pesoFaseB;
      }

      const ordemStatus = { em_andamento: 1, aguardando: 2, finalizado: 3 };
      return (ordemStatus[a.status] || 9) - (ordemStatus[b.status] || 9);
    });

    setPartidas(dadosOrdenados);
  }

  useFocusEffect(() => {
    fetchPartidas();
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={partidas}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/partida",
              params: {
                ...item,
                jogador1: JSON.stringify(item.jogador1),
                jogador2: JSON.stringify(item.jogador2),
              },
            }}
          >
            <PartidaItem {...item} />
          </Link>
        )}
      />
    </View>
  );
}

function PartidaItem({ fase, jogador1, jogador2, status, vencedor }) {
  return (
    <View style={styles.partidaItem}>
      <View style={styles.headerRow}>
        <Text style={styles.faseText}>{fase}</Text>
        <StatusBadge status={status} />
      </View>

      <View style={styles.VersusContainer}>
        <Text style={styles.nickname}>{jogador1.nickname}</Text>
        <Text style={styles.vsText}>VS</Text>
        <Text style={styles.nickname}>{jogador2.nickname}</Text>
      </View>
      <View style={styles.VencedorContainer}>
        <Text style={styles.vencedorText}>Vencedor: {vencedor}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingVertical: 8,
  },
  partidaItem: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  faseText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  vencedorText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#28a745",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  VersusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
  },
  VencedorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  nickname: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },
  vsText: {
    fontWeight: "bold",
    color: "#888",
    fontSize: 14,
  },
});
