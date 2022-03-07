module.exports = {
  crossorigin: "anonymous",
  publicPath: process.env.NODE_ENV === 'production'
    ? '/tmp123/' // for github.io deployment
    : '/',
  productionSourceMap: process.env.NODE_ENV !== 'production', //https://stackoverflow.com/questions/51482940/how-can-i-disable-source-maps-in-production-for-a-vue-js-app
    /*chainWebpack: config => {
      //config.resolve.alias.set('vue', '@vue/compat')
  
      config.module
        .rule('vue')
        .use('vue-loader')
        .tap(options => {
          return {
            ...options,
            compilerOptions: {
              compatConfig: {
                MODE: 2
              }
            }
          }
        })
    }*/
    lintOnSave: false
} // vue.config.js