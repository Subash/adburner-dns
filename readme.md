# adburner
Simple DNS based ad blocker with DNS over HTTPS support.

![Dependencies](https://img.shields.io/david/subash/adburner-dns.svg)
![GitHub](https://img.shields.io/github/license/subash/adburner-dns.svg)

## Running
- Install Docker
- Set up static IP and DNS on the device running the adburner server
- Change the DNS on your router to the IP address of the device running the adburner server

### 1. With docker

Set environment variables in .env file. Check below for available configurations.

```shell
docker run -d \
  --env-file .env \
  -p 53:53/udp \
  subash/adburner-dns
```

### 2. With docker-compose

Set environment variables in .env file. Check below for available configurations.

```yaml
services:
  adburner:
    image: "subash/adburner-dns"
    restart: "always"
    env_file: ".env"
    ports:
      - "53:53/udp"
```

## Configuration

By default adburner uses both CloudFlare and Google DNS concurrently and picks whichever is faster.
```
DNS_OVER_HTTPS=true
HTTPS_REMOTE_ADDRESS=https://cloudflare-dns.com/dns-query,https://dns.google.com/experimental
UDP_REMOTE_ADDRESS=1.1.1.1,8.8.8.8
BLOCKED_HOSTS_URL=https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
```
Notes:
1. DNS over HTTPS is only used to query upstream servers. adburner itself can only resolve udp queries.
2. Check https://github.com/StevenBlack/hosts for the list of blocked hosts
