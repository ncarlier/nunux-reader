# NUNUX Reader

The super-fast-minimalist-nosql-opensource Google Reader revival.

Features:

 * Faster than light thanks to Redis and Node.js
 * Dynamic GUI thanks to AngularJS 
 * Responsive Web Design
 * Login with Google OpenID or Mozilla Persona
 * OPML import/export
 * Manage subscriptions
 * Auto read article on scroll
 * Save articles
 * Keep article as not read
 * Powerfull ireactive aggregator daemon (no cron job)
 * RESTFul JSON API
 * 99% Javascript!

## Installation guide
### Prerequisites

* [git](http://git-scm.com/)
* [nodejs](http://nodejs.org/) v0.8.x
* [redis](http://redis.io/) v2.2

#### Install Git and Redis (on Debian Wheezy)

        sudo aptitude install git redis-server

#### Install Node.JS

See following installation procedure : [https://github.com/joyent/node/wiki/Installation](https://github.com/joyent/node/wiki/Installation)

#### Install Grunt

        sudo npm install -g grunt-cli

### Install Web Site

    cd ~/local/var/lib
    git clone git@bitbucket.org:ncarlier/reader.git
    cd reader
    npm install

### Jobs

* **clean-db.js**: Clean database (aka remove old articles). Usage:

        ./bin/clean-db.js -v --days 30

* **create-user.js**: Create new user. Usage:

        ./bin/create-user.js foo@bar.com -v

* **import-opml.js**: Import OPML file and add feed to user subscriptions. Usage:

        ./bin/import-opml.js -u foo@bar.com ./data/subscriptions.xml

* **feed-updater.js**: Update feeds content. It's a daemon. Use CTRL+C to stop. Usage:

        ./bin/feed-updater.js -v

* **timeline-updater.js**: Update users timelines. It's a daemon. Use CTRL+C to stop. Usage:

        ./bin/timeline-updater.js -v


### Run Web Site

    #!/bin/sh
    # See etc/default/reader-server for environment configuration.
    node app.js 2>&1 >> app.log

##API
### Get user subscriptions

    GET /subscription HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    [
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      ...
    ]

### Export user subscriptions as OPML file.

    GET /subscription/export HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/octet-stream
    attachment: subscribtions.xml

### Import user subscriptions with OPML file.

    POST /subscription HTTP/1.1
    file=<OPML File>

    HTTP/1.1 201
    Content-Type: application/json
    [
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      ...
    ]

### Add a new subscription

    POST /subscription HTTP/1.1
    url=<feed xml url>

    HTTP/1.1 201
    Content-Type: application/json
    {id:"", title:"", xmlurl:"", htmlurl:""}

### Remove a subscription

    DELETE /subscription/:id HTTP/1.1

    HTTP/1.1 204

### Get status of a timeline

    GET /timeline/:timeline/status HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}

### Get all timelines

    GET /timeline HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    [
      {timeline: "", size: 1, title: "", feed: {}},
      {timeline: "", size: 1, title: "", feed: {}},
      ...
    ]

### Get content of a timeline

    GET /timeline/:timeline? HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
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

### Mark an article in the timeline as read

    DELETE /timeline/:timeline/:aid HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}

### Mark all articles of the timeline as read

    DELETE /timeline/:timeline HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}


## Models
### Feed model
A feed is stored into HASHES.

KEY: **feed:<HASH>**

The HASH is compute with the feed xml url.

Fields are follows:

- **title**: feed title
- **description**: feed text (in most case same as the title)
- **xmlurl**: feed url (depending the type)
- **htmlurl**: feed html url (in most case the website url)
- **hub**: HUB url (if PubSubHubBud compliant)
- **updateDate**: feed last update (set by the update process)
- **status**: status of the last update process
- **...**: and other technicals fields

### List of Feeds
The list is stored into a LIST.

KEY: **feeds**

Feeds are append to a LIST (with RPUSH command). A LIST is used instead a SET because we cycle the LIST with RPOPLPUSH command for the update job.

### Article
An article is store into a STRING.

KEY : **feed:<HASH>:<HASH>**

First HASH is the feed one. Second is compute with the article url.

The content is stored as is. Aka is the JSON string format.

### Feed's timeline (aka feed articles)
The timeline is stored into a SORTED SET.

KEY: **feed:<HASH>:articles**

The sort score is the article date.
An entry is a key that referred an Article.

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

An entry is a key that referred a Feed.

### User global timeline
The timeline is stored into a SORTED SET.

KEY: **user:<EMAIL>:global**

The sort score is the article date.
An entry is a key that referred an Article.

### User archive timeline
The timeline is stored into a SORTED SET.

KEY: **user:<EMAIL>:archive**

An entry is a key that referred an saved Article (aka an article with a user prefixed key).

### User feed timeline
The timeline is stored into a SORTED SET.

KEY: **user:<EMAIL>:feed:<HASH>**

### Feed subscribers
The list is stored into a SET.

KEY: **feed:<HASH>:subscribers**

------------------------------------------------------------------------------

NUNUX Reader

Copyright (c) 2013 Nicolas CARLIER (https://github.com/ncarlier)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

------------------------------------------------------------------------------
