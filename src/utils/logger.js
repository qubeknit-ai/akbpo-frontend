const isDev = import.meta.env.DEV

const prefix = '[AK BPO AI]'

export const logDebug = (...args) => {
  if (isDev) {
    console.debug(prefix, ...args)
  }
}

export const logInfo = (...args) => {
  if (isDev) {
    console.info(prefix, ...args)
  }
}

export const logWarn = (...args) => {
  if (isDev) {
    console.warn(prefix, ...args)
  }
}

export const logError = (...args) => {
  if (isDev) {
    console.error(prefix, ...args)
  }
}

