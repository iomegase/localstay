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
  it('shows a toggle per preset bin, unpressed by default', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: /poubelle jaune/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /poubelle verte/i })).toBeInTheDocument()
  })

  it('enabling a bin marks its toggle as pressed', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /poubelle jaune/i }))

    expect(screen.getByRole('button', { name: /poubelle jaune/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('disabling an enabled bin unmarks its toggle', async () => {
    const user = userEvent.setup()
    render(<Harness initial={[{ type: 'jaune' }]} />)

    expect(screen.getByRole('button', { name: /poubelle jaune/i })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /poubelle jaune/i }))

    expect(screen.getByRole('button', { name: /poubelle jaune/i })).toHaveAttribute('aria-pressed', 'false')
  })
})
