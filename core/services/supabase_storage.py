"""Upload de imagens de chips para o Supabase Storage (SPEC3 §1.6).

As imagens capturadas vão direto para um bucket no Supabase e apenas a URL
pública é guardada no banco — nada toca o disco local. Usamos a API REST via
``httpx`` para não depender do SDK ``supabase-py``.
"""

import logging
import uuid

import httpx
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class SupabaseStorageError(Exception):
    """Falha ao comunicar com o Supabase Storage."""


class SupabaseStorageService:
    """Envia imagens para o Supabase Storage e retorna a URL pública.

    Nunca salva arquivo em disco local. Quando as credenciais não estão
    configuradas (ex.: ambiente de dev sem Supabase), ``upload`` retorna
    ``None`` em vez de quebrar o fluxo de captura — o chip é salvo mesmo assim.
    """

    TIMEOUT = 10.0

    @classmethod
    def is_configured(cls) -> bool:
        return bool(
            getattr(settings, "SUPABASE_URL", "")
            and getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
        )

    @classmethod
    def _base_url(cls) -> str:
        return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1"

    @classmethod
    def _bucket(cls) -> str:
        return settings.SUPABASE_STORAGE_BUCKET

    @classmethod
    def _headers(cls) -> dict:
        key = settings.SUPABASE_SERVICE_ROLE_KEY
        return {"Authorization": f"Bearer {key}", "apikey": key}

    @classmethod
    def upload(cls, image_bytes: bytes, iccid: str = "", tentativa: int = 1):
        """Faz upload da imagem e retorna a URL pública (ou ``None``).

        Args:
            image_bytes: conteúdo da imagem em bytes (sem salvar em disco)
            iccid: usado para nomear o arquivo de forma rastreável
            tentativa: 1 ou 2

        Returns:
            URL pública da imagem no Supabase Storage, ou ``None`` se o
            Supabase não estiver configurado.
        """
        if not cls.is_configured():
            logger.warning(
                "Supabase Storage não configurado — imagem não enviada "
                "(defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)."
            )
            return None

        prefixo = (iccid or "chip").replace("/", "_")
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefixo}_{timestamp}_t{tentativa}_{uuid.uuid4().hex[:6]}.jpg"
        path = f"chips/{filename}"

        upload_url = f"{cls._base_url()}/object/{cls._bucket()}/{path}"
        try:
            response = httpx.post(
                upload_url,
                headers={**cls._headers(), "Content-Type": "image/jpeg"},
                content=image_bytes,
                timeout=cls.TIMEOUT,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("Falha ao enviar imagem ao Supabase: %s", exc)
            raise SupabaseStorageError(str(exc)) from exc

        public_url = f"{cls._base_url()}/object/public/{cls._bucket()}/{path}"
        logger.info("Imagem enviada ao Supabase: %s", public_url)
        return public_url

    @classmethod
    def delete(cls, url: str) -> None:
        """Remove uma imagem do Supabase a partir da URL pública completa."""
        if not url or not cls.is_configured():
            return
        marcador = f"public/{cls._bucket()}/"
        if marcador not in url:
            return
        path = url.split(marcador)[-1]
        delete_url = f"{cls._base_url()}/object/{cls._bucket()}/{path}"
        try:
            httpx.delete(delete_url, headers=cls._headers(), timeout=cls.TIMEOUT)
        except httpx.HTTPError as exc:
            logger.warning("Falha ao remover imagem do Supabase: %s", exc)
