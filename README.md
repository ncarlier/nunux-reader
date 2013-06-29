# NUNUX Reader

## Installation guide
### Prerequisites

* [git](http://git-scm.com/)
* [nodejs](http://nodejs.org/) v0.8.x
* [redis](http://redis.io/) v2.2

#### Install Git and Redis (on Debian Wheezy)

        aptitude install git redis-server

#### Install Node.JS

See following installation procedure : [https://github.com/joyent/node/wiki/Installation](https://github.com/joyent/node/wiki/Installation)

### Install Web Site

    cd ~/local/var/lib
    git clone git@bitbucket.org:ncarlier/reader.git
    cd reader
    npm install

### Jobs

* **create-user.js**: Create new user. Usage:

        ./bin/create-user.js nicolas@nunux.org -v

* **import-opml.js**: Import OPML file and add feed to user subscriptions. Usage:

        ./bin/import-opml.js -u nicolas@nunux.org ./data/subscriptions.xml


* **feed-updater.js**: Update feeds content. It's a daemon. Use CTRL+C to stop. Usage:

        ./bin/feed-updater.js -v

* **timeline-updater.js**: Update users timelines. It's a daemon. Use CTRL+C to stop. Usage:

        ./bin/timeline-updater.js -v


### Run Web Site

    #!/bin/sh
    # Optional ENV (default: development)
    export NODE_ENV=production
    # Optional PORT (default: 3000)
    export APP_PORT=8081
    # Run
    node app.js 2>&1 >> app.log

##API
### Get user subscriptions

    GET /subscription HTTP/1.1
    Accept: application/json

    HTTP/1.1
    [
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      ...
    ]

### Add a new subscription

    POST /subscription HTTP/1.1
    Host: <host>
    url=<feed xml url>

    HTTP/1.1 201 OK
    Date: Mon, 1 Jul 2013 00:55:59 GMT
    Content-Type: application/json
    Content-Length: 12345
    Location: <host>/subscription

    {id:"", title:"", xmlurl:"", htmlurl:""}

### Remove a subscription
    
    DELETE /subscription/:id HTTP/1.1
    Host: <host>

    HTTP/1.1 204 OK
    Date: Mon, 1 Jul 2013 00:55:59 GMT
    Content-Length: 0
    Location: <host>/subscription

###Get status of a timeline

    GET /timeline/:timeline/status HTTP/1.1
    Accept: application/json

    HTTP/1.1
    {timeline: "", size: 1, title: "", feed: {}}

###Get status of all timelines

    GET /timeline/status HTTP/1.1
    Accept: application/json

    HTTP/1.1
    [
      {timeline: "", size: 1, title: "", feed: {}},
      {timeline: "", size: 1, title: "", feed: {}},
      ...
    ]

###Get content of a timeline

    GET /timeline/:timeline? HTTP/1.1
    Accept: application/json

    HTTP/1.1
    {
      articles: [
        {
          id: "",
          title: "",
          author: "",
          date: "",
          description: "",
          enclosures: [],
          link: "",
          meta: {}
        },
        ...
      ],
      order: "ASC",
      next: ""
    }

Query string parameters:

 - next: id of the next article in the timeline
 - order: 'ASC' or 'DESC'
 - show: 'new' or 'all'
 - size: size of the window (10 by default)

###Mark an article in the timeline as read

    DELETE /timeline/:timeline/:aid HTTP/1.1
    Host: <host>

    HTTP/1.1 200 OK
    Date: Mon, 1 Jul 2013 00:55:59 GMT
    Content-Length: 1234
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}

###Mark all articles of the timeline as read

    DELETE /timeline/:timeline HTTP/1.1
    Host: <host>

    HTTP/1.1 200 OK
    Date: Mon, 1 Jul 2013 00:55:59 GMT
    Content-Length: 1234
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}


##Models
### Feed model
A feed is stored into HASHES.

KEY: **feed:<HASH>**

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

KEY : **feed:<HASH>:<HASH>**

First HASH is the feed one. Second is compute with the article url.

The content is stored as is. Aka is the JSON feed entry.

### List of feed's articles
The list is stored into a LIST (at the begining)

KEY: **feed:<HASH>:articles**

*NOT YET USED*

### Article integration list
This technical list is stored into a LIST.

KEY: **articles:integration**

It's used as a queue to update users "playlist" by a job.

### User
An user is store into HASHES.

KEY : **user:<EMAIL>**

Fields are follows:

- **email**: user email
- **registrationDate**: user registration date

### User subscriptions
The list is stored into a SET.

KEY: **user:<EMAIL>:subscriptions**

*NOT YET USED*

### User playlist
The list is stored into a SORTED SET.

KEY: **user:<EMAIL>:playlist**

The sort score is the article date.

### Feed subscribers
The list is stored into a SET.

KEY: **feed:<HASH>:subscribers**


