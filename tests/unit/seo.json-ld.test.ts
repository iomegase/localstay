import { serializeJsonLd } from '@/shared/components/JsonLd'

const LINE_SEP = String.fromCharCode(0x2028)
const PARA_SEP = String.fromCharCode(0x2029)

describe('serializeJsonLd', () => {
  it('escapes "<" so a malicious </script> cannot break out of the script tag', () => {
    const out = serializeJsonLd({ name: 'Bar </script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c')
  })

  it('escapes the U+2028 / U+2029 line separators that break inline JS', () => {
    const out = serializeJsonLd({ name: `a${LINE_SEP}b${PARA_SEP}c` })
    expect(out).not.toContain(LINE_SEP)
    expect(out).not.toContain(PARA_SEP)
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('round-trips to the original object (still valid JSON)', () => {
    const data = { '@type': 'Thing', name: 'Café < & >', desc: 'x' }
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data)
  })
})
