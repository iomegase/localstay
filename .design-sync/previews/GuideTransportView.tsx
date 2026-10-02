import { GuideTransportView } from '@mystay/design-system'

export const GettingAround = () => (
  <div className="w-[375px]">
    <GuideTransportView
      lodging={{
        facilibus: true,
        transportCards: [
          { id: 'tram', title: 'Tramway du Mont-Blanc', tag: 'Gare du village', body: 'Monte vers Bellevue en hiver et vers le Nid d’Aigle en été.' },
          { id: 'train', title: 'Gare Saint-Gervais–Le Fayet', tag: 'Train', body: 'TER régionaux, TGV en saison et Mont-Blanc Express vers Chamonix.' },
          { id: 'taxi', title: 'Taxi', tag: 'Sur réservation', body: 'La conciergerie vous réserve un taxi local de confiance.' },
        ],
      }}
      onBack={() => {}}
      onOpenFacilibus={() => {}}
    />
  </div>
)
