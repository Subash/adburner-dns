#!/bin/bash
tag="latest"
arch=`uname -m`
[[ $arch == arm* ]] && tag="pi"
docker build -t "subash/adburner-dns:$tag" .
docker push "subash/adburner-dns:$tag"
