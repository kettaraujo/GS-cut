# SPEC4013: nova ação de auditoria para exclusão de lote.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("audit", "0002_alter_log_acao"),
    ]

    operations = [
        migrations.AlterField(
            model_name="log",
            name="acao",
            field=models.CharField(
                max_length=50,
                choices=[
                    ("criar_lote", "Criar lote"),
                    ("renomear_lote", "Renomear lote"),
                    ("leitura", "Leitura de ICCID"),
                    ("correcao", "Correção manual"),
                    ("remover_chip", "Remover chip"),
                    ("aprovar_lote", "Aprovar lote"),
                    ("cancelar_lote", "Cancelar lote"),
                    ("exclusao_lote", "Excluir lote"),
                    ("exportar", "Exportar lote"),
                ],
            ),
        ),
    ]
