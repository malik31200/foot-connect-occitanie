from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_password_reset_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='club_name',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
