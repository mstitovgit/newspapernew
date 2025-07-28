# Используем образ с Node.js и Python сразу
FROM node:18-bullseye

# Установим Python и pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip curl gnupg2

# Установка emoji-шрифта
RUN apt-get update && \
    apt-get install -y fonts-noto-color-emoji fontconfig
    
# Установка PrinceXML
RUN curl -L https://www.princexml.com/download/prince_16.1-1_debian11_amd64.deb -o prince.deb && \
    apt install -y ./prince.deb && \
    rm prince.deb

# Установка зависимостей проекта
WORKDIR /app

COPY parser/requirements.txt ./parser/requirements.txt
RUN pip install --no-cache-dir -r ./parser/requirements.txt

COPY . .

# Установка Node зависимостей
RUN npm install

# Установка Python зависимостей (если есть requirements.txt)
# Если нет — просто удалим следующую строку
# RUN pip install -r requirements.txt

# Команда, которая будет выполнена при запуске контейнера
CMD bash -c "cd parser && \
    python3 parse_channels.py && \
    cd ../ &&\
    cd scripts &&\
    node generate-html.js && \
    cd ../ &&\
    prince -s generated/style/style.css -s generated/style/fonts.css generated/output.html -o generated/output.pdf && \
    cd sender &&\
    node sender/send.js"

