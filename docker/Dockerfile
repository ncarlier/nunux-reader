# Reader Docker image.
#
# VERSION 0.0.1
#
# VOLUME: docker run -v ~/src/reader:/opt/reader -name READER_VOLUMES busybox true
# BUILD:  docker build -rm -t nunux/reader .
# RUN:    docker run -rm -link redis:db -volumes-from READER_VOLUMES -i -t -p 3001:3001 nunux/reader bash
# RUN:    docker run -rm -link redis:db -volumes-from READER_VOLUMES -p 3001:3001 nunux/reader /usr/bin/supervisord

FROM nunux/nodejs

MAINTAINER Nicolas Carlier <https://github.com/ncarlier>

# Env
ENV NODE_ENV development

# Server port
ENV APP_PORT 3001

# Server base URL (Realm)
ENV APP_REALM http://localhost:3001

# Automatic grant access
ENV APP_AUTO_GRANT_ACCESS true

# Session secret key
ENV APP_SESSION_SECRET NuNUXReAdR_

# Admin account
ENV APP_ADMIN foo@bar.com

# Number of days to keep an article in the database
ENV APP_DAYS_TO_KEEP 60

# Archive provider
ENV APP_KEEPER_URL http://localhost:3000
ENV APP_KEEPER_KEY 1234
ENV APP_KEEPER_SECRET 1234

# Add supervisor conf
ADD supervisord.conf  /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3001

#ENTRYPOINT ["/usr/bin/supervisord"]
