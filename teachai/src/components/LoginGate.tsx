import { useState } from "react"
import { Compass, GraduationCap, Rocket, Terminal } from "lucide-react"

/**
 * Ported from the eshaanfrontend branch (ba3f735), markup unchanged.
 *
 * Demo only — the password is collected and ignored, exactly as on that branch.
 * Any username gets you in. This gates nothing.
 */
export default function LoginGate({ onSignIn }: { onSignIn: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) onSignIn()
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-royal selection:text-paper relative font-sans items-center justify-center p-4 overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute top-12 left-8 md:left-16 text-royal opacity-20 -rotate-12 pointer-events-none">
        <GraduationCap size={64} strokeWidth={1.5} />
      </div>
      <div className="absolute bottom-16 right-8 md:right-16 text-ink opacity-10 rotate-12 pointer-events-none">
        <Terminal size={80} strokeWidth={1} />
      </div>
      <div className="absolute top-32 right-12 md:right-32 text-royal opacity-15 rotate-45 pointer-events-none hidden md:block">
        <Rocket size={48} strokeWidth={1.5} />
      </div>
      <div className="absolute bottom-32 left-12 md:left-24 text-ink opacity-10 -rotate-12 pointer-events-none hidden md:block">
        <Compass size={56} strokeWidth={1.5} />
      </div>

      <div className="max-w-md w-full p-8 bg-paper rough-border sketch-box-shadow flex flex-col gap-8 z-10">
        <div className="text-center flex flex-col gap-4">
          <h1 className="text-5xl font-display text-ink -rotate-1">teach.ai</h1>
          <p className="text-base font-sans opacity-80 leading-relaxed">
            A space to learn by building. Make mistakes, run into walls, and
            create something real.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-transparent outline-none p-3 rough-border-blue font-sans focus-within:-translate-y-0.5 transition-transform"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent outline-none p-3 rough-border font-sans focus-within:-translate-y-0.5 transition-transform"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 p-4 rough-button font-bold hover:bg-ink hover:text-paper transition-all"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}
