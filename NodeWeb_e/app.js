// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;

// 这句的意思就是引入 `express` 模块，并将它赋予 `express` 这个变量等待使用。
var express = require('express');
// 调用 express 实例，它是一个函数，不带参数调用时，会返回一个 express 实例，将这个变量赋予 app 变量。
var app = express();
var addon = require('helloAddon');
var utility = require('utility');
const cheerio = require('cheerio');
const superagent = require('superagent');
var eventproxy = require('eventproxy');
// url 模块是 Node.js 标准库里面的
// http://nodejs.org/api/url.html
var url = require('url');


// app 本身有很多方法，其中包括最常用的 get、post、put/patch、delete，
// 在这里我们调用其中的 get 方法，为我们的 `/` 路径指定一个 handler 函数。
// 这个 handler 函数会接收 req 和 res 两个对象，他们分别是请求的 request 和 response。
// request 中包含了浏览器传来的各种信息，比如 query 啊，body 啊，headers 啊之类的，都可以通过 req 对象访问到。
// res 对象，我们一般不从里面取信息，而是通过它来定制我们向浏览器输出的信息，比如 header 信息
// ，比如想要向浏览器输出的内容。这里我们调用了它的 #end 方法，向浏览器输出一个字符串。
/*
app.get('/', function (req, res) {
  res.send(addon.helloAddon());
});
*/

/*
app.get('/', function (req, res) {
  // 从 req.query 中取出我们的 q 参数。
  // 如果是 post 传来的 body 数据，则是在 req.body 里面，不过 express 默认不处理 body 中的信息，需要引入 https://github.com/expressjs/body-parser 这个中间件才会处理，这个后面会讲到。
  // 如果分不清什么是 query，什么是 body 的话，那就需要补一下 http 的知识了
  var q = req.query.q;

  // 调用 utility.md5 方法，得到 md5 之后的值
  // 之所以使用 utility 这个库来生成 md5 值，其实只是习惯问题。每个人都有自己习惯的技术堆栈，
  // 我刚入职阿里的时候跟着苏千和朴灵混，所以也混到了不少他们的技术堆栈，仅此而已。
  // utility 的 github 地址：https://github.com/node-modules/utility
  // 里面定义了很多常用且比较杂的辅助方法，可以去看看
  var md5Value = utility.md5(q);

  res.send(md5Value);
});
*/

var cnodeHomeUrl = 'https://cnodejs.org/';
/*
app.get('/', (req, res, next) => {
  // 用 superagent 去抓取 https://cnodejs.org/ 的内容
  superagent.get('https://cnodejs.org/')
    .end((err, sres) => {
      // 常规的错误处理
      if (err) {
        return next(err);
      }
      // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
      // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
      // 剩下就都是 jquery 的内容了
      var $ = cheerio.load(sres.text);
      var items = [];
      $('#topic_list .topic_title').each((idx, element) => {
        var $element = $(element);
        items.push({
          title: $element.attr('title'),
          href: $element.attr('href'),
          author: $element.closest('.cell').find('img').attr('title')
        });
      });

      res.send(items);
    });
});
*/

superagent.get(cnodeHomeUrl)
  .end(function (err, res) {
    if (err) {
      return console.error(err);
    }
    const topicUrls = [];
    const $ = cheerio.load(res.text);
    // 获取首页所有的链接
    $('#topic_list .topic_title').each(function (idx, element) {
      const $element = $(element);
      // $element.attr('href') 本来的样子是 /topic/542acd7d5d28233425538b04
      // 我们用 url.resolve 来自动推断出完整 url，变成
      // https://cnodejs.org/topic/542acd7d5d28233425538b04 的形式
      // 具体请看 http://nodejs.org/api/url.html#url_url_resolve_from_to 的示例
      const href = url.resolve(cnodeHomeUrl, $element.attr('href'));
      topicUrls.push(href);
      if (idx == 0) {
        return false;
      }
    });

    // console.log(topicUrls);

    // 得到 topicUrls 之后

    // 得到一个 eventproxy 的实例
    const ep = new eventproxy();

    // 命令 ep 重复监听 topicUrls.length 次（在这里也就是 40 次） `topic_html` 事件再行动
    ep.after('topic_html', topicUrls.length, (topics) => {
      // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

      // 开始行动
      topics.forEach((topicElementPair) => {
        // 接下来都是 jquery 的用法了
        const topicUrl = topicElementPair[0];
        const topicHtml = topicElementPair[1];
        const $ = cheerio.load(topicHtml);
        const author1Url = cnodeHomeUrl + $('.user_avatar').eq(1).attr('href').substring(1);
        let resultElement = {
          title: $('.topic_full_title').text().trim(),
          author: $('.user_avatar').eq(0).find('img').attr('title'),
          href: topicUrl,
          author1: $('.user_avatar').eq(1).find('img').attr('title'),
          score1: NaN,
          comment1: $('.reply_content').eq(0).text().trim(),
        };
        superagent.get(author1Url).end((err, res) => {
          if (err) {
            throw err;
          } else {
            console.log('fetch ' + author1Url + ' successful');
            ep.emit('topic_score1', [author1Url, res.text, resultElement]);
          }
        });
        /*return (result);*/
      });
      //console.log('final:');
      //console.log(topics);
    });

    ep.after('topic_score1', topicUrls.length, (authorPairList) => {
      let resultList = authorPairList.map((authorPairElement) => {
        const topicUrl = authorPairElement[0];
        const topicHtml = authorPairElement[1];
        const result = authorPairElement[2];
        const $ = cheerio.load(topicHtml);
        const score1 = $('.user_profile .unstyled .big').eq(0).text();
        result.score1 = score1;
        return result;
      });
      console.log(resultList);
    });

    topicUrls.forEach((topicUrl) => {
      superagent.get(topicUrl).end((err, res) => {
        if (err) {
          throw err;
        } else {
          console.log('fetch ' + topicUrl + ' successful');
          ep.emit('topic_html', [topicUrl, res.text]);
        }
      });
    });

  });

// 定义好我们 app 的行为之后，让它监听本地的 3000 端口。这里的第二个函数是个回调函数
// ，会在 listen 动作成功后执行，我们这里执行了一个命令行输出操作，告诉我们监听动作已完成。
app.listen(3000, () => {
  console.log('app is listening at port 3000');
});
