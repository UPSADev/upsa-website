// Blends Clerk's hosted auth forms into the portal's paper/moss design system
// (see .portal-auth-card in src/styles/portal.css) instead of Clerk's default card chrome.
export const portalClerkAppearance = {
  variables: {
    colorPrimary: '#1F4D32',
    colorBackground: '#EFE7D5',
    colorInputBackground: '#F7F2E8',
    colorInputText: '#1A1F18',
    colorText: '#1A1F18',
    colorTextSecondary: '#6B7268',
    colorDanger: '#8C3B2E',
    borderRadius: '6px',
    fontFamily: "'Geist', sans-serif",
  },
  elements: {
    rootBox: 'portal-clerk-root',
    cardBox: 'portal-clerk-cardbox',
    card: 'portal-clerk-card',
    header: 'portal-clerk-header',
  },
};
