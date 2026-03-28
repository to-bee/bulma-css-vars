import * as sass from 'sass'

export function compileSass(
  sassFilePath: string,
) {
  const compileResult = sass.compile(sassFilePath, {
    silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
  })
  return compileResult.css
}