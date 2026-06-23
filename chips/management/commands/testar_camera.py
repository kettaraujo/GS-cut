"""Diagnóstico da câmera IP: captura um frame e (opcionalmente) roda o OCR.

Uso:
    python manage.py testar_camera                 # captura e salva camera_frame.jpg
    python manage.py testar_camera --ocr           # captura e tenta ler o ICCID
    python manage.py testar_camera --saida foto.jpg
"""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from core.services.camera import CameraError, capturar_frame, snapshot_url


class Command(BaseCommand):
    help = "Testa a conexão com a câmera IP capturando um snapshot."

    def add_arguments(self, parser):
        parser.add_argument("--saida", default="camera_frame.jpg",
                            help="Arquivo onde salvar o frame capturado.")
        parser.add_argument("--ocr", action="store_true",
                            help="Após capturar, roda o OCR e mostra o ICCID lido.")

    def handle(self, *args, **options):
        self.stdout.write(f"Câmera: {snapshot_url()}")
        self.stdout.write(f"Usuário: {settings.CAMERA_USER or '(vazio)'}")
        try:
            frame = capturar_frame()
        except CameraError as exc:
            raise CommandError(str(exc))

        saida = options["saida"]
        with open(saida, "wb") as fh:
            fh.write(frame)
        self.stdout.write(self.style.SUCCESS(
            f"OK — {len(frame)} bytes capturados e salvos em {saida}."
        ))

        if options["ocr"]:
            from ocr.services import OCRBackendError, ler_iccid
            from ocr.validation import validar_iccid
            try:
                leitura = ler_iccid(frame)
            except OCRBackendError as exc:
                raise CommandError(f"Falha no OCR: {exc}")
            resultado = validar_iccid(leitura)
            self.stdout.write(f"OCR leu: {leitura!r}")
            if resultado.is_valid:
                self.stdout.write(self.style.SUCCESS(f"ICCID válido: {resultado.iccid}"))
            else:
                self.stdout.write(self.style.WARNING(f"ICCID inválido: {resultado.error}"))
