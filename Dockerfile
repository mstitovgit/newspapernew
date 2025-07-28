# Используем образ с Node.js и Python сразу
FROM node:18-bullseye

# Установим Python и pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip curl gnupg2

# Установка PrinceXML
RUN curl -L https://www.princexml.com/download/prince_15.1-1_debian11_amd64.deb -o prince.deb && \
    apt install -y ./prince.deb && \
    rm prince.deb

# Установка зависимостей проекта
WORKDIR /app

COPY parser/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Установка Node зависимостей
RUN npm install

# Установка Python зависимостей (если есть requirements.txt)
# Если нет — просто удалим следующую строку
# RUN pip install -r requirements.txt

# Команда, которая будет выполнена при запуске контейнера
CMD bash -c "python3 parser/parse_channels.py && \
             node scripts/generate-html.js && \
             prince -s generated/style/style.css -s generated/style/fonts.css generated/output.html -o generated/output.pdf && \
             node sender/send.js"

             