import { getDemandes as apiGetDemandes, saveDemande as apiSaveDemande, updateDemandeStatus as apiUpdateStatus } from './api'

export const statuts = {
  RECU: 'reçu',
  EN_COURS: 'en_cours_validation',
  ACCEPTE: 'accepté',
  REFUSE: 'refusé',
  LISTE_ATTENTE: 'liste_attente',
}

export const statutLabels = {
  [statuts.RECU]: 'Reçu',
  [statuts.EN_COURS]: 'En cours de validation',
  [statuts.ACCEPTE]: 'Accepté',
  [statuts.REFUSE]: 'Refusé',
  [statuts.LISTE_ATTENTE]: "Liste d'attente",
}

export const statutColors = {
  [statuts.RECU]: 'badge-info',
  [statuts.EN_COURS]: 'badge-warning',
  [statuts.ACCEPTE]: 'badge-success',
  [statuts.REFUSE]: 'badge-danger',
  [statuts.LISTE_ATTENTE]: 'badge-warning',
}

export async function getDemandes(params = {}) {
  return apiGetDemandes(params)
}

export async function saveDemande(demande) {
  return apiSaveDemande(demande)
}

export async function updateDemandeStatus(id, newStatus, notes = '') {
  return apiUpdateStatus(id, newStatus, notes)
}

export async function refreshDemandes(ecoleId) {
  return apiGetDemandes(ecoleId ? { ecoleId } : {})
}
