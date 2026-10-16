import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { loginUser, registerUser, getSession } from "./userDB";
import { avisar } from "./avisar";
import { LIMITES, validarNome, validarEmail, validarSenha } from "./seguranca";
import Logo from "./Logo";
import Creditos from "./Creditos";
import { cores } from "./theme";

/*
 * LoginCadastro.js
 *
 * Tela de login e cadastro. Os usuários ficam guardados no aparelho
 * (ou no navegador) pelo arquivo userDB.js.
 *
 * - Mensagens de erro usam `avisar` (avisar.js), que funciona no celular
 *   E no navegador.
 * - Avisos de sucesso só aparecem no celular: na web a própria troca de
 *   tela já mostra que deu certo.
 * - Cores: arquivo theme.js.
 */

// A conferência da senha é um cálculo pesado que "congela" a tela por um
// instante. Esta pausa curtinha deixa o texto "Verificando…" aparecer antes.
function deixarTelaAtualizar() {
  return new Promise((resolver) => setTimeout(resolver, 40));
}

// Aviso de sucesso: só no celular (veja o comentário no topo do arquivo).
function avisoSucesso(titulo, mensagem) {
  if (Platform.OS !== "web") avisar(titulo, mensagem);
}

export default function LoginCadastro({ onLogin, onRegisterSuccess }) {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ocupado, setOcupado] = useState(false); // true enquanto confere a senha

  useEffect(() => {
    async function verificarSessao() {
      const session = await getSession();
      if (session && onLogin) {
        onLogin();
      }
    }

    verificarSessao();
  }, [onLogin]);

  const handleLogin = async () => {
    if (ocupado) return; // evita toques repetidos enquanto confere a senha
    if (!email.trim() || !password) {
      avisar("Preencha email e senha", "Informe seu email e sua senha para entrar.");
      return;
    }

    setOcupado(true);
    try {
      await deixarTelaAtualizar();
      const resposta = await loginUser(email, password);

      if (resposta.ok) {
        avisoSucesso("Login bem-sucedido!");
        onLogin();
        return;
      }

      if (resposta.motivo === "bloqueado") {
        const minutos = Math.ceil(resposta.segundos / 60);
        avisar(
          "Muitas tentativas",
          `Por segurança, o acesso foi bloqueado por alguns minutos. Tente de novo em cerca de ${minutos} min.`
        );
        return;
      }

      // Mesma mensagem para "email não existe" e "senha errada".
      avisar("Credenciais inválidas", "Verifique seu email e senha.");
    } catch (erro) {
      avisar("Erro ao entrar", "Tente novamente.");
    } finally {
      setOcupado(false);
    }
  };

  const handleRegister = async () => {
    if (ocupado) return;
    if (!nome.trim() || !email.trim() || !password) {
      avisar("Preencha todos os campos", "Informe nome, email e senha.");
      return;
    }

    // Regras de nome, email e senha estão em seguranca.js.
    const problema = validarNome(nome) || validarEmail(email) || validarSenha(password);
    if (problema) {
      avisar("Confira os dados", problema);
      return;
    }

    if (password !== confirmPassword) {
      avisar("Senhas diferentes", "As senhas precisam ser iguais.");
      return;
    }

    setOcupado(true);
    try {
      await deixarTelaAtualizar();
      await registerUser({ nome, email, password });
      avisoSucesso("Cadastro realizado!", `Bem-vindo(a), ${nome.trim()}!`);
      if (onRegisterSuccess) {
        onRegisterSuccess();
        return;
      }

      setModo("login");
      setNome("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (erro) {
      if (erro.message === "EMAIL_JA_EXISTE") {
        avisar("Email já cadastrado", "Use outro email ou faça login.");
      } else {
        avisar("Erro ao cadastrar", "Tente novamente mais tarde.");
      }
    } finally {
      setOcupado(false);
    }
  };

  return (
    <ScrollView
      style={styles.rolagem}
      contentContainerStyle={styles.rolagemConteudo}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.decorLeft} />
      <View style={styles.decorRight} />

      <View style={styles.topBar}>
        <Logo largura={150} />
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>Nativ Ivrit</Text>

        {modo === "login" ? (
          <>
            <Text style={styles.title}>Conecte-se</Text>
            <Text style={styles.subtitle}>Caso tenha login ou cadastre-se</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={cores.cinza}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={LIMITES.emailMax}
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={cores.cinza}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={LIMITES.senhaMax}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={ocupado} accessibilityRole="button" accessibilityLabel="Entrar">
              <Text style={styles.buttonText}>{ocupado ? "Verificando…" : "Entrar"}</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Não tem conta?</Text>
              <TouchableOpacity onPress={() => setModo("register")}>
                <Text style={styles.linkText}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Cadastre-se</Text>
            <Text style={styles.subtitle}>
              Crie sua conta. A senha precisa ter {LIMITES.senhaMin} ou mais caracteres, com letras e números.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              maxLength={LIMITES.nomeMax}
              autoComplete="name"
              placeholderTextColor={cores.cinza}
              value={nome}
              onChangeText={setNome}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={cores.cinza}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={LIMITES.emailMax}
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={cores.cinza}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={LIMITES.senhaMax}
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor={cores.cinza}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={LIMITES.senhaMax}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={ocupado} accessibilityRole="button" accessibilityLabel="Criar conta">
              <Text style={styles.buttonText}>{ocupado ? "Criando…" : "Criar conta"}</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Já tem conta?</Text>
              <TouchableOpacity onPress={() => setModo("login")}>
                <Text style={styles.linkText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Creditos />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rolagem: { flex: 1, backgroundColor: cores.fundoTela },
  rolagemConteudo: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "relative",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: cores.fundoTela,
    padding: 20,
    position: "relative",
  },
  decorLeft: {
    position: "absolute",
    left: -80,
    top: 60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: cores.fundoSuave,
  },
  decorRight: {
    position: "absolute",
    right: -50,
    bottom: 80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: cores.destaqueSuave,
  },
  topBar: {
    alignItems: "center",
    marginBottom: 14,
    zIndex: 1,
  },  
  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: cores.branco,
    borderRadius: 30,
    padding: 26,
    shadowColor: cores.azulEscuro,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 10,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: cores.azulEscuro,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: cores.texto,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: cores.textoSuave,
    marginBottom: 22,
    lineHeight: 22,
  },
  input: {
    width: "100%",
    height: 56,
    backgroundColor: cores.fundoSuave,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    fontSize: 16,
    color: cores.texto,
  },
  button: {
    width: "100%",
    height: 56,
    backgroundColor: cores.azulEscuro,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 18,
    shadowColor: cores.azulEscuro,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    color: cores.textoSuave,
    fontSize: 15,
  },
  linkText: {
    color: cores.azulEscuro,
    fontSize: 15,
    fontWeight: "700",
  },
});
