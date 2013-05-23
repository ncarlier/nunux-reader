define([
       'jquery',
       'underscore',
       'backbone',
       'moment',
       'channel',
       'text!templates/timeline.html',
       'text!templates/article.html'
], function($, _, Backbone, moment, channel, tpl, articleTpl){
  var cleanArticleContent = function($article, meta) {
      //$('script', $article).not('script[src^="http://www.youtube"]').remove();
      $('.content script', $article).filter('script[src^="http://feeds.feedburner.com"]').remove();
      $('.content a', $article).attr('target', '_blank');
      $('.content img', $article).each(function() {
        var src = $(this).attr('src');
        if(!src.match('^http')) {
          $(this).attr('src', meta.link + '/' + src);
        }
      });
      return $article;
  }

  return Backbone.View.extend({

    className: 'timeline',

    options: {
      nextFid:   null,
      loading:   false,
      fetchSize: 10,
      order:     'ASC',
      timeline:  'global'
    },

    render: function() {
      this.$el.html(_.template(tpl, {}));
      this.$articles = $('.content', this.$el);
      this.$menu = $('.menu', this.$el);
      this.$articles.scroll(this.handleScrollEvent.bind(this));
      $(document).scroll(this.handleScrollEvent.bind(this));
      this.$articles.delegate('footer input.keep', 'change', this.keepUnreadHandler.bind(this));
      this.$articles.delegate('footer input.save', 'change', this.saveThisHandler.bind(this));
      $('button.sort-items', this.$menu).click(this.sortItemsHandler.bind(this));
      $('button.mark-items', this.$menu).click(this.markAllItemsHandler.bind(this));
      this.refresh();
    },

    refresh: function(options) {
      if (typeof options == 'undefined') options = {};
      this.options = _.extend(this.options, options);
      this.options.nextFid = null;
      this.$articles.empty();
      this.fetchTimeline();
      var title = (this.options.timeline === 'global') ? 'All items' :
        (this.options.timeline === 'archive') ? 'Saved items' : 'Feed items';
      $('h1', this.$menu).text(title);
      $('button.sort-items', this.$menu).text(this.options.order === 'ASC' ? 'Sort by newest' : 'Sort by oldest');
      $('button.mark-items', this.$menu).toggle(this.options.timeline != 'archive');
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
          article.fid = 'feed:' + article.id.split(':')[1];
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
        this.fetchTimeline();
      }
      if (this.isReadable()) this.updateSeenArticles(event);
    },

    updateSeenArticles: function(event) {
      var areaTop = this.$articles.offset().top;
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
    },
    sortItemsHandler: function(event) {
      var options = {
        order: (this.options.order === 'ASC') ? 'DESC' : 'ASC'
      }
      this.refresh(options);

      return false;
    },
    showItemsHandler: function(event) {
      alert('Show all items not yet implemented');
      return false;
    },
    markAllItemsHandler: function(event) {
      if (confirm('Do you really want to mark all items as read ?')) {
        // todo
        $.ajax({
          url: this.getTimelineUrl(),
          type: 'DELETE',
          dataType: 'json',
          success: function(res) {
            this.refresh();
          }.bind(this)
        });
      }
      return false;
    }
  });
});
