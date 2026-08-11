from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='team',
            name='fff_id',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
    ]
