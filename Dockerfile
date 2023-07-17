FROM clearlinux/node:18

WORKDIR /app

COPY . .

RUN npm i

RUN swupd bundle-add ghostscript && \
    swupd bundle-add ImageMagick && \
    swupd bundle-add poppler
