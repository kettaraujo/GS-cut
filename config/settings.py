"""
Django settings for config project (ChipCut MVP).

Configurações simples para desenvolvimento (SQLite). Valores sensíveis e
ambiente são lidos de variáveis de ambiente / arquivo .env para facilitar a
futura migração para produção (PostgreSQL).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega variáveis do arquivo .env (se existir) para os.environ.
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool) -> bool:
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-(^-z^gj@45nbsxg3vcn4$gke_t*tg8*_b=loi8@$+f(5yfpib^",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env_bool("DEBUG", True)

# Hosts permitidos. Em dev aceita localhost; para testar pelo celular na mesma
# rede, adicione o IP do PC em ALLOWED_HOSTS no .env (ex.: "192.168.0.10").
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,10.0.1.4").split(",")
    if h.strip()
]
# Permite acesso via túnel Cloudflare (link https público para testar no celular
# sem mexer em firewall/rede). O subdomínio é aleatório a cada execução.
ALLOWED_HOSTS += [".trycloudflare.com"]

# POSTs (forms/HTMX) vindos pelo domínio https do túnel precisam ser confiáveis.
CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",")
    if o.strip()
]
CSRF_TRUSTED_ORIGINS += ["https://*.trycloudflare.com"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Ferramentas de desenvolvimento (runserver_plus com HTTPS para a câmera ao vivo)
    "django_extensions",
    # Apps do ChipCut
    "core",
    "audit",
    "ocr",
    "lotes",
    "chips",
    "exports",
    "dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ---------------------------------------------------------------------------
# Câmera IP (snapshot HTTP) — captura de chips por estação fixa.
# A câmera 10.0.0.87 é Hikvision/OEM: snapshot em /ISAPI/Streaming/channels/101/picture
# com autenticação Digest. As credenciais ficam no .env (nunca versionadas).
# ---------------------------------------------------------------------------
CAMERA_IP = os.environ.get("CAMERA_IP", "10.0.0.87")
CAMERA_USER = os.environ.get("CAMERA_USER", "admin")
CAMERA_PASSWORD = os.environ.get("CAMERA_PASSWORD", "")
# URL completa de snapshot. Vazio => monta o padrão Hikvision/ISAPI a partir do IP.
CAMERA_SNAPSHOT_URL = os.environ.get("CAMERA_SNAPSHOT_URL", "")
CAMERA_TIMEOUT = float(os.environ.get("CAMERA_TIMEOUT", "8"))


ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# Desenvolvimento: SQLite. Produção (futuro): PostgreSQL via DATABASE_URL.

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization

LANGUAGE_CODE = "pt-br"

TIME_ZONE = "America/Sao_Paulo"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Imagens dos chips não são mais salvas em disco (SPEC3 §1.11) — vão para o
# Supabase Storage (ver SUPABASE_* abaixo), então MEDIA_URL/MEDIA_ROOT foram
# removidos.

# Cache — em desenvolvimento usamos o cache em memória do processo (sem
# dependências externas). Em produção, troque pelo Redis (bloco comentado).
# A invalidação é feita por versionamento de chave (ver core/cache.py), então
# funciona em qualquer backend, sem depender do delete_pattern do django-redis.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "chipcut-dev",
        "TIMEOUT": 60,
    }
}
# Produção (requer: pip install django-redis + servidor Redis em 127.0.0.1:6379):
# CACHES = {
#     "default": {
#         "BACKEND": "django_redis.cache.RedisCache",
#         "LOCATION": "redis://127.0.0.1:6379/1",
#         "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
#         "TIMEOUT": 60,
#     }
# }

# Mapeia a tag de mensagem ERROR para a classe de cor do Bootstrap (danger).
from django.contrib.messages import constants as _messages_constants  # noqa: E402

MESSAGE_TAGS = {_messages_constants.ERROR: "danger"}


# Logging — mostra no console os logs dos apps (ex.: leituras de OCR).
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "loggers": {
        "chips": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "ocr": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Autenticação
LOGIN_URL = "login"
LOGIN_REDIRECT_URL = "dashboard:home"
LOGOUT_REDIRECT_URL = "login"


# ---------------------------------------------------------------------------
# OCR / IA (extração de ICCID)
# ---------------------------------------------------------------------------
# Backend usado para ler o ICCID da imagem.
#   - "gemini" : usa a API de visão do Google Gemini (requer GEMINI_API_KEY)
#   - "openai" : usa a API de visão da OpenAI (requer OPENAI_API_KEY)
#   - "mock"   : retorna um ICCID simulado (desenvolvimento/testes sem custo)
OCR_BACKEND = os.environ.get("OCR_BACKEND", "gemini")

# OpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_VISION_MODEL = os.environ.get("OPENAI_VISION_MODEL", "gpt-4o")

# Google Gemini (free tier em https://aistudio.google.com/app/apikey)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_VISION_MODEL = os.environ.get("GEMINI_VISION_MODEL", "gemini-2.0-flash")


# ---------------------------------------------------------------------------
# Supabase Storage (imagens dos chips — SPEC3 §1.5)
# ---------------------------------------------------------------------------
# O bucket deve ser criado manualmente no painel do Supabase (Public) antes do
# deploy. Use a service_role key (precisa de permissão de escrita), nunca a
# anon key. Sem essas variáveis, a captura funciona mas não salva imagem.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "chipcut-imagens")

# Salvar (arquivar) a FOTO do chip? Padrão False: a imagem é usada só para o OCR
# e descartada — apenas o ICCID/infos vão ao banco. True => envia ao Supabase.
CHIP_SALVAR_IMAGEM = env_bool("CHIP_SALVAR_IMAGEM", False)
