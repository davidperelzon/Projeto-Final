# Matriz de rastreabilidade — EAP × aplicativo

Fonte: imagem da EAP "Nativ Ivrit" (8 grupos). Classificação baseada na leitura do código.
**Nada foi executado em celular real**; o que depende de execução está marcado como *Não verificável*.

Legenda: ✅ Implementado · 🟡 Parcial · 🟠 Com problemas · ❌ Não implementado · ❔ Não verificável

## Back-end
| Requisito | Implementação atual | Problema identificado | Ação | Validação |
|---|---|---|---|---|
| Banco de dados | 🟡 `userDB.js` (contas, XP e itens feitos no armazenamento local) | Dados só no aparelho; sem servidor; quem acessa o aparelho/navegador pode alterá-los | Mantido. Servidor é decisão de arquitetura (fora do escopo desta entrega) | Leitura do código |
| API de autenticação | 🟡 `LoginCadastro.js` + `seguranca.js` (autenticação local, senha com hash) | Não existe API remota | Mantido | Leitura do código |
| Sistema de progresso | ✅ XP + `feitos` + níveis (`niveis.js`) | Havia só barra de XP, sem visão de caminho | **Novo** `progressao.js` (fonte única) + mapa da trilha | Testes da lógica (ver abaixo) |
| Armazenamento do sistema | ✅ AsyncStorage | — | — | Leitura do código |
| Integração do áudio | 🟠 `audioService.js` + `BotaoAudio.js` (voz do aparelho, he-IL) | Falhava sem voz hebraica; iPhone em silencioso não toca; botão podia ficar preso | Serviço reescrito (rodadas anteriores) | Lógica testada com motor simulado; **som real não verificado** |

## Front-end
| Requisito | Implementação atual | Problema identificado | Ação | Validação |
|---|---|---|---|---|
| Tela de login | ✅ `LoginCadastro.js` | Tela não rolava (corte em celulares pequenos) | Agora rola; créditos dos criadores abaixo do card | Sintaxe; **visual não verificado** |
| Tela inicial | 🟡→✅ `App.js` (Home) | Faltava "o que fazer agora" | Cartão **Continuar estudando** (próxima etapa + progresso) | Lógica testada; visual não verificado |
| Tela de exercícios | 🟡 Missões de escrita (`Missoes.js`) + lições | Só um tipo de exercício (escrita); feedback "✓ Correto!/Ainda não" já existia | Mantido; tela de parabéns ao concluir lição | Leitura do código |
| Gamificação | 🟡 XP, níveis, etapas | Sem sequência de dias, meta diária, ranking ou conquistas | Trilha com estados e recompensas reais | — |
| Sistema de XP | ✅ `ganharXp` (1 vez por item) | — | Reaproveitado pela trilha | Leitura do código |

## Planejamento / Design / Requisitos / Testes / Atualizações
| Requisito | Estado | Observação |
|---|---|---|
| Escopo, público-alvo, cronograma | ❔ | Artefatos de gestão, fora do código |
| Identidade visual | ✅ | `theme.js` (paleta do PDF) + logo oficial `assets/logo-hd.png` |
| Wireframes / prototipagem | ❔ | Imagens de referência recebidas; não são código |
| Design UI/UX | 🟡 | Trilha, cartão Continuar e tela de parabéns no estilo das referências; demais telas ainda no estilo antigo |
| Requisitos funcionais / não funcionais | ❔ | Documento não encontrado no projeto |
| Testes unitários / integração | ❌ | Não há suíte de testes no repositório |
| Testes de usabilidade / beta | ❌ | Dependem de usuários reais |
| Correção de bugs / novos níveis / conteúdo | ✅ | Estrutura permite: tudo em `niveis.js` |

## Conteúdo
| Requisito | Estado | Observação |
|---|---|---|
| Definição dos níveis | ✅ | 4 níveis (Iniciante→Avançado), 13 lições, 22 letras, 39 missões |
| Obtenção e revisão da linguagem | ❔ | Revisão por falante de hebraico não comprovada |
| **Gravação dos áudios** | ❌ | A EAP prevê gravações; o app usa voz sintética do aparelho. O pacote anterior "com arquivos" aceita mp3 por texto |
| Criação dos exercícios | 🟡 | Só escrita; múltipla escolha/associação (vistas nas referências) não existem |

## Itens das referências visuais que NÃO existem no app
Onboarding, ranking semanal, conquistas, perfil com estatísticas, meta diária, sequência de dias, barra de navegação inferior, exercício de múltipla escolha. Nenhum foi inventado: dependem de decisão de produto e de dados que o app ainda não registra.
