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


class ValidarIccidTests(SimpleTestCase):
    def test_iccid_valido(self):
        r = validar_iccid("8955 1701 2000 0000 015")
        self.assertTrue(r.is_valid)
        self.assertEqual(r.iccid, "8955170120000000015")
        self.assertEqual(r.error, "")

    def test_prefixo_invalido(self):
        r = validar_iccid("1255170120000000016")
        self.assertFalse(r.is_valid)
        self.assertIn("89", r.error)

    def test_comprimento_invalido(self):
        r = validar_iccid("8955")
        self.assertFalse(r.is_valid)
        self.assertIn("Comprimento", r.error)

    def test_luhn_invalido(self):
        r = validar_iccid("8955170120000000016")
        self.assertFalse(r.is_valid)
        self.assertIn("Luhn", r.error)

    def test_vazio(self):
        r = validar_iccid("")
        self.assertFalse(r.is_valid)
