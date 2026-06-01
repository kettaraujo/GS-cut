# ChipCut — MVP

Sistema web Django para leitura de ICCID de chips SIM via foto (câmera do
celular), com validação, lotes, revisão, aprovação interna, exportação em Excel
e auditoria.

> Fora do escopo deste MVP: integração de desligamento, app mobile nativo e
> hardware (Arduino/ESP32/sensores).

## Stack
- Python 3.12 · Django 5.2
- SQLite (dev) · PostgreSQL (futuro)
- Bootstrap 5 (Django Templates)
- openpyxl (Excel) · OpenAI Vision (OCR)

## Configuração

```powershell
# 1. Ativar o ambiente virtual
.\venv\Scripts\Activate.ps1

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
copy .env.example .env
#   edite .env e preencha OPENAI_API_KEY
#   (ou use OCR_BACKEND=mock para testar sem custo/credencial)

# 4. Banco de dados
python manage.py migrate

# 5. Usuário administrador/operador
python manage.py createsuperuser

# 6. Rodar
python manage.py runserver
```

### Testar pelo celular (mesma rede Wi-Fi)
```powershell
python manage.py runserver 0.0.0.0:8000
```
Adicione o IP do PC em `ALLOWED_HOSTS` no `.env` e acesse
`http://<IP-do-PC>:8000` no celular. A captura usa a câmera nativa via
`<input capture>`, sem necessidade de HTTPS.

## Testes
```powershell
$env:OCR_BACKEND="mock"; python manage.py test
```

## Estrutura
- `config/` — projeto Django (settings, urls)
- `dashboard/` — indicadores operacionais
- `lotes/` — criação, revisão e aprovação de lotes
- `chips/` — captura, leitura por IA e correção de chips
- `ocr/` — validação de ICCID (Luhn) e backends de OCR (OpenAI/mock)
- `exports/` — exportação Excel
- `audit/` — logs de auditoria
