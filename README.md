# GS Cut

Sistema web da **GoldenSat** para apoiar o processo de **corte e leitura de chips
SIM Card**. A aplicação lê o **ICCID** de cada chip a partir de uma foto, valida o
número, organiza os chips em **lotes**, permite **revisão e aprovação** internas e
**exporta** os resultados em Excel — com **auditoria** de tudo o que acontece.

O nome interno do repositório é `chipcut`, mas a interface e o produto são
apresentados como **GS Cut**.

## Como funciona

1. O operador cria um **lote** de trabalho.
2. O chip é posicionado sob a **câmera** e a foto é capturada.
3. A imagem é processada por **IA/OCR**, que extrai o **ICCID**.
4. O número é **validado** (algoritmo de Luhn) e pode ser **corrigido manualmente**
   quando necessário.
5. O chip é adicionado ao lote; o lote é **revisado** e **aprovado** internamente.
6. Os ICCIDs aprovados são **exportados em Excel**.
7. Todas as ações ficam registradas no **log de auditoria**.

### Captura por câmera própria (hoje)

Atualmente a leitura é feita por uma **câmera IP dedicada** (Hikvision/OEM, via
endpoint ISAPI). O servidor busca o *snapshot* da câmera por HTTP, monta a imagem e
envia para o OCR. Hoje **cada chip é colocado manualmente** embaixo da câmera para
ser fotografado e lido.

> Também existe o modo de captura pelo **celular** (câmera nativa via
> `<input capture>`), útil para testes e operação móvel na mesma rede.

### Visão futura: esteira automatizada

A evolução planejada é integrar uma **esteira transportadora** que leve os chips
automaticamente até o ponto de leitura da câmera, **eliminando o posicionamento
manual** de cada chip. Assim o fluxo de corte/leitura passa a ser contínuo e com
muito menos intervenção do operador.

## Stack

- **Python 3.12 · Django 5.2**
- **SQLite** (desenvolvimento) · **PostgreSQL** (futuro)
- **Bootstrap 5** com Django Templates
- **OCR/IA:** Google Gemini (padrão), OpenAI Vision ou `mock` para testes
- **Câmera IP** Hikvision/OEM (snapshot via ISAPI, autenticação Digest)
- **Supabase Storage** para arquivamento opcional das imagens dos chips
- **openpyxl** para exportação em Excel

## Configuração

```powershell
# 1. Ativar o ambiente virtual
.\venv\Scripts\Activate.ps1

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
copy .env.example .env
#   edite o .env e preencha as credenciais (veja a seção abaixo)

# 4. Banco de dados
python manage.py migrate

# 5. Criar usuário administrador/operador
python manage.py createsuperuser

# 6. Rodar
python manage.py runserver
```

### Variáveis de ambiente principais (`.env`)

| Variável | Para que serve |
| --- | --- |
| `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Configuração base do Django |
| `OCR_BACKEND` | Backend de leitura: `gemini`, `openai` ou `mock` |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | Credencial do backend de OCR escolhido |
| `CAMERA_IP`, `CAMERA_USER`, `CAMERA_PASSWORD` | Acesso à câmera IP (snapshot ISAPI) |
| `CAMERA_SNAPSHOT_URL`, `CAMERA_TIMEOUT` | Ajustes opcionais da câmera |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Armazenamento das imagens (opcional) |
| `CHIP_SALVAR_IMAGEM` | Se `True`, arquiva a foto no Supabase; se `False`, usa só para o OCR e descarta |

> Para testar sem custo/credencial, use `OCR_BACKEND=mock`. Sem as variáveis do
> Supabase a captura continua funcionando — apenas as imagens não são salvas.

### Testar pelo celular (mesma rede Wi-Fi)

```powershell
python manage.py runserver 0.0.0.0:8000
```

Adicione o IP do PC em `ALLOWED_HOSTS` no `.env` e acesse `http://<IP-do-PC>:8000`
no celular.

## Testes

```powershell
$env:OCR_BACKEND="mock"; python manage.py test
```

## Estrutura do projeto

- `config/` — projeto Django (settings, urls)
- `dashboard/` — indicadores e painéis operacionais
- `lotes/` — criação, revisão e aprovação de lotes
- `chips/` — captura (câmera IP/celular), leitura por IA e correção de chips
- `ocr/` — validação de ICCID (Luhn) e backends de OCR (Gemini/OpenAI/mock)
- `core/` — serviços compartilhados (câmera, Supabase Storage, cache)
- `exports/` — exportação em Excel
- `audit/` — logs de auditoria

---

Projeto interno da **GoldenSat**.
