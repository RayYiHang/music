import * as log4js from 'log4js'
import fs from 'fs'
import path from 'path'

const dataDir = process.env.DATA_DIR
if (dataDir) {
  fs.mkdirSync(dataDir, { recursive: true })
}
log4js.configure({
  appenders: {
    xtify: { type: 'file', filename: dataDir ? path.join(dataDir, 'Xtify.log') : 'Xtify.log' },
  },
  categories: { default: { appenders: ['xtify'], level: 'info' } },
})

const log = log4js.getLogger()
log.level = 'info'

export default log
