#!/bin/bash
TAG="latest"
ARCH=`uname -m`
[[ $ARCH == arm* ]] && TAG="pi"
docker build -t "subash/adburner-dns:$TAG" .
docker push "subash/adburner-dns:$TAG"
