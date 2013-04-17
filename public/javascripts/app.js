$(function() {
  var $articles = $('#articles')
    , $subscriptions = $('#subscriptions')
    , $articleTmpl = $('#article-tmpl').find(">:first-child")
    , $feedTmpl = $('#feed-tmpl').find(">:first-child")
    , $btnSubscriptions = $('#btn-subs')
    , $btnAll = $('#btn-all');

  var params = {
    offset: 0,
    size: 10
  }
  var getArticles = function() {
    $.getJSON('article', params)
    .done(function(articles) {
      $.each(articles, function(i, article) {
        var $article = $articleTmpl.clone();
        $('header a', $article).text(article.title).attr('href', article.link);
        $('header time', $article).text(moment(article.date).format("dddd, MMMM Do YYYY, h:mm:ss"));
        $('header span', $article).text('From ' + article.meta.title + ' by ' + article.author);
        $('p', $article).html(article.description);
        $article.appendTo($articles);
      });
    });
    $.getJSON('article/total')
    .done(function(res) {
      $btnAll.text('All items (' + res.total + ')');
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
  getSubscriptions();

  $articles.scroll(function() {
    if ($articles.scrollTop() + $articles.height() > $articles[0].scrollHeight - 100) {
      params.offset += params.size;
      getArticles();
    }
    var areaHeight = $(this).height();

    $('#articles article').each(function() {
      var top = $(this).position().top;
      var height = $(this).height();

      var visible = !(top + height < 0 || top > areaHeight);
      $(this).toggleClass('visible', visible);
    });
  });
});
