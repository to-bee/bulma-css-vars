import { ColorUpdater, ColorGenerator } from './color-updater'
import { ColorCallSet } from './types'

const colorCallSet: ColorCallSet = {
  black: {
    value: { h: 42, s: 42, l: 42 },
    calls: [
      {
        fn: 'adjusthue',
        fnArg: '42deg',
        composeArg: {
          fn: 'lighten',
          fnArg: '4200', // 42%
        },
      },
      {
        fn: 'color-invert',
        fnArg: null,
      },
    ],
  },
}

describe('Color Updater', () => {
  test('adds updates for all color defs', () => {
    const updater = new ColorUpdater(colorCallSet)
    const updates = updater.getUpdatedVars('black', '#5291a3')
    expect(updates).toEqual([
      { name: '--black', value: 'rgb(82, 145, 163)' },
      {
        name: '--black--42deg--adjusthue--4200--lighten',
        value: 'rgb(221, 222, 238)',
      },
      { name: '--black--color-invert', value: 'rgb(255, 255, 255)' },
    ])
  })

  test('lets updater set updates on document element style', () => {
    const g: any = global
    g['document'] = {
      documentElement: {
        style: {
          setProperty(_name: string, _value: string) {},
        },
      },
    }

    const spySetStyle = jest.spyOn(
      document.documentElement.style,
      'setProperty'
    )
    const updater = new ColorUpdater(colorCallSet)
    updater.updateVarsInDocument('black', '#5291a3')
    expect(spySetStyle).toHaveBeenCalled()
    expect(spySetStyle).toHaveBeenCalledTimes(3)
    expect(spySetStyle.mock.calls).toEqual([
      ['--black', 'rgb(82, 145, 163)'],
      ['--black--42deg--adjusthue--4200--lighten', 'rgb(221, 222, 238)'],
      ['--black--color-invert', 'rgb(255, 255, 255)'],
    ])
  })
})

describe('Color Generator', () => {
  test('writes base variables in sass style', () => {
    const generator = new ColorGenerator(colorCallSet)
    const sassBaseVars = generator.createWritableSassFileOnlySassBaseVariables()
    expect(sassBaseVars).toEqual('$black: var(--black)\n')
  })

  test('writes all variables in sass style', () => {
    const generator = new ColorGenerator(colorCallSet)
    const sassVars = generator.createWritableSassFile()
    expect(sassVars).toContain('// sass variables')
    expect(sassVars).toContain('$black: var(--black)')
    expect(sassVars).toContain('// declared base css variables')
    expect(sassVars).toContain('--black: rgb(82, 145, 163)')
    expect(sassVars).toContain('// derived, generated css variables')
    expect(sassVars).toContain('--black--42deg--adjusthue--4200--lighten: rgb(221, 222, 238)')
    expect(sassVars).toContain('--black--color-invert: rgb(255, 255, 255)')
  })
})
