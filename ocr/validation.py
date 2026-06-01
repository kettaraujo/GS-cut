"""Validação de ICCID (lógica pura, sem dependência de Django).

Um ICCID segue o padrão ITU-T E.118:
  - Composto apenas por dígitos (frequentemente impresso com espaços).
  - Começa com "89" (Major Industry Identifier de telecomunicações).
  - Possui de 19 a 20 dígitos, sendo o último um dígito verificador de Luhn.
"""

from dataclasses import dataclass

ICCID_MIN_LEN = 19
ICCID_MAX_LEN = 20
ICCID_PREFIX = "89"


@dataclass(frozen=True)
class ValidationResult:
    is_valid: bool
    iccid: str  # valor normalizado (somente dígitos)
    error: str = ""


def normalizar(valor: str) -> str:
    """Remove tudo que não for dígito."""
    if not valor:
        return ""
    return "".join(ch for ch in str(valor) if ch.isdigit())


def luhn_valido(numero: str) -> bool:
    """Valida o dígito verificador de Luhn sobre uma string de dígitos."""
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
    """Valida formato, prefixo, comprimento e checksum de Luhn do ICCID."""
    iccid = normalizar(valor)

    if not iccid:
        return ValidationResult(False, "", "ICCID vazio.")
    if not (ICCID_MIN_LEN <= len(iccid) <= ICCID_MAX_LEN):
        return ValidationResult(
            False, iccid,
            f"Comprimento inválido ({len(iccid)} dígitos; esperado "
            f"{ICCID_MIN_LEN}–{ICCID_MAX_LEN}).",
        )
    if not iccid.startswith(ICCID_PREFIX):
        return ValidationResult(False, iccid, "ICCID deve começar com '89'.")
    if not luhn_valido(iccid):
        return ValidationResult(False, iccid, "Dígito verificador (Luhn) inválido.")

    return ValidationResult(True, iccid, "")
