from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('interactions', '0002_block_report'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CommentLike',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('comment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='interactions.comment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comment_likes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'comment')},
            },
        ),
        migrations.CreateModel(
            name='CommentReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.CharField(choices=[('spam', 'Spam'), ('inappropriate', 'Contenu inapproprié'), ('other', 'Autre')], default='inappropriate', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('comment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='interactions.comment')),
                ('reporter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comment_reports_made', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('reporter', 'comment')},
            },
        ),
    ]
