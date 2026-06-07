export default function WeatherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 mx-auto w-full max-w-[430px] overflow-hidden bg-[#f7f7fb]">
      {children}
    </div>
  )
}
