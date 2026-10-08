export type EquipmentTemplateStatus = 'pending' | 'approved' | 'rejected'

export type EquipmentTemplate = {
  id: string
  title: string
  icon: string
  body: string | null
  /** Spec 096 : photo et vidéo gérées par l'admin. */
  photo_url: string | null
  video_url: string | null
  status: EquipmentTemplateStatus
  created_at: string
}
