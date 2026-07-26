import { useAuthUser } from "@/hooks/useCloudSync";
import { supabase } from "@/integrations/supabase/client";

export default function SignOutButton() {
  const user = useAuthUser();
  if (!user) return null;

  async function handle() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  const label = user.user_metadata?.name || user.email?.split("@")[0] || "Foydalanuvchi";

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 shadow-md border border-black/5">
      <span className="text-xs text-muted-foreground max-w-[120px] truncate">{label}</span>
      <button
        onClick={handle}
        className="text-xs font-medium text-red-600 hover:text-red-700"
      >
        Chiqish
      </button>
    </div>
  );
}
