"""Backends de extração de ICCID a partir de uma imagem.

A interface é simples: ``extract(image_bytes) -> str`` retorna o melhor palpite
de ICCID (apenas dígitos, sem garantia de validade — a validação é feita pelo
``ocr.validation``). Lançar exceção em caso de falha de comunicação.
"""

import base64
import io

from django.conf import settings

from .validation import normalizar

# Lado máximo (px) para o qual a imagem é redimensionada antes de enviar à IA.
# A OpenAII/Gemini reescalam internamente; ~2000px preserva a legibilidade do
# ICCID (texto pequeno) sem inflar o payload.
MAX_LADO_PX = 2000


def preparar_imagem(image_bytes: bytes) -> bytes:
    """Normaliza a imagem antes do OCR.

    - Corrige a rotação a partir do EXIF (fotos de celular vêm deitadas).
    - Converte para RGB/JPEG (cobre PNG, WEBP e variações de celular).
    - Limita a dimensão máxima mantendo o texto legível.

    Em caso de falha (formato exótico), devolve os bytes originais.
    """
    try:
        from PIL import Image, ImageOps

        img = Image.open(io.BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img)  # aplica a rotação do EXIF
        if img.mode != "RGB":
            img = img.convert("RGB")
        if max(img.size) > MAX_LADO_PX:
            img.thumbnail((MAX_LADO_PX, MAX_LADO_PX))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return buf.getvalue()
    except Exception:
        return image_bytes


PROMPT = (
    "A imagem mostra um cartão SIM (chip de celular) de IoT/M2M. "
    "Impresso na peça há um serial numérico, normalmente em dois blocos de "
    "dígitos (ex.: '51702103' e '91614068'). "
    "Junte esses blocos numéricos em uma única sequência, na ordem em que "
    "aparecem (de cima para baixo / da esquerda para a direita). "
    "IGNORE o logotipo e qualquer código com letras (ex.: 'ES5738', nome do "
    "fabricante). "
    "Responda APENAS com os dígitos do serial, sem espaços e sem texto "
    "adicional. Se não houver nenhum número legível, responda exatamente: NONE."
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
        image_bytes = preparar_imagem(image_bytes)
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
                            {
                                "type": "image_url",
                                # detail="high" preserva a resolução para ler o
                                # texto pequeno do ICCID (sem isso a imagem é
                                # reduzida para ~512px e fica ilegível).
                                "image_url": {"url": data_url, "detail": "high"},
                            },
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


class GeminiVisionBackend:
    """Lê o ICCID usando a API de visão do Google Gemini.

    Alternativa gratuita à OpenAI (free tier em aistudio.google.com).
    """

    def __init__(self, api_key=None, model=None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_VISION_MODEL
        if not self.api_key:
            raise OCRBackendError(
                "GEMINI_API_KEY não configurada. Defina no .env ou use OCR_BACKEND=mock."
            )

    def extract(self, image_bytes: bytes) -> str:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)
        image_bytes = preparar_imagem(image_bytes)

        try:
            response = client.models.generate_content(
                model=self.model,
                contents=[
                    PROMPT,
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                ],
                config=types.GenerateContentConfig(temperature=0),
            )
        except Exception as exc:  # erros de rede/API
            raise OCRBackendError(f"Falha ao chamar o Gemini: {exc}") from exc

        texto = (response.text or "").strip()
        if texto.upper() == "NONE":
            return ""
        return normalizar(texto)
