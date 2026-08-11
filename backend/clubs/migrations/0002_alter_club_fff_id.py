from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clubs', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='club',
            name='fff_id',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
    ]
