import {
  bulmaColorTools,
  getNameValFromColorDef,
  strValFromColorDef,
} from './bulma-color-tools'
import { compileString } from 'sass'

function normalizeColor(cssColor: string): string {
  cssColor = cssColor.trim()
  if (cssColor === 'black') return 'rgb(0, 0, 0)'
  if (cssColor === 'white') return 'rgb(255, 255, 255)'

  // Handle rgba with possible fractional values
  const rgbaMatch = cssColor.match(/^rgba\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/)
  if (rgbaMatch) {
    return `rgba(${Math.round(parseFloat(rgbaMatch[1]))}, ${Math.round(parseFloat(rgbaMatch[2]))}, ${Math.round(parseFloat(rgbaMatch[3]))}, ${parseFloat(rgbaMatch[4])})`
  }

  // Handle rgb with possible fractional values
  const rgbMatch = cssColor.match(/^rgb\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/)
  if (rgbMatch) {
    return `rgb(${Math.round(parseFloat(rgbMatch[1]))}, ${Math.round(parseFloat(rgbMatch[2]))}, ${Math.round(parseFloat(rgbMatch[3]))})`
  }

  // Handle hex
  const hexMatch = cssColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (hexMatch) {
    return `rgb(${parseInt(hexMatch[1], 16)}, ${parseInt(hexMatch[2], 16)}, ${parseInt(hexMatch[3], 16)})`
  }

  // Handle hsl with possible out-of-range values - clamp and convert
  const hslMatch = cssColor.match(/^hsl\(\s*([\d.-]+),\s*([\d.%-]+),\s*([\d.%-]+)\s*\)$/)
  if (hslMatch) {
    const h = ((parseFloat(hslMatch[1]) % 360) + 360) % 360
    let s = Math.max(0, Math.min(100, parseFloat(hslMatch[2])))
    let l = Math.max(0, Math.min(100, parseFloat(hslMatch[3])))
    const sn = s / 100, ln = l / 100
    const c = (1 - Math.abs(2 * ln - 1)) * sn
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = ln - c / 2
    let r = 0, g = 0, b = 0
    if (h < 60) { r = c; g = x; b = 0 }
    else if (h < 120) { r = x; g = c; b = 0 }
    else if (h < 180) { r = 0; g = c; b = x }
    else if (h < 240) { r = 0; g = x; b = c }
    else if (h < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`
  }

  return cssColor
}

const renderSassColor = (colorCode: string, setupFn: string = '') => {
  const renderedCss = compileString(
    `\n@use 'sass:color'\n\n${setupFn}\n\nhtml\n  color: ${colorCode}\n`,
    {
      syntax: 'indented',
      silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'slash-div'],
    }
  ).css
  const colorPartRaw = renderedCss
    .split('html {\n  color: ')[1]
    .split(';')[0]
  return normalizeColor(colorPartRaw)
}

describe('bulma color tools', () => {
  const turquoise = 'rgb(64, 224, 208)'

  describe('adjusts hue', () => {
    test('black stays black', () => {
      expect(bulmaColorTools.adjusthue('black', '30deg')).toEqual('rgb(0, 0, 0)')
    })
    test('white stays white', () => {
      expect(bulmaColorTools.adjusthue('white', '-30deg')).toEqual('rgb(255, 255, 255)')
    })
    test('turquoise turns lightblue', () => {
      expect(bulmaColorTools.adjusthue(turquoise, '25deg')).toEqual('rgb(64, 173, 224)')
    })
    test('adjusts colors like sass does', () => {
      const colors = ['rgb(19, 14, 83)', 'rgb(247, 255, 184)', 'rgb(0, 63, 201)', 'rgb(100, 24, 168)']
      const sassAdjusted = colors.map(col => renderSassColor(`color.adjust(${col}, $hue: -126deg)`))
      const libAdjusted = colors.map(col => bulmaColorTools.adjusthue(col, '-126deg'))
      expect(libAdjusted).toEqual(sassAdjusted)
    })
  })

  describe('saturates', () => {
    test('black stays black', () => { expect(bulmaColorTools.saturate('black', '3000')).toEqual('rgb(0, 0, 0)') })
    test('white stays white', () => { expect(bulmaColorTools.saturate('white', '4000')).toEqual('rgb(255, 255, 255)') })
    test('turquoise gets saturated', () => { expect(bulmaColorTools.saturate(turquoise, '8000')).toEqual('rgb(33, 255, 233)') })
    test('saturates colors like sass does', () => {
      const colors = ['rgb(19, 14, 83)', 'rgb(70, 88, 128)', 'rgb(132, 67, 148)', 'rgb(100, 24, 168)']
      const sassAdjusted = colors.map(col => renderSassColor(`color.adjust(${col}, $saturation: 35%)`))
      const libAdjusted = colors.map(col => bulmaColorTools.saturate(col, '3500'))
      expect(libAdjusted).toEqual(sassAdjusted)
    })
  })

  describe('desaturates', () => {
    test('black stays black', () => { expect(bulmaColorTools.desaturate('black', '3000')).toEqual('rgb(0, 0, 0)') })
    test('white stays white', () => { expect(bulmaColorTools.desaturate('white', '4000')).toEqual('rgb(255, 255, 255)') })
    test('turquoise gets desaturated', () => { expect(bulmaColorTools.desaturate(turquoise, '8000')).toEqual('rgb(144, 144, 144)') })
    test('desaturates colors like sass does', () => {
      const colors = ['rgb(19, 14, 83)', 'rgb(70, 88, 128)', 'rgb(132, 67, 148)', 'rgb(100, 24, 168)']
      const sassAdjusted = colors.map(col => renderSassColor(`color.adjust(${col}, $saturation: -35%)`))
      const libAdjusted = colors.map(col => bulmaColorTools.desaturate(col, '3500'))
      expect(libAdjusted).toEqual(sassAdjusted)
    })
  })

  describe('darkens', () => {
    test('black stays black', () => { expect(bulmaColorTools.darken('black', '3000')).toEqual('rgb(0, 0, 0)') })
    test('white becomes grey', () => { expect(bulmaColorTools.darken('white', '4000')).toEqual('rgb(153, 153, 153)') })
    test('turquoise darkens', () => { expect(bulmaColorTools.darken(turquoise, '2000')).toEqual('rgb(26, 160, 147)') })
    test('darkens colors like sass does', () => {
      const colors = ['rgb(19, 14, 83)', 'rgb(70, 88, 128)', 'rgb(132, 67, 148)', 'rgb(100, 24, 168)']
      const sassAdjusted = colors.map(col => renderSassColor(`color.adjust(${col}, $lightness: -35%)`))
      const libAdjusted = colors.map(col => bulmaColorTools.darken(col, '3500'))
      expect(libAdjusted).toEqual(sassAdjusted)
    })
  })

  describe('lightens', () => {
    test('black becomes grey', () => { expect(bulmaColorTools.lighten('black', '3000')).toEqual('rgb(77, 77, 77)') })
    test('white stays white', () => { expect(bulmaColorTools.lighten('white', '4000')).toEqual('rgb(255, 255, 255)') })
    test('turquoise lightens', () => { expect(bulmaColorTools.lighten(turquoise, '2000')).toEqual('rgb(152, 238, 230)') })
    test('lightens colors like sass does', () => {
      const colors = ['rgb(19, 14, 83)', 'rgb(70, 88, 128)', 'rgb(132, 67, 148)', 'rgb(100, 24, 168)']
      const sassAdjusted = colors.map(col => renderSassColor(`color.adjust(${col}, $lightness: 35%)`))
      const libAdjusted = colors.map(col => bulmaColorTools.lighten(col, '3500'))
      expect(libAdjusted).toEqual(sassAdjusted)
    })
  })

  describe('alpha-channels (rgba)', () => {
    test('black becomes fading', () => { expect(bulmaColorTools.rgba('black', '30')).toEqual('rgba(0, 0, 0, 0.3)') })
    test('white becomes fading', () => { expect(bulmaColorTools.rgba('white', '40')).toEqual('rgba(255, 255, 255, 0.4)') })
    test('turquoise becomes fading', () => { expect(bulmaColorTools.rgba(turquoise, '20')).toEqual('rgba(64, 224, 208, 0.2)') })
    test('alpha-channels like sass does', () => {
      const colors = ['rgb(19, 14, 83)', 'rgb(70, 88, 128)', 'rgb(132, 67, 148)', 'rgb(100, 24, 168)']
      const sassAdjusted = colors.map(col => renderSassColor(`color.change(${col}, $alpha: 0.35)`))
      const libAdjusted = colors.map(col => bulmaColorTools.rgba(col, '35'))
      expect(libAdjusted).toEqual(sassAdjusted)
    })
  })

  describe('color-inverts', () => {
    test('black becomes white', () => { expect(bulmaColorTools['color-invert']('black')).toEqual('rgb(255, 255, 255)') })
    test('white becomes black', () => { expect(bulmaColorTools['color-invert']('white')).toEqual('rgba(0, 0, 0, 0.7)') })
    test('turquoise becomes black-fade', () => { expect(bulmaColorTools['color-invert'](turquoise)).toEqual('rgba(0, 0, 0, 0.7)') })
  })

  describe('light-color', () => {
    test('black light is almost-white', () => { expect(bulmaColorTools['light-color']('black')).toEqual('rgb(245, 245, 245)') })
    test('white light is white', () => { expect(bulmaColorTools['light-color']('white')).toEqual('rgb(255, 255, 255)') })
    test('turquoise light', () => { expect(bulmaColorTools['light-color'](turquoise)).toEqual('rgb(237, 252, 251)') })
  })

  describe('dark-color', () => {
    test('black dark is dark-grey', () => { expect(bulmaColorTools['dark-color']('black')).toEqual('rgb(145, 145, 145)') })
    test('white dark is light-grey', () => { expect(bulmaColorTools['dark-color']('white')).toEqual('rgb(74, 74, 74)') })
    test('turquoise dark', () => { expect(bulmaColorTools['dark-color'](turquoise)).toEqual('rgb(21, 127, 117)') })
  })

  test('returns name and val from color def', () => {
    const { name, value } = getNameValFromColorDef('text', { r: 170, g: 130, b: 200 })
    expect(name).toEqual('--text')
    expect(value).toEqual('rgb(170, 130, 200)')
  })

  test('receives error when passing an invalid object', () => {
    expect(() => strValFromColorDef({ r: 170, g: 130, x: 500 } as any, 'text')).toThrow()
  })

  test('returns val from color def', () => {
    const testVals = [
      { r: 170, g: 130, b: 200 },
      { r: 170, g: 130, b: 200, a: 0.2 },
      { h: 170, s: 60, l: 70 },
      { h: 170, s: 60, l: 70, a: 0.7 },
      '#c8e298',
    ]
    const strVals = testVals.map(v => strValFromColorDef(v, 'some-name'))
    expect(strVals).toEqual([
      'rgb(170, 130, 200)',
      'rgba(170, 130, 200, 0.2)',
      'rgb(133, 224, 209)',
      'rgba(133, 224, 209, 0.7)',
      '#c8e298',
    ])
  })
})
