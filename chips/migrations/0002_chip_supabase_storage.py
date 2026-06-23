# Migração SPEC3002: imagens deixam o disco local e passam a viver no Supabase
# Storage. Os ImageField viram URLField guardando apenas a URL pública.
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chips", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="chip",
            old_name="imagem",
            new_name="imagem_url",
        ),
        migrations.RenameField(
            model_name="chip",
            old_name="imagem_tentativa_2",
            new_name="imagem_tentativa_2_url",
        ),
        migrations.AlterField(
            model_name="chip",
            name="imagem_url",
            field=models.URLField(
                blank=True,
                null=True,
                max_length=500,
                help_text="URL pública da imagem no Supabase Storage",
            ),
        ),
        migrations.AlterField(
            model_name="chip",
            name="imagem_tentativa_2_url",
            field=models.URLField(
                blank=True,
                null=True,
                max_length=500,
                help_text="URL da 2ª tentativa no Supabase Storage",
            ),
        ),
    ]
