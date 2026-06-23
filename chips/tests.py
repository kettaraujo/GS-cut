import io

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.urls import reverse

from chips.models import Chip
from chips.services import processar_captura
from lotes.models import Lote
from lotes.services import aprovar_lote, criar_lote, excluir_lote


def imagem_fake():
    """Gera os bytes de um PNG mínimo via Pillow."""
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "white").save(buf, format="PNG")
    buf.seek(0)
    return buf


@override_settings(OCR_BACKEND="mock")
class FluxoLoteTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("operador", password="senha12345")
        self.client.login(username="operador", password="senha12345")

    def test_fluxo_completo(self):
        # Criar lote
        lote = criar_lote("Lote teste", self.user)
        self.assertEqual(lote.status, Lote.Status.ABERTO)

        # Ler chip (mock retorna ICCID válido)
        from django.core.files.uploadedfile import SimpleUploadedFile

        upload = SimpleUploadedFile("chip.png", imagem_fake().read(), "image/png")
        resultado = processar_captura(lote, upload, self.user)

        self.assertTrue(resultado["sucesso"])
        self.assertEqual(resultado["iccid"], "8955170120000000015")

        lote.refresh_from_db()
        self.assertEqual(lote.status, Lote.Status.EM_REVISAO)
        self.assertEqual(lote.quantidade, 1)

        # Aprovar
        aprovar_lote(lote, self.user)
        lote.refresh_from_db()
        self.assertEqual(lote.status, Lote.Status.APROVADO)
        self.assertFalse(lote.editavel)

        chip = lote.chips.first()
        self.assertEqual(chip.status_revisao, Chip.StatusRevisao.APROVADO)

    def test_export_excel_responde(self):
        lote = criar_lote("Lote export", self.user)
        from django.core.files.uploadedfile import SimpleUploadedFile

        upload = SimpleUploadedFile("chip.png", imagem_fake().read(), "image/png")
        processar_captura(lote, upload, self.user)

        resp = self.client.get(reverse("exports:lote_excel", args=[lote.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertIn("spreadsheetml", resp["Content-Type"])

    def test_dashboard_carrega(self):
        resp = self.client.get(reverse("dashboard:home"))
        self.assertEqual(resp.status_code, 200)

    def _lote_com_chip(self, nome="Lote SPEC4"):
        from django.core.files.uploadedfile import SimpleUploadedFile

        lote = criar_lote(nome, self.user)
        upload = SimpleUploadedFile("chip.png", imagem_fake().read(), "image/png")
        processar_captura(lote, upload, self.user)
        return lote

    def test_revisao_e_confirmacao(self):
        lote = self._lote_com_chip()
        self.assertEqual(self.client.get(
            reverse("chips:revisao", args=[lote.id])).status_code, 200)
        resp = self.client.post(reverse("chips:revisao_confirmar", args=[lote.id]))
        self.assertRedirects(resp, reverse("lotes:review", args=[lote.id]))
        lote.refresh_from_db()
        self.assertEqual(lote.status, Lote.Status.EM_REVISAO)

    def test_excluir_lote_soft_delete(self):
        lote = self._lote_com_chip()
        excluir_lote(lote, self.user)
        lote.refresh_from_db()
        self.assertFalse(lote.is_active)
        self.assertEqual(lote.chips.filter(is_active=True).count(), 0)

    def test_excluir_lote_aprovado_bloqueado(self):
        from django.core.exceptions import ValidationError

        lote = self._lote_com_chip()
        aprovar_lote(lote, self.user)
        with self.assertRaises(ValidationError):
            excluir_lote(lote, self.user)
        lote.refresh_from_db()
        self.assertTrue(lote.is_active)
