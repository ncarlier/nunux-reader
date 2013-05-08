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
        channel.trigger('app.event.archivesize', res);
      }
    });
  }

  return Backbone.View.extend({

    className: 'slide',

    options: {
      nextFid: null,
      loading: false,
      fetchSize: 10,
      archive: false
    },

    render: function() {
      this.$articles = this.$el;
      this.$articles.scroll(this.handleScrollEvent.bind(this));
      if (this.isTimeline()) {
        this.$articles.delegate('footer input.keep', 'change', keepUnreadHandler);
      }
      this.$articles.delegate('footer input.save', 'change', saveThisHandler);
      this.fetchTimeline();
    },

    getUrl: function() {
      return this.isTimeline() ? 'article' : 'archive';
    },

    isTimeline: function() {
      return !this.options.archive;
    },

    addArticle: function(article) {
      article.isTimeline = this.isTimeline();
      var $article = _.template(articleTpl, article);
      this.$articles.append($article);
    },

    fetchTimeline: function() {
      if (this.options.nextFid === undefined || this.options.loading) return null;
      this.options.loading = true;

      $.getJSON(this.getUrl(), {
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
      $.getJSON(this.getUrl() + '/total')
      .done(function(resp) {
        if (this.isTimeline()) channel.trigger('app.event.timelinesize', resp);
        else channel.trigger('app.event.archivesize', resp);
        this.options.loading = false;
      }.bind(this));
    },

    handleScrollEvent: function() {
      if (this.$articles.scrollTop() + this.$articles.height() > this.$articles[0].scrollHeight - 100) {
        this.fetchTimeline();
      }
      if (this.isTimeline()) this.updateSeenArticles();
    },

    updateSeenArticles: function() {
      var areaHeight = this.$el.height();

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
              channel.trigger('app.event.timelinesize', res);
            }.bind(this)
          });
        }
      });
    }
  });
});
