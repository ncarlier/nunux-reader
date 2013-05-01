define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'text!templates/article.html'
], function($, _, Backbone, moment, articleTpl){
  var keepUnreadHandler = function() {
    var id = $(this).attr('id').split('/')[0];
    if ($(this).is(':checked')) {
      var $this = $(this);
      $.ajax({
        url: '/article/' + id,
        type: 'PUT',
        dataType: 'json',
        success: function(res) {
          $this.addClass('keep');
          // TODO $btnAll.text('All items (' + res.total + ')');
        }
      });
    } else {
      $(this).removeClass('keep seen confirm');
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
        // TODO $btnSaved.text('Saved items (' + res.total + ')');
      }
    });
  }

  return Backbone.View.extend({
    options: {
      nextFid: null,
      loading: false,
      fetchSize: 10
    },

    tagName: 'section',

    className: 'article',

    render: function() {
      this.$articles = this.$el;
      this.$articles.scroll(this.handleScrollEvent.bind(this));
      this.fetchTimeline();
    },

    addArticle: function(article) {
      var $article = _.template(articleTpl, article);
      $('footer input.keep', $article).change(keepUnreadHandler);
      $('footer input.save', $article).change(saveThisHandler);
      this.$articles.append($article);
    },

    fetchTimeline: function() {
      if (this.options.nextFid === undefined || this.options.loading) return null;
      this.options.loading = true;

      $.getJSON('article', {
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
      $.getJSON('article/total')
      .done(function(resp) {
        // TODO $btnAll.text('All items (' + resp.total + ')');
        this.options.loading = false;
      }.bind(this));
    },

    handleScrollEvent: function() {
      if (this.$articles.scrollTop() + this.$articles.height() > this.$articles[0].scrollHeight - 100) {
        this.fetchTimeline();
      }
      this.updateSeenArticles();
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
              // TODO $btnAll.text('All items (' + res.total + ')');
            }.bind(this)
          });
        }
      });
    }
  });
});
