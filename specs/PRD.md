# ChipCut – PRD

> **Sistema Automatizado de Leitura e Desativação de Chips SIM Card**

| Campo   | Valor                        |
|---------|------------------------------|
| Versão  | 1.1 – MVP                    |
| Status  | Em Desenvolvimento           |
| Autor   | Grupo GoldenSat              |

---

## 1. Visão Geral

**Objetivo:** Desenvolver um dispositivo portátil capaz de realizar a leitura automática de números ICCID de chips SIM Card através de visão computacional e inteligência artificial, permitindo o desligamento individual ou em lote de forma rápida, segura e rastreável.

O equipamento conecta-se via USB a um computador e opera através de uma base física onde o operador posiciona manualmente os chips para leitura automática.

---

## 2. Problema Atual

### Processo manual vigente

- Identificação manual do ICCID
- Digitação ou cópia do número no sistema
- Consulta em sistemas internos
- Execução manual do desligamento

### Principais dificuldades

| Problema                       | Impacto                                  |
|--------------------------------|------------------------------------------|
| Processo operacional lento     | Baixo throughput por operador            |
| Erros de digitação             | Desligamentos incorretos ou perdidos     |
| Baixa produtividade            | Alto custo operacional por chip          |
| Ausência de rastreabilidade    | Incapacidade de auditoria                |
| Dependência humana total       | Não escalável                            |

---

## 3. Solução Proposta

Ao posicionar o chip na base de leitura, o sistema executa automaticamente:

1. Detectar presença do chip via sensor
2. Capturar imagem automaticamente
3. Enviar imagem para serviço de IA
4. Extrair o número ICCID
5. Validar o número identificado
6. Armazenar resultado no banco de dados
7. Executar ou preparar o desligamento

> Todo o processo ocorre sem necessidade de captura manual pelo operador.

---

## 4. Escopo do MVP

### Estrutura Física

- Base para posicionamento do chip com canaleta guia
- Sensor de presença (infravermelho / óptico / laser)
- Câmera superior fixa (Full HD mínimo, foco fixo)
- Iluminação LED controlada (eliminação de sombras)
- Comunicação USB com o computador host
- LEDs indicadores de status (verde / vermelho)
- Microcontrolador: Arduino Nano ou ESP32

### Software

- **Linguagem:** Python
- **Framework:** Django
- **Banco de dados:** PostgreSQL (produção) · SQLite (desenvolvimento)

Responsabilidades da aplicação:

- Captura e gerenciamento das imagens
- Comunicação com o serviço de IA
- Armazenamento e indexação dos resultados
- Gestão e execução dos desligamentos
- Dashboard operacional em tempo real
- Auditoria, logs e histórico completo

---

## 5. Fluxo Operacional

### Processo de Leitura

1. Operador conecta o equipamento via USB
2. Sistema identifica câmera e controlador automaticamente
3. Operador posiciona o chip na base
4. Sensor detecta a presença do chip
5. Sistema realiza **1ª captura** automática da imagem
6. Imagem é enviada para o serviço de IA
7. IA identifica e retorna o ICCID (1ª tentativa)
8. Sistema valida o número extraído
   - **Se válido →** segue para o passo 9
   - **Se inválido →** executa **2ª tentativa automática** (nova captura + nova chamada à IA)
     - Se válido na 2ª tentativa → segue para o passo 9
     - Se inválido na 2ª tentativa → LED pisca vermelho + exibe erro + operador reposiciona o chip
9. ICCID confirmado é salvo no banco de dados e adicionado à tabela de revisão do lote
10. Sistema informa o resultado ao operador via UI e LEDs

### Verificação em 2 Etapas

Toda leitura passa obrigatoriamente por **duas etapas de validação** antes de ser aceita:

| Etapa | Gatilho                        | Ação                                                           |
|-------|--------------------------------|----------------------------------------------------------------|
| 1ª    | Captura inicial                | IA extrai e valida o ICCID                                     |
| 2ª    | Resultado inválido na etapa 1  | Nova captura automática + nova chamada à IA                    |
| Erro  | Inválido nas duas etapas       | LED pisca vermelho (3x), mensagem de erro, chip rejeitado      |

> A 2ª tentativa é automática e transparente para o operador — sem necessidade de interação.

### Fluxos de Resposta

| Fluxo              | Indicador Visual               | Ação                                                      |
|--------------------|--------------------------------|-----------------------------------------------------------|
| SUCESSO (1ª leitura) | LED verde acende             | Mensagem de sucesso, chip adicionado à tabela de revisão  |
| SUCESSO (2ª leitura) | LED verde acende             | Mensagem de sucesso com nota "validado na 2ª tentativa"   |
| ERRO (ambas falharam)| LED vermelho **pisca 3x**   | Mensagem de erro, operador reposiciona o chip             |

---

## 6. Modos de Operação

### Modo Individual

Após leitura bem-sucedida:

- Sistema exibe o ICCID na interface
- Operador confirma a ação
- Sistema executa o desligamento imediatamente

### Modo Lote *(Recomendado para o MVP)*

Fluxo acumulativo com aprovação manual antes do cancelamento:

1. Cada ICCID lido e validado é adicionado à **tabela de revisão do lote**
2. Operador continua adicionando chips sequencialmente
3. Ao final da leitura, a tabela exibe todos os chips com seus ICCIDs e status
4. **Responsável autorizado revisa a tabela** e aprova o lote para cancelamento
5. Somente após aprovação o sistema inicia o cancelamento dos chips em massa

### Tabela de Revisão do Lote

Antes da aprovação, o responsável visualiza:

| Coluna              | Descrição                                                   |
|---------------------|-------------------------------------------------------------|
| `#`                 | Sequência de leitura                                        |
| `ICCID`             | Número identificado (editável manualmente se necessário)    |
| `Imagem`            | Thumbnail da foto capturada                                 |
| `Tentativas`        | 1ª ou 2ª tentativa bem-sucedida                             |
| `Status`            | `aguardando_aprovação` · `aprovado` · `rejeitado`           |
| `Ação`              | Botão para remover chip individual da lista antes de aprovar|

Ações disponíveis na tela de revisão:

- **Aprovar lote completo →** inicia o cancelamento de todos os chips listados
- **Remover chip individual →** exclui da lista sem cancelar
- **Cancelar lote →** descarta toda a lista sem executar nenhum desligamento

---

## 7. Requisitos Funcionais

| ID     | Descrição                                                                                  |
|--------|--------------------------------------------------------------------------------------------|
| RF001  | Detectar automaticamente a presença do chip via sensor de presença                         |
| RF002  | Capturar imagem automaticamente ao detectar o chip, sem intervenção do operador            |
| RF003  | Realizar leitura do ICCID através de serviço de IA (OCR / Visão Computacional)            |
| RF004  | Validar formato do ICCID extraído (estrutura e checksum)                                   |
| RF005  | Permitir correção manual do número identificado em caso de leitura incorreta               |
| RF006  | Salvar histórico completo de leituras com imagem, resultado e usuário                      |
| RF007  | Executar desligamento individual de chip após confirmação do operador                      |
| RF008  | Executar desligamento em lote de múltiplos chips somente após aprovação manual             |
| RF009  | Registrar logs de auditoria para todas as operações realizadas                             |
| RF010  | Armazenar imagem vinculada ao ICCID no banco de dados                                      |
| RF011  | Exibir status visual através de LEDs indicadores no hardware                               |
| RF012  | Permitir exportação dos registros de leituras e desligamentos                              |
| RF013  | Executar verificação em 2 etapas: nova captura automática quando a 1ª leitura falhar       |
| RF014  | Acionar LED piscando vermelho (3x) quando ambas as tentativas de leitura falharem          |
| RF015  | Exibir tabela de revisão consolidada com todos os chips do lote antes da aprovação         |
| RF016  | Permitir que responsável autorizado aprove, remova chips individuais ou cancele o lote     |
| RF017  | Iniciar cancelamento em massa somente após aprovação explícita do responsável              |

---

## 8. Requisitos Não Funcionais

| ID     | Descrição                                                                                  |
|--------|--------------------------------------------------------------------------------------------|
| RNF001 | Precisão mínima de leitura de ICCID: **95%**                                              |
| RNF002 | Tempo máximo por leitura (detecção até resultado): **5 segundos**                         |
| RNF003 | Funcionamento via USB Plug and Play, sem necessidade de drivers adicionais                 |
| RNF004 | Estrutura física portátil e de baixo peso                                                  |
| RNF005 | Interface simples e intuitiva para operadores sem treinamento técnico                      |
| RNF006 | Registro obrigatório de todas as operações realizadas para fins de auditoria               |

---

## 9. Arquitetura de Hardware

| Componente          | Tecnologias Sugeridas              | Responsabilidade                            |
|---------------------|------------------------------------|---------------------------------------------|
| Sensor de Presença  | Infravermelho, Óptico, Laser       | Detectar inserção do chip na base           |
| Câmera              | Full HD+, foco fixo                | Captura padronizada das imagens             |
| Iluminação LED      | LED difuso controlado              | Eliminar sombras, padronizar leitura        |
| Microcontrolador    | Arduino Nano, ESP32                | Sensores, LEDs, comunicação USB             |
| Base Física         | Canaleta guia impressa / usinada   | Posicionamento padrão do chip               |

---

## 10. Arquitetura de Software

### Backend – Python / Django

| Módulo            | Responsabilidade                                                        |
|-------------------|-------------------------------------------------------------------------|
| `capture`         | Gerenciamento da câmera, captura automática de imagens                  |
| `ocr_ai`          | Comunicação com serviço de IA para extração do ICCID                   |
| `validation`      | Validação de formato, checksum e lógica de 2 tentativas                 |
| `processing`      | Execução dos desligamentos após aprovação do lote                       |
| `approval`        | Fluxo de revisão da tabela de lote e aprovação pelo responsável         |
| `audit`           | Registro e armazenamento de logs de todas as operações                  |
| `dashboard`       | Monitoramento operacional em tempo real                                 |

---

## 11. Banco de Dados

### `chips`

| Campo                | Tipo           | Descrição                                          |
|----------------------|----------------|----------------------------------------------------|
| `id`                 | UUID (PK)      | Identificador único do registro                    |
| `iccid`              | VARCHAR(22)    | Número ICCID do chip                               |
| `imagem`             | FileField      | Imagem capturada pelo dispositivo                  |
| `imagem_tentativa_2` | FileField      | Imagem da 2ª tentativa (nullable)                  |
| `tentativas`         | IntegerField   | Quantidade de tentativas realizadas (1 ou 2)       |
| `status_leitura`     | ENUM           | `sucesso` · `erro` · `pendente`                    |
| `status_revisao`     | ENUM           | `aguardando_aprovacao` · `aprovado` · `rejeitado`  |
| `status_desligamento`| ENUM           | `pendente` · `executado` · `falha`                 |
| `data_leitura`       | DateTimeField  | Timestamp da leitura                               |
| `data_desligamento`  | DateTimeField  | Timestamp do desligamento                          |
| `usuario`            | FK → User      | Operador responsável pela leitura                  |
| `aprovado_por`       | FK → User      | Responsável que aprovou o desligamento (nullable)  |
| `lote`               | FK → Lote      | Lote ao qual o chip pertence (nullable)            |
| `is_active`          | BooleanField   | Soft delete                                        |

### `lotes`

| Campo            | Tipo           | Descrição                                             |
|------------------|----------------|-------------------------------------------------------|
| `id`             | UUID (PK)      | Identificador único do lote                           |
| `nome_lote`      | VARCHAR(100)   | Nome / descrição do lote                              |
| `quantidade`     | IntegerField   | Total de chips no lote                                |
| `data_criacao`   | DateTimeField  | Timestamp de criação                                  |
| `status`         | ENUM           | `aberto` · `em_revisao` · `aprovado` · `executado` · `cancelado` |
| `aprovado_por`   | FK → User      | Responsável que aprovou o lote (nullable)             |
| `data_aprovacao` | DateTimeField  | Timestamp da aprovação (nullable)                     |
| `usuario`        | FK → User      | Operador responsável pela leitura                     |
| `is_active`      | BooleanField   | Soft delete                                           |

### `logs`

| Campo      | Tipo           | Descrição                                          |
|------------|----------------|----------------------------------------------------|
| `id`       | UUID (PK)      | Identificador único do log                         |
| `acao`     | VARCHAR(50)    | `leitura` · `desligamento` · `correcao`            |
| `iccid`    | VARCHAR(22)    | ICCID afetado                                      |
| `usuario`  | FK → User      | Operador que executou a ação                       |
| `data_hora`| DateTimeField  | Timestamp da ação                                  |
| `resultado`| JSONField      | Payload completo do resultado                      |

---

## 12. Dashboard Operacional

### Indicadores em Tempo Real

| Indicador             | Descrição                                                  |
|-----------------------|------------------------------------------------------------|
| Chips lidos hoje      | Total de leituras realizadas na data atual                 |
| Chips desligados      | Total de desligamentos executados com sucesso              |
| Leituras com erro     | Leituras que falharam ou precisaram de correção manual     |
| Leituras pendentes    | Chips lidos ainda não desligados                           |
| Taxa de sucesso       | Percentual de leituras bem-sucedidas (meta: > 95%)         |
| Tempo médio           | Média de tempo por ciclo de leitura                        |

### Histórico de Operações

- ICCID + imagem capturada
- Operador responsável
- Data e hora da operação
- Resultado (`sucesso` / `erro` / `correção manual`)

---

## 13. Evoluções Futuras

| Fase   | Nome                  | Descrição                                                                                          |
|--------|-----------------------|----------------------------------------------------------------------------------------------------|
| Fase 1 | MVP                   | Dispositivo manual com leitura automática por IA e desligamento individual e em lote               |
| Fase 2 | Dispenser Automático  | Reservatório com alimentação unitária de chips via Arduino/ESP32, eliminando posicionamento manual |
| Fase 3 | Esteira Inteligente   | Dispenser → Esteira → Sensor → Captura → IA → Banco → Desligamento                               |
| Fase 4 | Separação Automática  | Saída física diferenciada: leitura válida → Compartimento A · erro → Compartimento B              |

---

## 14. Critérios de Sucesso

| Critério                                          | Meta              | Referência      |
|---------------------------------------------------|-------------------|-----------------|
| Precisão de leitura de ICCID                      | >= 95%            | RNF001          |
| Taxa de recuperação na 2ª tentativa               | >= 80% dos erros  | RF013           |
| LED piscando vermelho funciona ao falhar 2x       | 100%              | RF014           |
| Desligamento somente após aprovação do responsável| 100%              | RF017           |
| Tabela de revisão exibe todos os chips do lote    | 100% dos chips    | RF015           |
| Tempo médio por chip                              | < 5s              | RNF002          |
| Throughput mínimo por operador                    | >= 100 chips/h    | Objetivo        |
| Histórico auditável completo                      | 100% registrado   | RF009           |