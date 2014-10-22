.SILENT :
.PHONY : volume build clean cleanup run shell test

USERNAME:=ncarlier
APPNAME:=reader
IMAGE:=$(USERNAME)/$(APPNAME)

define docker_run_flags
--rm \
--link redis:db \
--env-file $(PWD)/etc/env.conf \
--dns 172.17.42.1 \
-P \
-i -t
endef

ifdef DEVMODE
	docker_run_flags += --volumes-from $(APPNAME)_volumes
endif

all: build cleanup

volume:
	echo "Building $(APPNAME) volumes..."
	sudo docker run -v $(PWD):/opt/$(APPNAME) -v ~/var/$(APPNAME):/var/opt/$(APPNAME) --name $(APPNAME)_volumes busybox true

build:
	echo "Building $(IMAGE) docker image..."
	sudo docker build --rm -t $(IMAGE) .

clean:
	echo "Removing $(IMAGE) docker image..."
	sudo docker rmi $(IMAGE)

cleanup:
	echo "Removing dangling docker images..."
	-sudo docker images -q --filter 'dangling=true' | xargs sudo docker rmi

run:
	echo "Running $(IMAGE) docker image..."
	sudo docker run $(docker_run_flags) --name $(APPNAME) $(IMAGE)

shell:
	echo "Running $(IMAGE) docker image with shell access..."
	sudo docker run $(docker_run_flags) --entrypoint="/bin/bash" $(IMAGE) -c /bin/bash

test:
	echo "Running tests..."
	sudo docker run $(docker_run_flags) $(IMAGE) test

