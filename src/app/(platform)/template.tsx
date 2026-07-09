/**
 * Ambient motion baseline (design §7): every route change re-mounts this
 * template, so content fades and rises a few px on arrival — 280ms on the
 * sakina ease, never the hero timing. Collapses under reduced motion.
 */
export default function PlatformTemplate({ children }: { children: React.ReactNode }) {
  return <div className="rise-in">{children}</div>;
}
