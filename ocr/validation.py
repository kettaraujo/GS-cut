"""Validação do serial impresso no chip (lógica pura, sem dependência de Django).

ATENÇÃO: apesar do nome histórico ``iccid`` (mantido no model e na UI), os chips
em uso (ex.: SIMs Eseye de IoT/M2M) NÃO trazem o ICCID padrão E.118 impresso na
peça — apenas um serial numérico (dois blocos de dígitos, ex.: ``51702103`` e
``91614068``). O que validamos aqui é esse serial:

  - Composto apenas por dígitos (os blocos impressos, concatenados).
  - Comprimento dentro de uma faixa esperada (catch de leituras claramente
    erradas; a conferência fina fica na revisão manual do lote).

Não há prefixo fixo nem dígito verificador (Luhn) nesses seriais, então essas
checagens foram removidas. ``luhn_valido`` permanece como utilitário caso um
formato com checksum volte a ser usado no futuro.
"""

from dataclasses import dataclass

# Faixa de comprimento aceita para o serial (somente dígitos).
# O serial Eseye observado tem 16 dígitos (2 blocos de 8); a faixa tolera
# pequenas variações entre lotes sem deixar passar leituras absurdas.
SERIAL_MIN_LEN = 14
SERIAL_MAX_LEN = 20


@dataclass(frozen=True)
class ValidationResult:
    is_valid: bool
    iccid: str  # valor normalizado (somente dígitos) — serial do chip
    error: str = ""


def normalizar(valor: str) -> str:
    """Remove tudo que não for dígito (descarta espaços e o código de lote ``ES…``)."""
    if not valor:
        return ""
    return "".join(ch for ch in str(valor) if ch.isdigit())


def luhn_valido(numero: str) -> bool:
    """Valida o dígito verificador de Luhn sobre uma string de dígitos.

    Mantido como utilitário; não é aplicado ao serial atual (ver docstring do módulo).
    """
    if not numero or not numero.isdigit():
        return False
    soma = 0
    inverte = False
    for ch in reversed(numero):
        d = int(ch)
        if inverte:
            d *= 2
            if d > 9:
                d -= 9
        soma += d
        inverte = not inverte
    return soma % 10 == 0


def validar_iccid(valor: str) -> ValidationResult:
    """Valida o serial impresso no chip (somente dígitos, comprimento na faixa)."""
    serial = normalizar(valor)

    if not serial:
        return ValidationResult(False, "", "Serial vazio.")
    if not (SERIAL_MIN_LEN <= len(serial) <= SERIAL_MAX_LEN):
        return ValidationResult(
            False, serial,
            f"Comprimento inválido ({len(serial)} dígitos; esperado "
            f"{SERIAL_MIN_LEN}–{SERIAL_MAX_LEN}).",
        )

    return ValidationResult(True, serial, "")
