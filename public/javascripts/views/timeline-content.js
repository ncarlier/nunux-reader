define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'channel',
       'text!templates/article.html',
       'text!templates/ending.html'
], function($, _, Backbone, moment, channel, articleTpl, endingTpl){
  var cleanArticleContent = function($article, meta) {
      //$('script', $article).not('script[src^="http://www.youtube"]').remove();
      $('.content script', $article).filter('script[src^="http://feeds.feedburner.com"]').remove();
      $('.content a', $article).attr('target', '_blank');
      $('.content img', $article).each(function() {
        var src = $(this).attr('src');
        if(!src.match(/^\s*http/g)) {
          $(this).attr('src', meta.link + '/' + src);
        }
      });
      return $article;
  }

  return Backbone.View.extend({

    events : {
      'change footer input.keep' : "keepUnreadHandler",
      'change footer input.save' : "saveThisHandler"
    },

    options: {
      nextFid:   null,
      loading:   false,
      fetchSize: 10,
      order:     'ASC',
      timeline:  'global',
      isShowingAllItems: false,
    },

    initialize: function() {
      this.$el.scroll(this.handleScrollEvent.bind(this));
      $(document).scroll(this.handleScrollEvent.bind(this));
      channel.on('app.event.timeline.refresh', this.updateOptions.bind(this));
      channel.on('app.event.timeline.markAll', this.updateOptions.bind(this));
      this.updateOptions();
    },

    getTimelineUrl: function() {
      return 'timeline/' + this.options.timeline;
    },

    fetchTimeline: function() {
      if (this.options.nextFid === undefined || this.options.loading) return null;
      this.options.loading = true;

      $.getJSON(this.getTimelineUrl(), {
        next: this.options.nextFid,
        size: this.options.fetchSize,
        order: this.options.order,
        type: this.options.isShowingAllItems ? 'all' : null})
      .done(function(res) {
        $.each(res.articles, function(i, article) {
          article.date = (article.date) ? moment(article.date).format('dddd, MMMM Do YYYY, h:mm:ss') : '(not set)'
          article.fid = 'feed:' + article.id.split(':')[1];
          this.addArticle(article);
        }.bind(this));
        this.options.nextFid = res.next;
        if (!this.options.nextFid) {
          this.addTimelineEnding();
        }
        this.options.loading = false;
      }.bind(this));
    },

    updateOptions: function(options) {
      this.options = _.extend(this.options, options);
      this.options.isReadable = (this.options.timeline !== 'archive' &&
                                 !this.options.isShowingAllItems);
      this.options.nextFid = null;
      this.$el.empty();
      this.fetchTimeline();
    },

    addArticle: function(article) {
      article.isReadable = this.options.isReadable;
      article.isSaved = this.options.timeline == 'archive';
      var $article = $(_.template(articleTpl, article));
      $article = cleanArticleContent($article, article.meta);
      try {
        this.$el.append($article);
      } catch (ex) {
        alert('Bad content: ' + ex);
      }
    },

    addTimelineEnding: function() {
      var $ending = $(_.template(endingTpl, {}));
      this.$el.append($ending);
    },

    handleScrollEvent: function(event) {
      var goFetch = false;
      var $target = $(event.target);
      if (event.target == document) {
        goFetch = $target.scrollTop() + $(window).height() + 100 >= $target.height();
      } else {
        goFetch = $target.scrollTop() + $target.innerHeight() + 100 >= $target[0].scrollHeight;
      }
      if (goFetch) {
        this.fetchTimeline();
      }
      if (this.options.isReadable) this.updateSeenArticles(event);
    },

    updateSeenArticles: function(event) {
      var areaTop = this.$el.offset().top;
      var timeline = this.options.timeline;
      var timelineUrl = this.getTimelineUrl();

      $('article.not-seen', this.$el).each(function() {
        var t = (event.target == document) ? $(document).scrollTop() : areaTop;
        if ($(this).offset().top < t) {
          $(this).removeClass('not-seen').addClass('seen');
          // TODO group ajax calls in a buffered one
          $.ajax({
            url: timelineUrl + '/' + $(this).attr('id'),
            type: 'DELETE',
            dataType: 'json',
            success: function(res) {
              channel.trigger('app.event.timeline.size', res);
            }.bind(this)
          });
        }
      });
    },

    keepUnreadHandler: function(event) {
      var $checkbox = $(event.target);
      var aid = $checkbox.attr('id').split('/')[0];
      var type = $checkbox.is(':checked') ? 'PUT' : 'DELETE';
      var css = $checkbox.is(':checked') ? 'kept-not-seen' : 'seen';
      var timeline = this.options.timeline;
      $.ajax({
        url: 'timeline/' + timeline + '/' + aid,
        type: type,
        dataType: 'json',
        success: function(res) {
          $checkbox.parents('article').attr('class', css);
          channel.trigger('app.event.timeline.size', res);
        }
      });
    },

    saveThisHandler: function(event) {
      var $checkbox = $(event.target);
      var aid = $checkbox.attr('id').split('/')[0];
      var type = $checkbox.is(':checked') ? 'PUT' : 'DELETE';
      $.ajax({
        url: 'timeline/archive/' + aid,
        type: type,
        dataType: 'json',
        success: function(res) {
          res.timeline = 'archive';
          channel.trigger('app.event.timeline.size', res);
        }
      });
    }
  });
});
