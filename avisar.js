/*
 * avisar.js
 *
 * Mostra uma mensagem simples para o usuário (título + texto).
 *
 * POR QUE EXISTE: no celular, `Alert.alert` abre uma janelinha. No
 * NAVEGADOR (react-native-web) o `Alert.alert` NÃO FAZ NADA -- por isso
 * erros como "senha inválida" ficavam invisíveis na web e parecia que o
 * botão não funcionava. Esta função usa `window.alert` na web e
 * `Alert.alert` no celular.
 *
 * Uso: avisar("Título", "Texto da mensagem");
 */
import { Alert, Platform } from "react-native";

export function avisar(titulo, mensagem) {
  if (Platform.OS === "web") {
    // Na web juntamos título e texto em uma única caixa de aviso.
    const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(texto);
    }
    return;
  }

  Alert.alert(titulo, mensagem);
}
