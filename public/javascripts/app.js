$(function() {
  var $articles = $('#articles')
    , $subscriptions = $('#subscriptions')
    , $articleTmpl = $('#article-tmpl').find(">:first-child")
    , $feedTmpl = $('#feed-tmpl').find(">:first-child")
    , $btnSubscriptions = $('#btn-subs')
    , $btnSaved = $('#btn-saved')
    , $btnAll = $('#btn-all');

  var endReached = false
    , loading = false;

  var params = {
    start: null,
    size: 10
  }

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
          $btnAll.text('All items (' + res.total + ')');
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
        $btnSaved.text('Saved items (' + res.total + ')');
      }
    });
  }

  var getArticles = function() {
    if (endReached || loading) return null;
    loading = true;

    $.getJSON('article', params)
    .done(function(res) {
      $.each(res.articles, function(i, article) {
        var $article = $articleTmpl.clone();
        $article.attr('id', article.id);
        $('header a', $article).text(article.title).attr('href', article.link);
        if (article.date) $('header time', $article).text(moment(article.date).format('dddd, MMMM Do YYYY, h:mm:ss'));
        else $('header time', $article).text('(not set)');
        $('header span', $article).text('From ' + article.meta.title + ' by ' + article.author);
        $('div', $article).html(article.description);
        $('footer input.keep', $article).attr('id', article.id + '/keep').change(keepUnreadHandler);
        $('footer input.save', $article).attr('id', article.id + '/save').change(saveThisHandler);
        $('footer label.keep', $article).attr('for', article.id + '/keep');
        $('footer label.save', $article).attr('for', article.id + '/save');
        $article.appendTo($articles);
      });
      if (res.next) {
        params.start = res.next;
      } else {
        endReached = true;
      }
      $.getJSON('article/total')
      .done(function(resp) {
        $btnAll.text('All items (' + resp.total + ')');
        loading = false;
      });

      // Clean DOM
      /*if ($articles.children().size() >= 100) {
        $('#articles article:lt(10)').remove();
      }*/
    });
  }

  var getArchivesSize = function() {
    $.getJSON('archive/total')
    .done(function(res) {
      $btnSaved.text('Saved items (' + res.total + ')');
    });
  }

  var getSubscriptions = function() {
    $.getJSON('subscription')
    .done(function(feeds) {
      $.each(feeds, function(i, feed) {
        var $feed = $feedTmpl.clone();
        $('a', $feed).attr('href', feed.htmlurl).text(feed.title);
        $feed.appendTo($subscriptions);
      });
    });
  }

  $btnSubscriptions.click(function() {
    var $icon = $(this).find('i');
    if ($icon.hasClass('icon-dropdown-open')) {
      $icon.removeClass('icon-dropdown-open').addClass('icon-dropdown-close');
      $subscriptions.hide();
    } else {
      $icon.removeClass('icon-dropdown-close').addClass('icon-dropdown-open');
      $subscriptions.show();
    }
    return false;
  });

  getArticles();
  getArchivesSize();
  getSubscriptions();

  $articles.scroll(function() {
    if ($articles.scrollTop() + $articles.height() > $articles[0].scrollHeight - 100) {
      getArticles();
    }
    var areaHeight = $(this).height();

    $('#articles article').each(function() {
      var top = $(this).position().top;
      var height = $(this).height();

      var visible = !(top + height < 0 || top > areaHeight);
      if (visible && !$(this).hasClass('seen') && !$(this).hasClass('keep')) {
        $(this).addClass('seen');
        var $this = $(this);
        // TODO group ajax calls in a buffered one
        $.ajax({
          url: '/article/' + $(this).attr('id'),
          type: 'DELETE',
          dataType: 'json',
          success: function(res) {
            $this.addClass('confirm');
            $btnAll.text('All items (' + res.total + ')');
          }
        });
      }
    });
  });
});
