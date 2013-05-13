define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'channel',
       'text!templates/article.html'
], function($, _, Backbone, moment, channel, articleTpl){
  var keepUnreadHandler = function() {
    var id = $(this).attr('id').split('/')[0];
    if ($(this).is(':checked')) {
      $.ajax({
        url: '/article/' + id,
        type: 'PUT',
        dataType: 'json',
        success: function(res) {
          $(this).parents('article').addClass('keep');
          res.timeline = 'default'; // FIXME Not generic
          channel.trigger('app.event.timelinesize', res);
        }.bind(this)
      });
    } else {
      $(this).parents('article').removeClass('keep seen confirm');
    }
  }

  var saveThisHandler = function() {
    var id = $(this).attr('id').split('/')[0];
    var type = $(this).is(':checked') ? 'PUT' : 'DELETE';
    $.ajax({
      url: '/archive/' + id,
      type: type,
      dataType: 'json',
      success: function(res) {
        res.timeline = 'archive';
        channel.trigger('app.event.timelinesize', res);
      }
    });
  }

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

  return Backbone.View.extend({

    className: 'slide',

    options: {
      nextFid:   null,
      loading:   false,
      fetchSize: 10,
      timeline:  'default'
    },

    render: function() {
      this.$articles = this.$el;
      this.$articles.scroll(this.handleScrollEvent.bind(this));
      this.$articles.delegate('footer input.keep', 'change', keepUnreadHandler);
      this.$articles.delegate('footer input.save', 'change', saveThisHandler);
      this.fetchTimeline();
      channel.trigger('app.event.timelinechange', {timeline: this.options.timeline});
    },

    refresh: function(options) {
      if (typeof options == 'undefined') options = {};
      this.options.nextFid = null;
      this.options.timeline = options.timeline || 'default';
      this.$articles.empty();
      this.fetchTimeline();
      channel.trigger('app.event.timelinechange', {timeline: this.options.timeline});
    },

    getTimelineUrl: function() {
      return this.options.timeline === 'default' ? 'article' : this.options.timeline;
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
        size: this.options.fetchSize})
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
      $.getJSON(this.getTimelineUrl() + '/total')
      .done(function(resp) {
        resp.timeline = this.options.timeline;
        channel.trigger('app.event.timelinesize', resp);
        this.options.loading = false;
      }.bind(this));
    },

    handleScrollEvent: function() {
      if (this.$articles.scrollTop() + this.$articles.height() > this.$articles[0].scrollHeight - 100) {
        this.fetchTimeline();
      }
      if (this.isReadable()) this.updateSeenArticles();
    },

    updateSeenArticles: function() {
      var areaHeight = this.$el.height();
      var timeline = this.options.timeline;

      $('article', this.$el).each(function() {
        var top = $(this).position().top;
        var height = $(this).height();

        var visible = !(top + height < 0 || top > areaHeight);
        if (visible && !$(this).hasClass('seen') && !$(this).hasClass('keep')) {
          $(this).addClass('seen');
          // TODO group ajax calls in a buffered one
          $.ajax({
            url: '/article/' + $(this).attr('id'),
            type: 'DELETE',
            dataType: 'json',
            success: function(res) {
              $(this).addClass('confirm');
              resp.timeline = timeline;
              channel.trigger('app.event.timelinesize', res);
            }.bind(this)
          });
        }
      });
    }
  });
});
