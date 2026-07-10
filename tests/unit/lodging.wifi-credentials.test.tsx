/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WifiCredentials } from '@/app/(public)/le-logement/_components/WifiCredentials'

describe('WifiCredentials', () => {
  const writeText = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    writeText.mockClear()
    Object.assign(navigator, { clipboard: { writeText } })
  })

  it('affiche le SSID et le mot de passe', () => {
    render(<WifiCredentials ssid="Livebox-75E0" password="ryCWsoZceuMjg6bGgj" />)
    expect(screen.getByText('Livebox-75E0')).toBeInTheDocument()
    expect(screen.getByText('ryCWsoZceuMjg6bGgj')).toBeInTheDocument()
  })

  it('copie le mot de passe dans le presse-papier au clic', async () => {
    render(<WifiCredentials ssid="Livebox-75E0" password="ryCWsoZceuMjg6bGgj" />)
    fireEvent.click(screen.getByRole('button', { name: /copier le mot de passe/i }))
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('ryCWsoZceuMjg6bGgj')
    })
  })

  it('copie le nom du réseau au clic', async () => {
    render(<WifiCredentials ssid="Livebox-75E0" password="ryCWsoZceuMjg6bGgj" />)
    fireEvent.click(screen.getByRole('button', { name: /copier le nom du réseau/i }))
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('Livebox-75E0')
    })
  })

  it("n'affiche pas de ligne quand la valeur est absente ('—')", () => {
    render(<WifiCredentials ssid="Livebox-75E0" password={null} />)
    expect(screen.getByText('Livebox-75E0')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copier le mot de passe/i })).not.toBeInTheDocument()
  })

  it('ne rend rien si ni SSID ni mot de passe', () => {
    const { container } = render(<WifiCredentials ssid={null} password={null} />)
    expect(container.firstChild).toBeNull()
  })
})
