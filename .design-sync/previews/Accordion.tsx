import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@mystay/design-system'

export const Faq = () => (
  <Accordion type="single" collapsible defaultValue="q1" className="w-[420px]">
    <AccordionItem value="q1">
      <AccordionTrigger>Comment mes voyageurs accèdent-ils au guide ?</AccordionTrigger>
      <AccordionContent>Ils scannent le QR code affiché dans le logement : le guide s'ouvre sur leur téléphone, sans application à installer.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="q2">
      <AccordionTrigger>Puis-je modifier les recommandations ?</AccordionTrigger>
      <AccordionContent>Oui, depuis votre tableau de bord, à tout moment.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="q3">
      <AccordionTrigger>Le guide est-il disponible en anglais ?</AccordionTrigger>
      <AccordionContent>La version anglaise arrive prochainement.</AccordionContent>
    </AccordionItem>
  </Accordion>
)
