# Instruções para o Claude

Este projeto é um sistema Django chamado ChipCut.

## Stack
- Python
- Django
- Django Templates
- SQLite no desenvolvimento
- PostgreSQL futuramente
- HTML/CSS/Bootstrap
- openpyxl para exportação Excel

## Objetivo do MVP
Criar uma área mobile dentro do próprio Django para capturar foto de chips SIM Card pelo celular, processar a imagem com IA/OCR, extrair o ICCID, validar, salvar em lote, revisar e exportar ICCIDs em Excel.

## Fora do escopo
Não implementar integração com sistema externo de desligamento neste momento.
Não implementar app mobile nativo.
Não implementar Arduino, ESP32, sensores ou hardware automático agora.

## Regras
- Antes de alterar arquivos, explique o plano.
- Trabalhe em etapas pequenas.
- Não remova funcionalidades existentes.
- Não altere settings sem explicar.
- Não crie migrations desnecessárias sem pedir confirmação.
- Usar arquitetura limpa.
- Separar regra de negócio em services.py quando fizer sentido.
- Usar Django Templates.
- Código simples, seguro e fácil de manter.

## Funcionalidades principais
1. Criar lote.
2. Capturar/enviar foto do chip pelo celular.
3. Processar imagem com IA/OCR.
4. Extrair ICCID.
5. Validar ICCID.
6. Permitir correção manual.
7. Adicionar chip ao lote.
8. Revisar lote.
9. Remover chip individual.
10. Aprovar lote internamente.
11. Exportar ICCIDs em Excel.
12. Registrar logs/auditoria.

## Importante
Os ICCIDs lidos devem ser persistidos no banco.
Cache pode ser usado apenas como apoio operacional, mas não como fonte principal dos dados.