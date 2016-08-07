.SILENT :
.PHONY : test up down install

USERNAME:=ncarlier
APPNAME:=reader
env?=dev

# Default links
LINK_FLAGS?=--link redis:redis

# Default configuration
ENV_FLAGS?=--env-file="./etc/default/$(env).env" --env-file="./etc/default/custom.env"

# Custom run flags
RUN_CUSTOM_FLAGS?=-p 3000:3000 $(ENV_FLAGS) $(LINK_FLAGS)

# Docker configuartion regarding the system architecture
BASEIMAGE=node:4
UNAME_M := $(shell uname -m)
ifeq ($(UNAME_M),armv7l)
	BASEIMAGE=ncarlier/nodejs-arm
endif

ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

include $(ROOT_DIR)/dockerfiles/common/_Makefile

## Run the container in test mode
test:
	echo "Running tests..."
	$(DOCKER) run --rm -it $(RUN_CUSTOM_FLAGS) $(VOLUME_FLAGS) $(IMAGE) test

## Start a complete infrastucture
up:
	echo "Starting Redis ..."
	make -C $(ROOT_DIR)/dockerfiles/redis stop rm start

## Stop the infrastucture
down:
	echo "Stoping Redis ..."
	make -C $(ROOT_DIR)/dockerfiles/redis stop rm

## Install as a service (needs root privileges)
install: build
	echo "Install as a service..."
	cp etc/systemd/system/* /etc/systemd/system/
	cp etc/default/$(env).env /etc/default/$(APPNAME)
	systemctl daemon-reload
	systemctl enable $(APPNAME)-server
	systemctl restart $(APPNAME)-server
	systemctl enable $(APPNAME)-feed-updater
	systemctl restart $(APPNAME)-feed-updater
	systemctl enable $(APPNAME)-timeline-updater
	systemctl restart $(APPNAME)-timeline-updater
	systemctl enable $(APPNAME)-cleandb
	systemctl restart $(APPNAME)-cleandb
	$(MAKE) cleanup

