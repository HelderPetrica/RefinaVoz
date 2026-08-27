# Security Policy — RefinaVoz

RefinaVoz é um projeto open source em **beta**. Segurança, privacidade e previsibilidade do comportamento desktop são tratadas como requisitos de engenharia, especialmente porque a aplicação pode acessar microfone, janela ativa, clipboard e APIs externas.

## Versões suportadas

Enquanto o projeto estiver em beta, correções de segurança serão priorizadas para:

- a branch `main`;
- a release pública mais recente, quando releases versionadas estiverem disponíveis.

Branches antigas ou experimentais podem não receber correções retroativas.

## Como relatar uma vulnerabilidade

Não publique em issue aberta:

- chaves de API;
- tokens ou credenciais;
- dados pessoais reais;
- exploits reproduzíveis com impacto relevante;
- screenshots contendo informação sigilosa.

Prefira o mecanismo privado de **Security Advisories / Report a vulnerability** do GitHub quando disponível no repositório. Se esse canal não estiver habilitado, entre em contato com o mantenedor pelo perfil GitHub antes de divulgar detalhes técnicos publicamente.

No relato, inclua apenas o necessário:

1. componente e versão/commit afetado;
2. pré-condições para reprodução;
3. impacto observado;
4. passos mínimos de reprodução;
5. sugestão de correção, se houver.

## Escopo de segurança relevante

Exemplos de problemas que devem ser tratados como segurança:

- exposição ou logging indevido de `GEMINI_API_KEYS`;
- execução arbitrária de comandos/arquivos;
- leitura ou captura de janela diferente da pretendida;
- exfiltração inesperada de áudio, screenshot ou clipboard;
- injeção de texto em uma janela diferente daquela selecionada pelo usuário;
- path traversal ou escrita fora de diretórios esperados;
- dependências comprometidas;
- prompt injection que resulte em acesso indevido a dados ou execução local não autorizada;
- bypass de controles que deveria exigir ação explícita do usuário.

Falhas de qualidade de texto ou respostas incorretas do modelo, isoladamente, são bugs de produto; passam a ser segurança quando permitem exposição de dados, execução indevida ou quebra de isolamento/permissões.

## Segredos

O projeto fornece apenas `.env.example`. Chaves reais devem permanecer no `.env` local e nunca ser commitadas.

Se uma credencial for exposta, considere-a comprometida mesmo que o commit seja apagado posteriormente: revogue/rotacione a chave no provedor e só então limpe o histórico se necessário.

## Dependências e CI

Pull requests devem manter os gates automatizados do repositório. Atualizações de dependências sensíveis devem ser revisadas pelo impacto em:

- Tauri/Rust e permissões desktop;
- FastAPI/Python;
- bibliotecas de acesso ao Gemini;
- captura de tela, clipboard e teclado;
- cadeia de build Node/npm.

## Divulgação responsável

A prioridade é corrigir e disponibilizar uma versão segura antes da publicação ampla dos detalhes de exploração. Depois da correção, o projeto pode documentar causa, impacto e mitigação de forma transparente, sem expor credenciais ou dados de usuários.
