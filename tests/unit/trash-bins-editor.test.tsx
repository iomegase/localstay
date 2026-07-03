/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { TrashBinsEditor } from '@/features/guide-customization/components/TrashBinsEditor'
import type { TrashBinInput } from '@/features/guide-customization/lib/trash-bins'

function Harness({ initial = [] as TrashBinInput[] }) {
  const [value, setValue] = useState<TrashBinInput[]>(initial)
  return <TrashBinsEditor value={value} onChange={setValue} />
}

describe('TrashBinsEditor', () => {
  it('shows a toggle per preset bin and no description field when none is enabled', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: /poubelle jaune/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /poubelle verte/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('enabling a bin reveals a description field for it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /poubelle jaune/i }))

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('disabling an enabled bin removes its description field', async () => {
    const user = userEvent.setup()
    render(<Harness initial={[{ type: 'jaune', description: 'Cartons' }]} />)

    expect(screen.getByRole('textbox')).toHaveValue('Cartons')
    await user.click(screen.getByRole('button', { name: /poubelle jaune/i }))

    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
