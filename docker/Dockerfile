# Reader Docker image.
#
# VERSION 0.0.1
#
# VOLUME: docker run -v ~/src/reader:/opt/reader -v ~/var/reader:/var/opt/reader -name READER_VOLUMES busybox true
# BUILD:  docker build -rm -t nunux/reader .
# RUN:    docker run -rm -name reader -link redis:db -volumes-from READER_VOLUMES -i -t -p 3001:3001 nunux/reader

FROM nunux/nodejs

MAINTAINER Nicolas Carlier <https://github.com/ncarlier>

# Virtual host (for reverse proxy container)
ENV VIRTUAL_HOST reader.lan
ENV VIRTUAL_PORT 3001

# Env
ENV NODE_ENV development

# Server port
ENV APP_PORT 3000

# Server base URL (Realm)
ENV APP_REALM http://reader.lan

# Automatic grant access
ENV APP_AUTO_GRANT_ACCESS true

# Session secret key
ENV APP_SESSION_SECRET NuNUXReAdR_

# Admin account
ENV APP_ADMIN foo@bar.com

# Number of days to keep an article in the database
ENV APP_DAYS_TO_KEEP 60

# Archive provider
ENV APP_KEEPER_URL http://keeper.lan
ENV APP_KEEPER_KEY 1234
ENV APP_KEEPER_SECRET 1234

EXPOSE 3000

USER node
ENV HOME /home/node

WORKDIR /opt/reader

ENTRYPOINT ["/usr/bin/npm"]

CMD ["start"]
