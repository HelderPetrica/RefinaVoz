# Privacy & Data Flow — RefinaVoz

RefinaVoz é um projeto **local-first**, mas não deve ser tratado como **local-only**.

Este documento descreve o fluxo de dados observado na arquitetura open source atual. Ele não substitui os termos do provedor de IA, obrigações profissionais, contratos de confidencialidade, LGPD ou outras normas aplicáveis ao usuário.

## 1. O que roda localmente

Por padrão, o aplicativo desktop, o frontend React/Tauri e o backend FastAPI são executados na máquina do usuário.

Dados como configurações locais, dicionário semântico, estados da aplicação e arquivos de banco/local storage usados pelo projeto permanecem na máquina enquanto não forem deliberadamente incluídos em uma requisição ao modelo.

O arquivo `.env` também é local e está bloqueado pelo `.gitignore`. Nunca versione chaves reais.

## 2. O que pode ser enviado ao Gemini

Quando `USE_MOCK_LLM=false` e uma função dependente de IA é utilizada, o backend pode enviar ao provedor configurado conteúdo necessário para a inferência, incluindo:

- áudio capturado pelo microfone;
- texto digitado ou contexto textual incluído na requisição;
- prompts e instruções do modo selecionado;
- imagem/screenshot da janela ativa quando o contexto visual estiver habilitado;
- metadados técnicos necessários para a chamada da API.

O processamento é feito com a chave Gemini configurada pelo próprio usuário em `GEMINI_API_KEYS`.

## 3. Captura visual

A captura da janela ativa pode conter informações sensíveis que não fazem parte da fala: nomes, processos, e-mails, mensagens, dados pessoais, credenciais exibidas em tela ou documentos protegidos por sigilo.

Use contexto visual somente quando necessário. Antes de usar RefinaVoz em ambientes profissionais, valide quais dados podem legitimamente ser enviados ao provedor de IA escolhido.

## 4. Chaves de API

- mantenha a chave apenas no `.env` local;
- não cole chaves em issues, screenshots, logs ou commits;
- se uma chave for exposta, revogue/rotacione-a imediatamente no provedor;
- o suporte a múltiplas chaves existe para failover entre credenciais legítimas configuradas pelo usuário, não para contornar quotas ou políticas do provedor.

## 5. Dados profissionais, jurídicos e sigilosos

RefinaVoz pode ser usado em fluxos jurídicos e profissionais, mas a responsabilidade por base legal, sigilo, confidencialidade, consentimento, minimização de dados e escolha do provedor permanece com quem opera a ferramenta.

Antes de processar dados de clientes ou terceiros:

1. identifique se o conteúdo contém dado pessoal, segredo profissional ou informação confidencial;
2. verifique as regras aplicáveis à sua organização e jurisdição;
3. confira os termos e políticas de tratamento/retenção da conta Gemini/API usada;
4. envie apenas o mínimo necessário para a tarefa;
5. revise o texto gerado antes de utilizá-lo profissionalmente.

## 6. Retenção pelo provedor

O repositório RefinaVoz não controla a política de retenção do lado do Google/Gemini. Essa política depende do produto, conta, plano e termos vigentes usados pelo operador.

Consulte a documentação oficial do provedor antes de processar informações sensíveis.

## 7. Telemetria

O projeto open source não deve ser interpretado como tendo um servidor central do mantenedor apenas porque usa um backend FastAPI. O backend padrão é local. Chamadas externas ocorrem quando uma funcionalidade explicitamente depende da API Gemini ou de outro serviço que venha a ser configurado futuramente.

Se telemetria remota for adicionada no futuro, ela deverá ser documentada de forma explícita antes de ser habilitada por padrão.

## 8. Relato de vulnerabilidades

Para problemas de segurança, consulte [SECURITY.md](SECURITY.md). Não publique segredos ou detalhes de exploração em uma issue pública.
