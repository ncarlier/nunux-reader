# NUNUX Reader

The super-fast-minimalist-nosql-opensource Google Reader revival.

Features:

 * Faster than light thanks to Redis and Node.js
 * Dynamic GUI thanks to AngularJS
 * Responsive Web Design
 * Login with Google OpenID or Mozilla Persona
 * OPML import/export
 * Manage subscriptions
 * Save articles in Nunux Keeper
 * Keep article as not read
 * Powerfull reactive aggregator daemon
 * Support of PubSubHubbud
 * RESTFul JSON API
 * 100% Javascript!

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
    git clone git@github.com:ncarlier/nunux-reader.git
    cd reader
    npm install

### Run Web Site

    #!/bin/sh
    # See etc/default/reader-server for environment configuration.
    node app.js 2>&1 >> app.log

### Jobs

* **clean-db.js**: Clean database (aka remove old articles). Usage:

        ./bin/clean-db.js -v --days 30

* **feed-updater.js**: Update feeds content. It's a daemon. Use CTRL+C to stop. Usage:

        ./bin/feed-updater.js -v

* **timeline-updater.js**: Update users timelines. It's a daemon. Use CTRL+C to stop. Usage:

        ./bin/timeline-updater.js -v


## API

See *API.md*.


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
