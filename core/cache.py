"""Cache versionado, agnóstico de backend.

O ``cache.delete_pattern`` da spec só existe no ``django-redis``. Em dev usamos
``LocMemCache``, então a invalidação é feita por **versionamento**: toda chave
inclui um número de versão; ao modificar dados (signals), ``bump_version()``
incrementa esse número e todas as chaves antigas deixam de ser alcançadas —
efeito equivalente a apagar tudo, sem depender do backend.
"""

from django.core.cache import cache

VERSION_KEY = "chipcut:cache_version"


def _version() -> int:
    versao = cache.get(VERSION_KEY)
    if versao is None:
        versao = 1
        cache.set(VERSION_KEY, versao, None)  # timeout None = nunca expira
    return versao


def bump_version() -> int:
    """Invalida logicamente todo o cache versionado (incrementa a versão)."""
    try:
        return cache.incr(VERSION_KEY)
    except ValueError:  # chave ainda não existe
        cache.set(VERSION_KEY, 1, None)
        return 1


def versioned_key(prefix: str, *parts) -> str:
    """Monta uma chave de cache incluindo a versão atual."""
    sufixo = ":".join(str(p) for p in parts if p not in (None, ""))
    base = f"{prefix}:v{_version()}"
    return f"{base}:{sufixo}" if sufixo else base


def get_or_set_versioned(prefix: str, parts, fn, timeout: int):
    """``cache.get_or_set`` usando uma chave versionada."""
    return cache.get_or_set(versioned_key(prefix, *parts), fn, timeout)
