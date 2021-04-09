module.exports = {
  crossorigin: "anonymous",
  publicPath: process.env.NODE_ENV === 'production'
    ? '/tmp123/' // for github.io deployment
    : '/'
} // vue.config.js