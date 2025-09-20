// https://observablehq.com/@fil/hello-kmeans-engine@40
function _1(md){return(
md`# Hello, kmeans-engine

> *This k-means javascript implementation is optimised for large and sparse data set by using an array of objects to represent a sparse matrix. — 
Stanley Fok*
> https://github.com/stanleyfok/kmeans-engine`
)}

function _kmeans(require){return(
require("https://bundle.run/kmeans-engine@1.5.0")
)}

function _3(md){return(
md`Example from the README:`
)}

function _engineers(){return(
[
  // frontend engineers
  { html: 5, angular: 5, react: 3, css: 3 },
  { html: 4, react: 5, css: 4 },
  { html: 4, react: 5, vue: 4, css: 5 },
  { html: 3, angular: 3, react: 4, vue: 2, css: 3 },

  // backend engineers
  { nodejs: 5, python: 3, mongo: 5, mysql: 4, redis: 3 },
  { java: 5, php: 4, ruby: 5, mongo: 3, mysql: 5 },
  { python: 5, php: 4, ruby: 3, mongo: 5, mysql: 4, oracle: 4 },
  { java: 5, csharp: 3, oracle: 5, mysql: 5, mongo: 4 },

  // mobile engineers
  { objc: 3, swift: 5, xcode: 5, crashlytics: 3, firebase: 5, reactnative: 4 },
  { java: 4, swift: 5, androidstudio: 4 },
  { objc: 5, java: 4, swift: 3, androidstudio: 4, xcode: 4, firebase: 4 },
  { objc: 3, java: 5, swift: 3, xcode: 4, apteligent: 4 },

  // devops
  { docker: 5, kubernetes: 4, aws: 4, ansible: 3, linux: 4 },
  { docker: 4, marathon: 4, aws: 4, jenkins: 5 },
  { docker: 3, marathon: 4, heroku: 4, bamboo: 4, jenkins: 4, nagios: 3 },
  {
    marathon: 4,
    heroku: 4,
    bamboo: 4,
    jenkins: 4,
    linux: 3,
    puppet: 4,
    nagios: 5
  }
]
)}

function _5(kmeans,engineers){return(
new Promise((resolve, reject) =>
  kmeans.clusterize(engineers, { k: 4 }, (err, res) => {
    if (err) reject(err);
    else resolve(res);
  })
)
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("kmeans")).define("kmeans", ["require"], _kmeans);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer("engineers")).define("engineers", _engineers);
  main.variable(observer()).define(["kmeans","engineers"], _5);
  return main;
}
