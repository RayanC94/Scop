export default function ClientLayout({ children }: { children: React.ReactNode }) {
    // Le layout ne contient plus que les enfants.
    // La structure (sidebars, main) est maintenant gérée directement
    // dans la page du dashboard pour faciliter la communication.
    return <>{children}</>;
  }