"""Backends de extração de ICCID a partir de uma imagem.

A interface é simples: ``extract(image_bytes) -> str`` retorna o melhor palpite
de ICCID (apenas dígitos, sem garantia de validade — a validação é feita pelo
``ocr.validation``). Lançar exceção em caso de falha de comunicação.
"""

import base64

from django.conf import settings

from .validation import normalizar

PROMPT = (
    "A imagem mostra um cartão SIM (chip de celular). "
    "Localize o número ICCID impresso no chip — ele tem de 19 a 20 dígitos e "
    "começa com 89. Responda APENAS com os dígitos do ICCID, sem espaços, sem "
    "texto adicional. Se não conseguir ler, responda exatamente: NONE."
)


class OCRBackendError(Exception):
    """Falha ao comunicar com o backend de OCR."""


class MockOCRBackend:
    """Backend de desenvolvimento: retorna um ICCID válido fixo.

    Útil para testar o fluxo completo sem custo nem credenciais.
    """

    # ICCID com dígito de Luhn válido (para passar na validação).
    FAKE_ICCID = "8955170120000000015"

    def extract(self, image_bytes: bytes) -> str:
        return self.FAKE_ICCID


class OpenAIVisionBackend:
    """Lê o ICCID usando a API de visão da OpenAI."""

    def __init__(self, api_key=None, model=None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_VISION_MODEL
        if not self.api_key:
            raise OCRBackendError(
                "OPENAI_API_KEY não configurada. Defina no .env ou use OCR_BACKEND=mock."
            )

    def extract(self, image_bytes: bytes) -> str:
        from openai import OpenAI

        client = OpenAI(api_key=self.api_key)
        b64 = base64.b64encode(image_bytes).decode("ascii")
        data_url = f"data:image/jpeg;base64,{b64}"

        try:
            response = client.chat.completions.create(
                model=self.model,
                temperature=0,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": PROMPT},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }
                ],
            )
        except Exception as exc:  # erros de rede/API
            raise OCRBackendError(f"Falha ao chamar a OpenAI: {exc}") from exc

        texto = (response.choices[0].message.content or "").strip()
        if texto.upper() == "NONE":
            return ""
        return normalizar(texto)
