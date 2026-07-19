<p align="center">
  <img src="docs/assets/fp-banner.svg" alt="FP transforma tarefas ambíguas, agentes paralelos e exemplos limitados em progresso verificável" width="100%">
</p>

# FP

**O patch não é a linha de chegada. A prova é.**

[![Validate](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg)](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/MiaoY0uShan/FP)](https://github.com/MiaoY0uShan/FP/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)

A maioria dos agentes de codificação corre do prompt ao patch. O FP faz com que o seu encontre a tarefa real, limite cada delegação e termine com evidência que um agente pai possa verificar de forma independente.

Ele também pode aprender com execuções anteriores. Só não transformando um caso isolado de sorte em lei permanente.

O FP infere a ativação a partir do objetivo: ele carrega automaticamente para trabalho de engenharia e permanece inativo para conversas casuais ou outros objetivos não relacionados à engenharia. `FP:` e `$fp` permanecem como invocações explícitas opcionais.

Sem daemon. Sem banco de dados. Sem servidor MCP obrigatório. Instale, recarregue seu agente e trabalhe normalmente.

---

## Você conhece esta situação

Quatro agentes tocam os mesmos arquivos. Um reinicia o serviço. Outro relata uma build verde. Ninguém testa novamente o telefone que ainda não consegue conectar.

O FP dá ao trabalho um limite, um responsável e uma linha de chegada observável.

```text
Sem FP

editar configuração -> reiniciar serviço -> status verde -> "pronto"

Com FP

reproduzir o cliente real
-> comparar estado desejado / gerado / efetivo
-> encontrar a primeira fronteira com falha
-> fazer a menor alteração autorizada
-> reexecutar cliente real + controle negativo + ciclo de vida
-> registrar evidência
```

O segundo caminho é mais lento que adivinhar por cerca de cinco minutos. É consideravelmente mais rápido que depurar o chute por dois dias.

## Como funciona

```text
solicitação
-> rotear pelo risco real
-> congelar escopo, autoridade e aceitação
-> executar ou delegar trabalho limitado
-> executar verificações observáveis
-> validar o Livro de Evidências
-> opcionalmente avaliar um candidato de aprendizado reutilizável
```

Trabalho pequeno permanece pequeno. Incidentes restauram o serviço antes de polir. Causas desconhecidas acionam diagnóstico antes de patches. Auditorias em múltiplos dispositivos coletam evidência de linha de base antes de qualquer mutação. Fatos externos atuais carregam versão, origem, base de atualidade e limite de confiança.

Antes de adicionar código, o FP também percorre uma pequena escada de reutilização:

```text
1. Isso precisa existir?               não -> pular (YAGNI)
2. Já está na base de código?         sim -> reutilizar
3. A biblioteca padrão faz isso?      sim -> usar
4. Recurso nativo da plataforma?      sim -> usar
5. Dependência instalada?             sim -> usar
6. Uma linha clara é suficiente?     sim -> escrever uma linha
7. Só então                           -> adicionar o mínimo de código novo que funcione
```

Segurança, rollback, acessibilidade, integridade de dados e evidência obrigatória não são "complexidade" a ser removida.

## Distribuído, não caótico

```text
pai / integrador
|-- investigação limitada A        somente leitura
|-- investigação limitada B        somente leitura
|-- aprendiz candidato             somente leitura, apenas proposta
|-- avaliador cego                 conjunto de validação oculto + oráculo
|-- revisor de especificação       tarefa e sessão independentes
+-- revisor de integração          tarefa e sessão independentes
             -> evidência limitada + vereditos

um escritor -> pai reexecuta verificações críticas -> livro canônico
```

Cada tarefa filha lógica recebe um envelope local de tarefa: IDs da tarefa/sessão/pai, objetivo, referências de contexto, papel, ferramentas, tetos de autoridade raiz e do pai direto, dependências, arquivos/recursos, limites de iteração/tentativa/tempo/profundidade, chave de idempotência, orçamento de saída, caminho de artefato exclusivo do pai e condição de parada.

O contrato de máquina deriva em vez de confiar:

- validade do DAG de dependências do pai, tempo de dependência bem-sucedido;
- resultados estáveis de ordem de entrada, concorrência observada, tentativas, timeout e cancelamento de ancestral;
- autoridade raiz/do pai direto, escopo do repositório e interseções de escopo de URL;
- propriedade única de escritor mais evidência de liberação de concessão com detentor/caminho/tempo;
- tamanho real do resumo em palavras/bytes e uma raiz de artefato reservada de propriedade do pai;
- comandos separados de especificação, qualidade, cancelamento, idempotência, concessão, isolamento de contexto e integração vinculados à execução, produtor, porta e tarefas cobertas.

Folhas não podem delegar, usar credenciais, implantar, enviar mensagens externas, promover memória ou alterar estado vivo. Um booleano dizendo "concessões liberadas" não é prova de que foram liberadas.

Paralelismo é para trabalho independente. Dois agentes editando a mesma árvore compartilhada não são um sistema distribuído. São um conflito de merge com otimismo.

## Aprender sem memorizar o acidente

O FP evolui políticas externas: habilidades, esquemas, listas de verificação e automação limitada. Ele não afirma treinar pesos de modelo ou garantir generalização estatística.

```text
uma execução comprovada
-> observação

um caso grave
-> no máximo, uma lista de verificação sombra restrita com expiração

2-4 casos positivos independentes
-> deixar um de fora -> avaliação cega -> rotacionar cada caso

todas as dobras + controles + invariantes + sombra futura + rollback passam
-> candidato ativo aprovado pelo pai
```

Paráfrases, variantes de ruído e cinco subagentes de uma sessão são verificações de robustez úteis. Ainda contam como uma única experiência independente.

Um candidato ativo precisa de:

- hashes de snapshot do livro de origem recalculáveis com identidades distintas de tarefa, sessão, entrada e família de tarefas;
- cada caso positivo deixado de fora uma vez quando a amostra é pequena, com o contexto de validação oculto do candidato;
- evidência de linha de base, candidato e oráculo independente do mesmo avaliador cego;
- medições na mesma unidade que não mostrem regressão e pelo menos uma melhoria;
- um caso vizinho onde a regra não deve disparar;
- invariantes de tolerância zero para autoridade, escopo, segurança, cancelamento e idempotência;
- um orçamento de complexidade e um alvo aplicado cujos bytes correspondam ao hash congelado do candidato;
- três observações sombra genuinamente posteriores, cada uma nova e limitada por um relógio de livro confiável;
- autoridade explícita de promoção, proveniência atual e rollback testado.

Falhas de treinamento expõem subajuste. Regressões de validação expõem sobreajuste. Falhas de controle negativo expõem um gatilho muito amplo. Nenhum pode ser eliminado pela média.

Veja o [Portão de Generalização](fp/generalization-gate/SKILL.md) e seu [contrato de máquina](fp/contracts/evidence-ledger.v1.schema.json).

## Evidência que pode dizer "não"

`fp/contracts/evidence-ledger.v1.schema.json` mais o validador semântico sem dependências formam a fonte da verdade.

Eles vinculam afirmações a comandos observados, impõem escopos separados de repositório/rede/escrita, comparam a execução final com seu briefing, validam evidência de sistema vivo e contexto externo, e falham fechado em verificações não relacionadas, métricas fabricadas, aprendizado com data futura ou estado de continuação obsoleto.

```text
escopo -> linhas de aceitação -> execução limitada -> verificações observáveis -> afirmações verificadas
```

Um processo verde, reinicialização de serviço, resumo filho ou diff de implementação não é evidência de conclusão por si só. Uma vez que a evidência declarada passa, o FP emite um veredito e para, em vez de adicionar verificações neutras em estado inalterado.

## Instalar

Um arquivo. Um instalador. Uma verificação somente leitura.

1. Baixe o `fp-universal-v{version}.zip` mais recente de [Releases](https://github.com/MiaoY0uShan/FP/releases).
2. Extraia na raiz do projeto.
3. No Windows, execute `INSTALL-FP.cmd`. No macOS/Linux, execute `sh ./INSTALL-FP.sh`.
4. Verifique com `INSTALL-FP.cmd -Verify` no Windows ou `sh ./INSTALL-FP.sh --verify` no macOS/Linux, depois recarregue a ferramenta de IA e trabalhe normalmente.

O instalador verifica propriedade, colisões, links/pontos de nova análise, blocos gerenciados e backups antes de escrever. A desinstalação verificada remove apenas o conteúdo de propriedade do instalador.

[Comandos exatos e níveis de compatibilidade](INSTALL.md) | [Migração do ZeroToHero ou Xskill](MIGRATION.md) | [Alternativa de copiar e colar](fp-copy-paste.md)

O pacote Claude Code inclui `.claude/skills/fp/` para descoberta de habilidades e `.claude/CLAUDE.md` para injeção automática em nível de sistema — o mesmo mecanismo que o Superpowers usa. Outros hosts recebem pontos de entrada específicos da ferramenta por meio do instalador universal.

Objetivos de engenharia ativam o FP sem palavra-chave. Estas formas explícitas permanecem opcionais:

```text
FP: Diagnosticar e corrigir a regressão de redefinição de senha.
$fp Revisar o fluxo de trabalho de release deste repositório sem editar.
```

## Números, quando são reais

**Sem linha de base, não há alegação de melhoria.**

O FP pode calcular taxa de verificação, aumento de escopo, retrabalho, proxy de carga de contexto e Tokens por Progresso Verificado a partir de uma execução comprovada. Valores ausentes permanecem como `unknown`. Uma comparação justa fixa a tarefa, modelo, revisão do repositório, autoridade e verificações de aceitação.

Não há um gráfico decorativo de "42% melhor" aqui. O validador perguntaria para onde foi a linha de base.

[Contrato de métricas](docs/metrics.md) | [Estudos de caso](docs/case-studies.md) | [Registro de testes futuros](docs/forward-tests-2026-07-14.md)

## Rotas

O FP usa um modelo comprimido de 4 rotas:

| Rota | Quando | O que acontece |
| --- | --- | --- |
| **Urgente / Alto Risco** | Incidentes, questionamentos, mudanças de protocolo | Confirmar intenção → agir dentro da autoridade. Incidentes restauram antes de reparar. |
| **Diagnóstico Somente Leitura** | Falhas desconhecidas ou varreduras proativas | Debug primeiro: hipótese → sonda → correção autorizada. Auditoria: linha de base por alvo → relatório P0/P1/P2. |
| **Construir** | Implementação clara ou vaga | Pequeno → Minibriefing. Médio → Briefing de Execução + Livro. Vago → Cartões de Ideia. Grande → módulos mínimos → briefing final. |
| **Fechar** | Toda tarefa | Passar com evidência correspondente → um veredito → parar. Diagnóstico extra deve mudar uma decisão ou preencher uma linha de aceitação; estado alterado ainda aciona regressão e controles negativos obrigatórios. |

Edição minúscula e clara → briefing de cinco linhas e uma verificação relevante. Interrupção ativa → `OBSERVAR → CONTER → RESTAURAR → REPARAR → APRENDER`. Varredura de frota multidispositivo → evidência somente leitura por alvo, comparação entre alvos, depois reparo autorizado por alvo.

Sistemas vivos, contexto externo, compatibilidade de provedores/controle de gastos, multiagente e execução delegada, continuação, autoiteração e aprendizado em segundo plano se sobrepõem como camadas nessas rotas.

A execução delegada agora é explícita: cada item de trabalho recebe um implementador novo, revisor de tarefa novo, corretor novo condicional e re-revisor novo, depois um revisor de integração final novo antes que o pai reexecute as verificações de integração. Domínios de problemas independentes se expandem apenas após estado compartilhado, arquivos, saídas geradas e dependências serem comprovadamente disjuntos. O FP escolhe o runtime nativo observado do host instalado — como Codex `spawn_agent`, Claude Code `Agent`, Kimi Code `Agent`/`AgentSwarm` ou Qwen Code `agent` — em vez de adivinhar pelo nome do modelo. Nomes humanos mostrados pela UI do host são cosméticos; o FP usa IDs de tarefa determinísticos.

Para provedores terceiros e gateways locais, o perfil de compatibilidade de provedor resolve a cadeia host efetivo -> proxy -> modelo de rede -> provedor, verifica a saúde do proxy, multiplica os tetos de repetição aninhados, congela orçamentos de solicitação/token/subagente, interrompe ações semânticas repetidas e reconcilia o uso nativo do provedor. Ele pode evitar gastos ilimitados e identificar um limite quebrado; não pode adicionar recursos de protocolo que um provedor não implementa.

Quando um MCP instalado é genuinamente necessário para uma linha de aceitação, o FP o usa automaticamente dentro da autoridade existente da tarefa. Se estiver ausente, o FP primeiro mostra a fonte exata, versão, escopo de instalação, permissões/exposição de dados, necessidades de autenticação, verificação e rollback; nada é baixado ou instalado até que o usuário aprove explicitamente esse briefing.

## Desenvolver

O código-fonte canônico reside em `fp/`. Os pacotes de host gerados residem em `install/` para 18 agentes (Claude Code, Codex, Gemini CLI, Cursor, Windsurf, Cline, Roo Code, OpenCode, Kiro, Qoder, Aider, GitHub Copilot CLI, GitHub Copilot Editor e mais). Todas as cópias geradas são atualizadas por script, nunca editadas manualmente.

```text
node scripts/lint-fp.js
node scripts/lint-release.js
node scripts/lint-contracts.js --ledger fp/examples/password-reset.evidence-ledger.json --brief fp/examples/password-reset.compiled-execution-brief.json
node --test
powershell -NoProfile -File scripts/sync-install-packs.ps1 -Check
```

O fluxo de trabalho de release também controla o ciclo de vida do Windows PowerShell, instalação/verificação/desinstalação POSIX, checksums de pacote, pontos de entrada de arquivo e um diff limpo de pacote gerado.

## FAQ

### Toda tarefa se torna uma cerimônia?

Não. Uma correção de uma linha não deveria precisar de uma constituição.

### Um subagente pode declarar a tarefa inteira como concluída?

Ele pode retornar evidência e um veredito. O pai ainda reexecuta verificações críticas e detém a alegação final.

### Por que algumas ferramentas mostram nomes humanos estrangeiros para agentes?

Isso é rotulagem da UI do host, não um requisito do FP. O FP registra IDs semânticos como `T03-implementer` e `T03-reviewer`; o runtime pode renderizar qualquer apelido sem alterar identidade, propriedade, atualidade ou evidência.

### A DeepSeek, Kimi ou Qwen API fornecem subagentes por si mesmas?

Não. Essas são provedoras de modelo. Kimi Code e Qwen Code são hosts de agente com suas próprias ferramentas de subagente; uma API de modelo usada por trás do Claude Code ainda usa o runtime do Claude Code. O registro de fonte oficial distingue hosts de APIs somente de modelo e falha fechado quando o recurso instalado está ausente.

### Ele aprende com uma execução bem-sucedida?

Ele registra uma observação. Uma anedota não é um esquema.

### Isso é IA autônoma automodificável?

Não. Agentes em segundo plano podem propor candidatos congelados. Avaliadores independentes os testam. A promoção requer autoridade declarada, evidência de máquina, uma janela de sombra futura e rollback.

### Ele precisa do Hermes, Context7 ou outro serviço rodando?

Não. Suas ideias úteis de protocolo foram adaptadas para um contrato local portátil. Seus daemons, bancos de dados, serviços MCP, backends privados e crawlers não são dependências.

### O FP instalará automaticamente um MCP ausente?

Somente após aprovação explícita. O FP chama automaticamente um MCP necessário para a tarefa que já esteja disponível, mas um MCP ausente recebe primeiro um briefing de aquisição limitado. A aprovação para instalar não autoriza silenciosamente login, segredos, mutação de configuração, reinicializações, serviços residentes ou ações mais amplas da tarefa.

### Ele promete menos tokens ou entrega mais rápida?

Somente após uma comparação repetida controlada provar isso.

## Influências

O FP é uma implementação original. Seu design foi aprimorado pelo estudo de [Superpowers](https://github.com/obra/superpowers), [Hermes Agent](https://github.com/NousResearch/hermes-agent), [Ponytail](https://github.com/DietrichGebert/ponytail), [Context7](https://github.com/upstash/context7), [Grill Me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) e [code-review-graph](https://github.com/tirth8205/code-review-graph).

As revisões exatas, comportamentos adotados, exclusões e limites de inferência estão em [docs/upstream-influences.md](docs/upstream-influences.md). A proveniência da licença está em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Anteriormente Xskill. Veja [MIGRATION.md](MIGRATION.md).

---

**Idiomas:** [English](README.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md)

## Licença

MIT. Use, inspecione, melhore e mantenha o aviso.
