# adburner
DNS based ad blocker with DNS over HTTPS support.

## Running

adburner can be run on Raspberry Pi or any other system that can run docker or nodejs.

- Set up static IP for the device running the adburner server
- Change the DNS on the router or your device to the IP address of the device running the adburner server

### 1. By cloning this repository

```shell
git clone https://github.com/Subash/adburner-dns.git
```

Set environment variables in .env file. Check below for available configurations.

```shell
npm install
npm run build
npm run start
```

### 2. With `docker`

Set environment variables in .env file. Check below for available configurations.

```shell
docker run -d \
  --env-file .env \
  -v $PWD/adburner-data:/usr/src/app/data \
  -p 53:53/udp \
  subash/adburner-dns
```

### 3. With `docker-compose`

Set environment variables in .env file. Check below for available configurations.

```yaml
services:
  adburner:
    image: "subash/adburner-dns"  
    restart: "always"
    env_file: ".env"
    volumes:
      - "./adburner-data:/usr/src/app/data"
    ports:
      - "53:53/udp"
```


## Configuration

### 1. Environment variables

Configuration options can be passed as environment variables or stored in a .env file.
By default adburner uses both Cloudflare and Google DNS concurrently and picks whichever is faster.
```
DNS_OVER_HTTPS=true
HTTPS_REMOTE_ADDRESS=https://cloudflare-dns.com/dns-query,https://dns.google.com/experimental
UDP_REMOTE_ADDRESS=1.1.1.1,8.8.8.8
BLOCKED_HOSTS_URL=https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
```
Notes:
1. DNS over HTTPS is only used to query upstream servers. adburner itself can only resolve udp queries.
2. Check https://github.com/StevenBlack/hosts check/change the list of blocked hosts

### 2. Whitelist/Blacklist hosts

Go to the data folder. Usually `data` or `adburner-data` then edit `whitelist.txt` or `blacklist.txt` files. Do not edit the `hosts.txt` file directly.

eg: `whitelist.txt`
```txt
google-analytics.com
*.google-analytics.com
```

This unblocks Google Analytics.

eg: `blacklist.txt`

```
reddit.com
*.reddit.com
```

This blocks Reddit.
