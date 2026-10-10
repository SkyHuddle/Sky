import { Brand } from "@/components/shell/Brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-5">
        <Brand />
      </header>
      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5 pt-6 pb-16">
        {children}
      </main>
    </div>
  );
}
