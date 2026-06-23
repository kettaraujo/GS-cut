from django.test import SimpleTestCase

from .validation import luhn_valido, normalizar, validar_iccid


class NormalizarTests(SimpleTestCase):
    def test_remove_espacos_e_simbolos(self):
        self.assertEqual(normalizar(" 8955 1701-2000 0000 019 "), "8955170120000000019")

    def test_vazio(self):
        self.assertEqual(normalizar(None), "")
        self.assertEqual(normalizar(""), "")


class LuhnTests(SimpleTestCase):
    def test_numero_valido(self):
        self.assertTrue(luhn_valido("8955170120000000015"))

    def test_numero_invalido(self):
        self.assertFalse(luhn_valido("8955170120000000016"))

    def test_nao_digito(self):
        self.assertFalse(luhn_valido("89abc"))


class ValidarSerialTests(SimpleTestCase):
    def test_serial_valido(self):
        # Dois blocos impressos no chip Eseye, concatenados (16 dígitos).
        r = validar_iccid("51702103 91614068")
        self.assertTrue(r.is_valid)
        self.assertEqual(r.iccid, "5170210391614068")
        self.assertEqual(r.error, "")

    def test_ignora_codigo_de_lote(self):
        # Letras (ex.: 'ES') são descartadas pela normalização.
        r = validar_iccid("5170210391614068 ES5738")
        self.assertTrue(r.is_valid)
        self.assertEqual(r.iccid, "51702103916140685738")

    def test_comprimento_curto(self):
        r = validar_iccid("8955")
        self.assertFalse(r.is_valid)
        self.assertIn("Comprimento", r.error)

    def test_comprimento_longo(self):
        r = validar_iccid("1" * 21)
        self.assertFalse(r.is_valid)
        self.assertIn("Comprimento", r.error)

    def test_vazio(self):
        r = validar_iccid("")
        self.assertFalse(r.is_valid)
