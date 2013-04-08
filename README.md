# NUNUX Reader

## Installation guide
### Prerequisites

* [git](http://git-scm.com/)
* [nodejs](http://nodejs.org/) v0.6.6
* [redis](http://redis.io/) v2.2

#### Install Git and Redis (on Debian Wheezy)

        aptitude install git redis-server

#### Install Node.JS

See following installation procedure : [https://github.com/joyent/node/wiki/Installation](https://github.com/joyent/node/wiki/Installation)

### Install Web Site

        cd ~/local/var/lib
        git clone git@bitbucket.org:ncarlier/reader.git
        cd reader
        make

### Jobs

*TODO*

### Run Web Site

        #!/bin/sh
        # Optional ENV (default: development)
        export NODE_ENV=production
        # Optional PORT (default: 8081)
        export APP_PORT=8081
        # Run
        node app.js 2>&1 >> app.log

##Models
### Feed model
A feed is stored into HASHES.

KEY: **feed:&lt;HASH&gt;**

The HASH is compute with the feed xml url.

Fields are follows:

- **title**: feed title
- **text**: feed text (in most case same as the title)
- **xmlurl**: feed url (depending the type)
- **htmlurl**: feed html url (in most case the website url)
- **type**: feed type (RSS or ATOM)
- **lastUpdate**: feed last update (set by the update process)

### List of Feeds
The list is stored into a LIST.

KEY: **feeds**

Feeds are append to a LIST (with RPUSH command). A LIST is used instead a SET because we cycle the LIST with RPOPLPUSH command for the update job.

### Article
An article is store into a STRING.

KEY : **feed:&lt;HASH&gt;:&lt;HASH&gt;**

First HASH is the feed one. Second is compute with the article url.

The content is stored as is. Aka is the JSON feed entry.

### List of feed's articles
The list is stored into a LIST (at the begining)

KEY: **feed:&lt;HASH&gt;:articles**

*NOT YET USED*

### Article integration list
This technical list is stored into a LIST.

KEY: **articles:integration**

It's used as a queue to update users "playlist" by a job.

### User
An user is store into HASHES.

KEY : **user:&lt;EMAIL&gt;**

Fields are follows:

- **email**: user email
- **registrationDate**: user registration date

### User subscriptions
The list is stored into a SET.

KEY: **user:&lt;EMAIL&gt;:subscriptions**

*NOT YET USED*

### User playlist
The list is stored into a SORTED SET.

KEY: **user:&lt;EMAIL&gt;:playlist**

The sort score is the article date.

### Feed subscribers
The list is stored into a SET.

KEY: **feed:&lt;HASH&gt;:subscribers**



