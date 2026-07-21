export const PRIORITY_CAMPAIGN_LABEL = 'Cobertura Total 15';

export function isPriorityCampaignName(value?: string | null): boolean {
  return normalizeCampaignName(value) === normalizeCampaignName(PRIORITY_CAMPAIGN_LABEL);
}

function normalizeCampaignName(value?: string | null): string {
  return (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}
