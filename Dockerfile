# Nunux Reader Docker image.
#
# VERSION 0.0.1

FROM node:4-onbuild

MAINTAINER Nicolas Carlier <https://github.com/ncarlier>

# Ports
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/npm"]

CMD ["start"]
