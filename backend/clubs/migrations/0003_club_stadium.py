from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clubs', '0002_alter_club_fff_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='club',
            name='stadium',
            field=models.CharField(blank=True, help_text='Adresse complète du stade', max_length=300, null=True),
        ),
    ]
