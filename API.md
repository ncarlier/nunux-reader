# NUNUX Reader API

## Get user subscriptions

    GET /api/subscription HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    [
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      ...
    ]

## Export user subscriptions as OPML file.

    GET /api/subscription/export HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/octet-stream
    attachment: subscribtions.xml

## Import user subscriptions with OPML file.

    POST /api/subscription HTTP/1.1
    file=<OPML File>

    HTTP/1.1 201
    Content-Type: application/json
    [
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      {id:"", title:"", xmlurl:"", htmlurl:"", status="", updateDate=""},
      ...
    ]

## Add a new subscription

    POST /api/subscription HTTP/1.1
    url=<feed xml url>

    HTTP/1.1 201
    Content-Type: application/json
    {id:"", title:"", xmlurl:"", htmlurl:""}

## Remove a subscription

    DELETE /api/subscription/:id HTTP/1.1

    HTTP/1.1 204

## Get status of a timeline

    GET /api/timeline/:timeline/status HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}

## Get all timelines

    GET /api/timeline HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    [
      {timeline: "", size: 1, title: "", feed: {}},
      {timeline: "", size: 1, title: "", feed: {}},
      ...
    ]

## Get content of a timeline

    GET /api/timeline/:timeline? HTTP/1.1

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

## Mark an article in the timeline as read

    DELETE /api/timeline/:timeline/:aid HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}

## Mark all articles of the timeline as read

    DELETE /api/timeline/:timeline HTTP/1.1

    HTTP/1.1 200
    Content-Type: application/json
    {timeline: "", size: 1, title: "", feed: {}}


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
