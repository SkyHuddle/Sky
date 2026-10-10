import { ButtonLink } from "@/components/ui/Button";
import { BrandMark } from "@/components/shell/Brand";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandMark size={44} />
      <h1 className="mt-6 text-display text-ink">Nothing here</h1>
      <p className="mt-2 max-w-sm text-body text-ink-2">That page doesn&apos;t exist, or it&apos;s private. Check the link, or head back to the tournaments.</p>
      <ButtonLink href="/" className="mt-6">
        Go home
      </ButtonLink>
    </main>
  );
}
