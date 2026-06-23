"""Captura de frame de uma câmera IP via snapshot HTTP.

A câmera de bancada (Hikvision/OEM, ex.: 10.0.0.87) expõe um snapshot JPEG no
endpoint ISAPI ``/ISAPI/Streaming/channels/101/picture`` com autenticação
Digest. O servidor busca o frame e entrega os bytes ao fluxo de OCR existente —
sem depender de OpenCV/RTSP nem de a câmera ser acessível pelo navegador.
"""

import logging

import requests
from django.conf import settings
from requests.auth import HTTPBasicAuth, HTTPDigestAuth

logger = logging.getLogger(__name__)


class CameraError(Exception):
    """Falha ao capturar um frame da câmera IP (mensagem amigável ao operador)."""


def snapshot_url() -> str:
    """URL de snapshot configurada, ou o padrão Hikvision/ISAPI a partir do IP."""
    url = (settings.CAMERA_SNAPSHOT_URL or "").strip()
    if url:
        return url
    ip = (settings.CAMERA_IP or "").strip()
    if not ip:
        raise CameraError(
            "Câmera não configurada. Defina CAMERA_IP (ou CAMERA_SNAPSHOT_URL) no .env."
        )
    return f"http://{ip}/ISAPI/Streaming/channels/101/picture"


def capturar_frame(timeout: float | None = None) -> bytes:
    """Busca um JPEG da câmera IP. Lança :class:`CameraError` em qualquer falha.

    ``timeout`` sobrescreve ``settings.CAMERA_TIMEOUT`` (útil no preview, que
    precisa falhar rápido para não travar o polling).
    """
    url = snapshot_url()
    user = settings.CAMERA_USER or ""
    senha = settings.CAMERA_PASSWORD or ""
    timeout = timeout if timeout is not None else settings.CAMERA_TIMEOUT

    try:
        # A câmera usa Digest; se ela responder 401 ao Digest, tenta Basic.
        resp = requests.get(url, auth=HTTPDigestAuth(user, senha), timeout=timeout)
        if resp.status_code == 401:
            resp = requests.get(url, auth=HTTPBasicAuth(user, senha), timeout=timeout)
    except requests.RequestException as exc:
        logger.warning("Falha ao acessar a câmera %s: %s", url, exc)
        raise CameraError(
            "Não foi possível acessar a câmera. Verifique se ela está ligada e na rede."
        ) from exc

    if resp.status_code == 401:
        raise CameraError(
            "A câmera recusou as credenciais (confira CAMERA_USER/CAMERA_PASSWORD no .env)."
        )
    if resp.status_code != 200:
        raise CameraError(f"A câmera retornou HTTP {resp.status_code}.")

    data = resp.content
    content_type = resp.headers.get("Content-Type", "")
    if not data:
        raise CameraError("A câmera retornou uma imagem vazia.")
    if not (data[:3] == b"\xff\xd8\xff" or content_type.startswith("image/")):
        raise CameraError("A resposta da câmera não é uma imagem JPEG.")
    return data
