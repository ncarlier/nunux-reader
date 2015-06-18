.SILENT :
.PHONY : help volume mount build clean cleanup start debug stop rm logs shell test install

USERNAME:=ncarlier
APPNAME:=reader
IMAGE:=$(USERNAME)/$(APPNAME)
env?=dev

define docker_run_flags
--rm \
--link redis:redis \
--env-file="./etc/default/$(env).env" \
--env-file="./etc/default/custom.env" \
--dns 172.17.42.1 \
-P \
-it
endef

DOCKER=docker
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
	DOCKER=sudo docker
endif

all: build cleanup

## This help screen
help:
	printf "Available targets:\n\n"
	awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "%-15s %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

## Make the volume image
volume:
	echo "Building $(APPNAME) volumes..."
	$(DOCKER) run -v $(PWD):/opt/$(APPNAME) -v ~/var/$(APPNAME):/var/opt/$(APPNAME) --name $(APPNAME)_volumes busybox true

## Mount volumes
mount:
	$(eval docker_run_flags += --volumes-from $(APPNAME)_volumes)
	echo "Using volumes from $(APPNAME)_volumes"

## Build the image
build:
	echo "Building $(IMAGE) docker image..."
	$(DOCKER) build --rm -t $(IMAGE) .

## Remove the image
clean:
	echo "Removing $(IMAGE) docker image..."
	-$(DOCKER) rmi $(IMAGE)

## Remove dangling images
cleanup:
	echo "Removing dangling docker images..."
	-$(DOCKER) images -q --filter 'dangling=true' | xargs sudo docker rmi

## Start the container
start:
	echo "Starting $(IMAGE) docker image..."
	$(DOCKER) run $(docker_run_flags) -i --name $(APPNAME) $(IMAGE)

## Run the container in debug mode
debug:
	echo "Running $(IMAGE) docker image in DEBUG mode..."
	$(DOCKER) run $(docker_run_flags) -p 3333:8080 --name $(APPNAME) $(IMAGE) run debug

## Stop the container
stop:
	echo "Stopping container $(APPNAME) ..."
	-$(DOCKER) stop $(APPNAME)

## Delete the container
rm:
	echo "Deleting container $(APPNAME) ..."
	-$(DOCKER) rm $(APPNAME)

## Show container logs
logs:
	echo "Logs of the $(APPNAME) container..."
	$(DOCKER) logs -f $(APPNAME)

## Run the container with shell access
shell:
	echo "Running $(IMAGE) docker image with shell access..."
	$(DOCKER) run $(docker_run_flags) -i --entrypoint="/bin/bash" $(IMAGE) -c /bin/bash

## Run the container in test mode
test:
	echo "Running tests..."
	$(DOCKER) run $(docker_run_flags) $(IMAGE) test

## Install as a service (needs root privileges)
install: build
	echo "Install as a service..."
	cp etc/systemd/system/* /etc/systemd/system/
	cp etc/default/$(env).env /etc/default/$(APPNAME)
	systemctl daemon-reload
	systemctl restart $(APPNAME)
	$(MAKE) cleanup

