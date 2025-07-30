import os
import json
import shutil
from datetime import datetime, timedelta
from collections import defaultdict

from telethon.sync import TelegramClient
from telethon.tl.types import (
    MessageEntityUrl,
    MessageEntityTextUrl,
    MessageMediaDocument
)

# 🔐 Вставь свои значения
api_id = 24076122
api_hash = '9a51ca0ccf68fc8752eddbf709d8b25c'
session_name = 'session_maxim'

CHANNELS_FILE = 'channels.json'
MEDIA_FOLDER = 'downloaded_media'

# 📅 Автоматически выбираем вчерашнюю дату
TARGET_DATE = (datetime.now() - timedelta(days=1)).date()


def extract_links(message):
    links = []
    if not message.message or not message.entities:
        return links

    for entity in message.entities:
        if isinstance(entity, MessageEntityUrl):
            text = message.message[entity.offset:entity.offset + entity.length]
            links.append({
                "text": text,
                "url": text,
                "offset": entity.offset,
                "length": entity.length
            })
        elif isinstance(entity, MessageEntityTextUrl):
            text = message.message[entity.offset:entity.offset + entity.length]
            links.append({
                "text": text,
                "url": entity.url,
                "offset": entity.offset,
                "length": entity.length
            })
    return links


async def main():
    # Очищаем и создаём папку для медиа
    if os.path.exists(MEDIA_FOLDER):
        shutil.rmtree(MEDIA_FOLDER)
    os.makedirs(MEDIA_FOLDER, exist_ok=True)

    client = TelegramClient(session_name, api_id, api_hash)
    await client.start()

    with open(CHANNELS_FILE, encoding='utf-8') as f:
        categories_list = json.load(f)

    all_posts = []

    for category_obj in categories_list:
        category = category_obj["category"]
        category_name = category_obj["category_name"]
        channels = category_obj["channels"]

        print(f"Категория: {category} / {category_name}")

        for channel_username in channels:
            print(f"  Парсим канал {channel_username} ...")
            try:
                entity = await client.get_entity(channel_username)
                channel_title = entity.title if hasattr(entity, 'title') else channel_username
            except Exception as e:
                print(f"  Ошибка при получении канала {channel_username}: {e}")
                continue

            offset_id = 0
            while True:
                messages = await client.get_messages(entity, limit=100, offset_id=offset_id)
                if not messages:
                    break

                filtered = [m for m in messages if m.date.date() == TARGET_DATE]

                if not filtered and messages[-1].date.date() < TARGET_DATE:
                    break

                # Группировка сообщений по grouped_id
                grouped_messages = defaultdict(list)
                for msg in filtered:
                    group_id = msg.grouped_id or msg.id
                    grouped_messages[group_id].append(msg)

                for group_id, msgs in grouped_messages.items():
                    media_files = []
                    thumb = None
                    text = ''
                    links = []
                    views = None
                    date = None

                    for msg in msgs:
                        date = msg.date
                        views = msg.views
                        if msg.message and not text:
                            text = msg.message
                            links = extract_links(msg)

                        if msg.media:
                            is_video = False
                            if isinstance(msg.media, MessageMediaDocument):
                                if msg.media.document.mime_type and 'video' in msg.media.document.mime_type:
                                    is_video = True

                            if is_video:
                                pass
                                # if msg.media.document.thumbs:
                                #     thumb_obj = msg.media.document.thumbs[0]
                                #     thumb_path = os.path.join(MEDIA_FOLDER, f"{msg.id}_thumb.jpg")
                                #     await client.download_media(thumb_obj, file=thumb_path)
                                #     thumb = thumb_path
                            else:
                                media_path = await msg.download_media(file=os.path.join(MEDIA_FOLDER, ''))
                                if media_path and not media_path.endswith(('.mp4', '.MP4')):
                                 media_files.append(media_path)
                                else:
                                 print(f"⚠️ Файл с расширением видео проигнорирован: {media_path}")

                    post = {
                        'category': category,
                        'category_name': category_name,
                        'channel': channel_username,
                        'channel_name': channel_title,
                        'id': group_id,
                        'date': date.isoformat() if date else None,
                        'text': text,
                        'links': links,
                        'media': media_files[::-1],
                        'thumb': thumb,
                        'views': views,
                    }

                    all_posts.insert(0, post)

                offset_id = messages[-1].id

    with open('posts.json', 'w', encoding='utf-8') as f:
        json.dump(all_posts, f, ensure_ascii=False, indent=2)

    print(f"Готово. Собрано постов: {len(all_posts)}")


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())