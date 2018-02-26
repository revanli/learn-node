/**
 * 简易爬虫，获取cnodejs.org网站首页的标题和链接
 */

// 引入依赖包
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var url = require('url');
var async = require('async');

// 创建express实例
var app = express();
var cnodeUrl = 'https://cnodejs.org/';

app.get('/', function (req, sres) {
  var _result = []

  superagent.get(cnodeUrl)
    .end(function (err, res) {
      // 常规错误处理
      if (err) {
        return console.error(err);
      }
      var topicUrls = [];
      // res.text 储存网页的html内容，传给cheerio.load
      // 之后可以得到一个实现jquery接口的变量
      // cnode每页有40个请求
      var $ = cheerio.load(res.text);
      $('#topic_list .topic_title').each(function (idx, element) {
        var $element = $(element);
        var href = url.resolve(cnodeUrl, $element.attr('href'));
        topicUrls.push(href);
      });

      // 得到一个eventproxy的实例
      var ep = new eventproxy();

      // ep 重复监听topicUrls.length次，'topic_html'事件完成后在接着下一个
      ep.after('topic_html', topicUrls.length, function (topics) {
        topics = topics.map(function (topicPair) {
          var topicUrl = topicPair[0];
          var topicHtml = topicPair[1];
          var $ = cheerio.load(topicHtml);
          return ({
            title: $('.topic_full_title').text().trim(),
            href: topicUrl,
            comment1: $('.reply_content').eq(0).text().trim()
          });
        })
        sres.send(topics)
        console.log('final:');
        console.log(topics);
      });

      var concurrencyCount = 0;
      var fetchUrl = function (url, callback) {
        var delay = parseInt((Math.random() * 10000000) % 2000, 10);
        concurrencyCount++;
        console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');
        superagent.get(url)
          .end(function (err, res) {
            concurrencyCount--;
            callback(null, url + ' html content');
            console.log('fetch ' + url + ' successful');
            ep.emit('topic_html', [url, res.text]);
          })
      };

      // 限制并发数
      async.mapLimit(topicUrls, 5, function (topicUrl, callback) {
        fetchUrl(topicUrl, callback);
      }, function (err, result) {
        console.log('final:');
        console.log(result);
      });
    });
})

app.listen(3000, function () {
  console.log('app listen port at 3000')
})



