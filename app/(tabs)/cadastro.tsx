import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CadastroJogador() {
  const [nome, setNome] = useState("");
  const [nickname, setNickname] = useState("");
  const [personagem, setPersonagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const router = useRouter();

  const salvarJogador = async () => {
    if (!nome || !nickname || !personagem) {
      Alert.alert("Erro", "Preencha todos os campos para entrar no torneio!");
      return;
    }

    setCarregando(true);

    const novoJogador = {
      nome: nome,
      nickname: nickname,
      personagem: personagem,
      data_inscricao: new Date().toISOString(),
    };

    try {
      const response = await fetch("http://localhost:3000/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novoJogador),
      });

      if (response.ok) {
        Alert.alert("Sucesso!", `${nickname} foi inscrito com sucesso.`);
        router.back(); // volta para a tela de partidas
      } else {
        Alert.alert("Erro", "não foi possível salvar.");
      }
    } catch (error) {
      Alert.alert(
        "Erro de Conexão",
        "Verifique se o JSON Server está rodando no seu PC.",
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>NOVO COMPETIDOR</Text>

        <View style={styles.inputArea}>
          <Text style={styles.label}>NOME REAL</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Pedro Silva"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>NICKNAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Pedrinho911"
            autoCapitalize="none"
            value={nickname}
            onChangeText={setNickname}
          />

          <Text style={styles.label}>PERSONAGEM</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Kazuya, Reina, Hwoarang..."
            value={personagem}
            onChangeText={setPersonagem}
          />

          <TouchableOpacity
            style={[styles.botao, carregando && { opacity: 0.5 }]}
            onPress={salvarJogador}
            disabled={carregando}
          >
            <Text style={styles.botaoTexto}>
              {carregando ? "SALVANDO..." : "CONFIRMAR INSCRIÇÃO"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  inputArea: {
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  botao: {
    backgroundColor: "#007bff",
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
