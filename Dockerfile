# Nunux Reader Docker image.
#
# VERSION 0.0.1

FROM node:4

MAINTAINER Nicolas Carlier <https://github.com/ncarlier>

# Install packages
RUN apt-get update && apt-get install -y imagemagick

# Create app directories
RUN mkdir -p /usr/src/reader /var/opt/reader

# Setup working directory
WORKDIR /usr/src/reader

# Add package definition
COPY package.json /usr/src/reader/

# Install dependencies
RUN npm install

# Ports
EXPOSE 3000

# Copy sources
COPY . /usr/src/reader

# Install app
RUN npm install

ENTRYPOINT ["/usr/local/bin/npm"]

CMD ["start"]
