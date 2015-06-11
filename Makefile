.SILENT :
.PHONY : help volume dev build clean cleanup start debug stop rm logs shell test publish

USERNAME:=ncarlier
APPNAME:=reader
IMAGE:=$(USERNAME)/$(APPNAME)

define docker_run_flags
--rm \
--link redis:redis \
--env-file etc/env.conf \
--dns 172.17.42.1 \
-P \
-t
endef

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
	sudo docker run -v $(PWD):/opt/$(APPNAME) -v ~/var/$(APPNAME):/var/opt/$(APPNAME) --name $(APPNAME)_volumes busybox true

## Enable DEVMODE (mount volumes)
dev:
	$(eval docker_run_flags += --volumes-from $(APPNAME)_volumes)
	echo "DEVMODE: Using volumes from $(APPNAME)_volumes"

## Build the image
build:
	echo "Building $(IMAGE) docker image..."
	sudo docker build --rm -t $(IMAGE) .

## Remove the image
clean:
	echo "Removing $(IMAGE) docker image..."
	-sudo docker rmi $(IMAGE)

## Remove dangling images
cleanup:
	echo "Removing dangling docker images..."
	-sudo docker images -q --filter 'dangling=true' | xargs sudo docker rmi

## Start the container
start:
	echo "Starting $(IMAGE) docker image..."
	sudo docker run $(docker_run_flags) -i --name $(APPNAME) $(IMAGE)

## Run the container in debug mode
debug:
	echo "Running $(IMAGE) docker image in DEBUG mode..."
	sudo docker run $(docker_run_flags) -p 3333:8080 --name $(APPNAME) $(IMAGE) run debug

## Stop the container
stop:
	echo "Stopping container $(APPNAME) ..."
	-sudo docker stop $(APPNAME)

## Delete the container
rm:
	echo "Deleting container $(APPNAME) ..."
	-sudo docker rm $(APPNAME)

## Show container logs
logs:
	echo "Logs of the $(APPNAME) container..."
	sudo docker logs -f $(APPNAME)

## Run the container with shell access
shell:
	echo "Running $(IMAGE) docker image with shell access..."
	sudo docker run $(docker_run_flags) -i --entrypoint="/bin/bash" $(IMAGE) -c /bin/bash

## Run the container in test mode
test:
	echo "Running tests..."
	sudo docker run $(docker_run_flags) $(IMAGE) test

## Publish the image to private registry
publish:
	ifndef REGISTRY
		$(error REGISTRY is undefined)
	else
		echo "Publish image into the registry..."
		sudo docker tag $(IMAGE) $(REGISTRY)/$(IMAGE)
		sudo docker push $(REGISTRY)/$(IMAGE)
	endif
