define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'channel',
       'text!templates/article.html'
], function($, _, Backbone, moment, channel, articleTpl){
  var cleanArticleContent = function($article, meta) {
      //$('script', $article).not('script[src^="http://www.youtube"]').remove();
      $('script', $article).filter('script[src^="http://feeds.feedburner.com"]').remove();
      $('a', $article).attr('target', '_blank');
      $('img', $article).each(function() {
        var src = $(this).attr('src');
        if(!src.match('^http')) {
          $(this).attr('src', meta.link + '/' + src);
        }
      });
      return $article;
  }

  var elementInViewport = function(el) {
    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    while(el.offsetParent) {
      el = el.offsetParent;
      top += el.offsetTop;
      left += el.offsetLeft;
    }

    return (
      top < (window.pageYOffset + window.innerHeight) &&
      left < (window.pageXOffset + window.innerWidth) &&
      (top + height) > window.pageYOffset &&
      (left + width) > window.pageXOffset
    );
  }

  return Backbone.View.extend({

    className: 'slide',

    options: {
      nextFid:   null,
      loading:   false,
      fetchSize: 10,
      order:     'ASC',
      timeline:  'global'
    },

    render: function() {
      this.$articles = this.$el;
      this.$articles.scroll(this.handleScrollEvent.bind(this));
      $(document).scroll(this.handleScrollEvent.bind(this));
      this.$articles.delegate('footer input.keep', 'change', this.keepUnreadHandler.bind(this));
      this.$articles.delegate('footer input.save', 'change', this.saveThisHandler.bind(this));
      this.fetchTimeline();
      channel.trigger('app.event.timelinechange', {timeline: this.options.timeline});
    },

    refresh: function(options) {
      if (typeof options == 'undefined') options = {};
      this.options.nextFid = null;
      this.options.timeline = options.timeline || 'global';
      this.$articles.empty();
      this.fetchTimeline();
      channel.trigger('app.event.timelinechange', {timeline: this.options.timeline});
    },

    getTimelineUrl: function() {
      return 'timeline/' + this.options.timeline;
    },

    isReadable: function() {
      return this.options.timeline !== 'archive';
    },

    addArticle: function(article) {
      article.isReadable = this.isReadable();
      var $article = $(_.template(articleTpl, article));
      $article = cleanArticleContent($article, article.meta);
      try {
        this.$articles.append($article);
      } catch (ex) {
        alert('Bad content: ' + ex);
      }
    },

    fetchTimeline: function() {
      if (this.options.nextFid === undefined || this.options.loading) return null;
      this.options.loading = true;

      $.getJSON(this.getTimelineUrl(), {
        next: this.options.nextFid,
        size: this.options.fetchSize,
        order: this.options.order})
      .done(function(res) {
        $.each(res.articles, function(i, article) {
          article.date = (article.date) ? moment(article.date).format('dddd, MMMM Do YYYY, h:mm:ss') : '(not set)'
          this.addArticle(article);
        }.bind(this));
        this.options.nextFid = res.next;
        this.fetchTimelineSize();
      }.bind(this));
    },

    fetchTimelineSize: function() {
      this.options.loading = true;
      $.getJSON(this.getTimelineUrl() + '/size')
      .done(function(res) {
        res.timeline = this.options.timeline;
        channel.trigger('app.event.timelinesize', res);
        this.options.loading = false;
      }.bind(this));
    },

    handleScrollEvent: function(event) {
      if (this.$articles.children('.not-seen').length <= 1) {
        //if (this.$articles.scrollTop() + this.$articles.height() > this.$articles[0].scrollHeight - 100) {
        this.fetchTimeline();
      }
      if (this.isReadable()) this.updateSeenArticles(event);
    },

    updateSeenArticles: function(event) {
      var areaHeight = this.$el.height();
      var timeline = this.options.timeline;
      var timelineUrl = this.getTimelineUrl();
      var isVisible = (event.target == document) ? elementInViewport : function(el) {
        var top = $(el).position().top;
        var height = $(el).height();
        return !(top + height < 0 || top > areaHeight);
      };

      $('article.not-seen', this.$el).each(function() {
        if (isVisible(this)) {
          $(this).removeClass('not-seen').addClass('seen');
          // TODO group ajax calls in a buffered one
          $.ajax({
            url: timelineUrl + '/' + $(this).attr('id'),
            type: 'DELETE',
            dataType: 'json',
            success: function(res) {
              res.timeline = timeline;
              channel.trigger('app.event.timelinesize', res);
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
          res.timeline = timeline;
          channel.trigger('app.event.timelinesize', res);
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
          channel.trigger('app.event.timelinesize', res);
        }
      });
    }
  });
});
