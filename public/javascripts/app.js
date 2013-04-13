$(function() {
  var $articles = $('#articles');
  var $articleTmpl = $('#article-tmpl').find(">:first-child");
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
        $('header span', $article).text(moment(article.date).format("dddd, MMMM Do YYYY, h:mm:ss"));
        $('p', $article).html(article.description);
        $article.appendTo($articles);
        console.log('Add article ' + article.guid);
      });
    })
    .fail(function(jqxhr, textStatus, error ) {
      var err = textStatus + ', ' + error;
      console.log( "Request Failed: " + err);
    });
  }

  getArticles();
  $(window).scroll(function() {
    if ($(window).scrollTop() == ($(document).height() - $(window).height())) {
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
