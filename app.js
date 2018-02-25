/**
 * 简易爬虫，获取cnodejs.org网站首页的标题和链接
 */

// 引入依赖包
var express = require('express');
var superagent = require('superagent');
var cheerio = require('cheerio');

// 创建express实例
var app = express();

app.get('/', function (req, res, next) {
  superagent.get('https://cnodejs.org/')
    .end(function (err, sres) {
      // 常规错误处理
      if (err) {
        return next(err);
      }
      // sres.text 储存网页的html内容，传给cheerio.load
      // 之后可以得到一个实现jquery接口的变量
      var $ = cheerio.load(sres.text);
      var items = [];
      $('#topic_list .topic_title').each(function (idx, element) {
        var $element = $(element);
        items.push({
          title: $element.attr('title'),
          href: $element.attr('href')
        })
      });

      res.send(items)
    });
});

app.listen(3000, function () {
  console.log('app is listening at port 3000')
});