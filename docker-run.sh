#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
docker run --name jsbeam \
    -p 127.0.0.1:8090:80 \
    -it --rm \
    -v ${SCRIPT_DIR}/static:/usr/share/nginx/html:ro \
    nginx
