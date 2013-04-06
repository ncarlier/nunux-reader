
INCR global:nextFeedId => 1000
// LIST of feeds
RPUSH feeds feed:1000

// rotate cmd for batch update
RPOPLPUSH feeds feeds

HMSET feed:1000 title "bla bla bla" url "..."
HGETALL feed:1000

INCR global:nextEntryId => 1000
// LIST of entries in for a feed
LPUSH feed:1000:entries entry:1000
LTRIM mylist 0 99 // or cleaning by ttl

SET entry:1000 "{...}"
EXPIRE entry:1000 60*60*24*30

// SET of subscriptions for a user
SADD user:foo@bar.com:subscriptions feed:1000 feed:1001 ...
SADD feed:1000:subscribers user:foo@bar.com user:nil@nil.com ...

ZADD user:foo@bar.com:timeline 1234565 entry:1000

// to review
SADD user:foo@bar.com:holds entry:1000 entry:1001 ...
SISMEMBER user:foo@bar.com:holds entry:1000

