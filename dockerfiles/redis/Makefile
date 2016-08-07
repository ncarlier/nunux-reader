.SILENT :
.PHONY : client dump

APPNAME:=redis
IMAGE:=redis:latest

DATE:=`date +%Y-%m-%d`

define RUN_CUSTOM_FLAGS
-P
endef

SHELL_CUSTOM_FLAGS:=-P

ROOT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

include $(ROOT_DIR)/../common/_Makefile

## Run the container in client mode
client:
	echo "Running client of container $(APPNAME) with IP=$(IP)..."
	$(DOCKER) run --rm \
		-it \
		--entrypoint="redis-cli" \
		$(IMAGE) \
		-h $(IP)

## Dump database to disk
dump:
	echo "Dumping container $(APPNAME) data..."
	$(DOCKER) cp $(APPNAME):/var/lib/redis/dump.rdb ./dump.$DATE.rdb

