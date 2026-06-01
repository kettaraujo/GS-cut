"""Serviço de OCR: seleciona o backend e expõe a leitura de ICCID."""

from django.conf import settings

from .backends import MockOCRBackend, OCRBackendError, OpenAIVisionBackend

__all__ = ["get_ocr_backend", "ler_iccid", "OCRBackendError"]


def get_ocr_backend():
    """Instancia o backend de OCR conforme ``settings.OCR_BACKEND``."""
    backend = (settings.OCR_BACKEND or "mock").lower()
    if backend == "openai":
        return OpenAIVisionBackend()
    if backend == "mock":
        return MockOCRBackend()
    raise OCRBackendError(f"OCR_BACKEND desconhecido: {backend!r}")


def ler_iccid(image_bytes: bytes) -> str:
    """Extrai o ICCID (somente dígitos) de uma imagem usando o backend ativo."""
    return get_ocr_backend().extract(image_bytes)
