import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { Text, View } from "react-native";
import StatusBadge from "../components/StatusBadge";

export default function PartidasScreen() {
  const { fase, vencedor, status, jogador1, jogador2 } = useLocalSearchParams();

  const p1 = jogador1 ? JSON.parse(jogador1) : null;
  const p2 = jogador2 ? JSON.parse(jogador2) : null;
  console.log("Parâmetros recebidos:", { vencedor });
  return (
    <>
      <Stack.Screen options={{ title: `Detalhes` }} />
      <View style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
        {/* Cabeçalho com Fase e Status */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flex: 1,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>{fase}</Text>
          <StatusBadge status={status} />
        </View>

        {/* Área do Confronto */}
        <View
          style={{
            marginVertical: 30,
            alignItems: "center",
            backgroundColor: "#f9f9f9",
            padding: 20,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: vencedor === p1?.nickname ? "green" : "#333",
            }}
          >
            {p1?.nickname}
          </Text>
          <Text style={{ fontSize: 16, color: "#666" }}>{p1?.personagem}</Text>

          <Text
            style={{
              fontSize: 24,
              marginVertical: 15,
              color: "red",
              fontWeight: "bold",
            }}
          >
            VS
          </Text>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: vencedor === p2?.nickname ? "green" : "#333",
            }}
          >
            {p2?.nickname}
          </Text>
          <Text style={{ fontSize: 16, color: "#666" }}>{p2?.personagem}</Text>
        </View>

        {/* Área do Vencedor */}
        <View
          style={{
            borderTopWidth: 1,
            borderColor: "#eee",
            paddingTop: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: "#666" }}>Vencedor:</Text>
          {vencedor ? (
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "green",
                marginTop: 5,
              }}
            >
              🏆 {vencedor}
            </Text>
          ) : (
            <Text
              style={{
                fontSize: 20,
                color: "#999",
                fontStyle: "italic",
                marginTop: 10,
              }}
            >
              Aguardando resultado...
            </Text>
          )}
        </View>
      </View>
    </>
  );
}
