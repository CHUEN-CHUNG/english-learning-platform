import { relative, win32 } from 'node:path'

const slash = (p) => p.replace(/\\/g, '/')
const RE_WINDOWS_DRIVE = /^[A-Z]:\//i

function getImportGlobRelativePath(from, to) {
  const normalizedFrom = slash(from)
  const normalizedTo = slash(to)
  return slash(
    RE_WINDOWS_DRIVE.test(normalizedFrom) || RE_WINDOWS_DRIVE.test(normalizedTo)
      ? win32.relative(normalizedFrom, normalizedTo)
      : relative(normalizedFrom, normalizedTo),
  )
}

const userRoot = '/c/Cursor/Eglish-learning-AI/Synoyms-and-Antonyms'
const themePath =
  'C:/Cursor/Eglish-learning-AI/Synoyms-and-Antonyms/node_modules/@slidev/theme-default/styles/index.ts'
const self = '/@slidev/conditional-styles'

console.log('with userRoot:', getImportGlobRelativePath(userRoot, themePath))
console.log('with self:', getImportGlobRelativePath(self, themePath))

const root = userRoot && RE_WINDOWS_DRIVE.test(slash(themePath)) ? userRoot : undefined
console.log('root used:', root)
console.log('final:', getImportGlobRelativePath(root ?? self, themePath))
