/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import type { PracticalBlockInput } from '@/features/guide-customization/types'

jest.mock('@/shared/components/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}))

function Harness() {
  const [value, setValue] = useState<PracticalBlockInput[]>([])
  return (
    <>
      <PracticalBlocksEditor value={value} onChange={setValue} lodgingId="lodging-1" />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('PracticalBlocksEditor', () => {
  it('adds a block, edits its title, and removes it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /ajouter un bloc/i }))
    const titleInput = screen.getByLabelText(/titre du bloc/i)
    await user.type(titleInput, 'La plage')

    expect(screen.getByTestId('state').textContent).toContain('"title":"La plage"')
    expect(screen.getByTestId('state').textContent).toContain('"icon":"info"')

    await user.click(screen.getByRole('button', { name: /supprimer le bloc/i }))
    expect(screen.getByTestId('state').textContent).toBe('[]')
  })
})
