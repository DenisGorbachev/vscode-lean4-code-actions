Error.stackTraceLimit = Infinity

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

// // enable long stack traces
// if (process.env.NODE_ENV !== 'production') {
//   const longjohn = require('longjohn')
//   longjohn.async_trace_limit = -1 // unlimited
// }

// module.exports = async () => {
//   const config = getConfig()
//   Object.assign(process.env, config)
// }
