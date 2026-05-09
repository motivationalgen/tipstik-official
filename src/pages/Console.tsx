import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Eye, EyeOff, Users, UserCheck, Crown, Gem, Shield, ShieldOff, UserPlus, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { Match, Sport, MatchResult, MatchTier } from "@/types/match";

type MemberTier = "user" | "member" | "pro" | "vip" | "admin";
interface MemberRow { id: string; display_name: string | null; created_at: string; tier: MemberTier; }
interface AdminRow { id: string; display_name: string | null; created_at: string; }
interface UserStats { total: number; members: number; pro: number; vip: number; }


const empty = (): Partial<Match> => ({
  team_a: "", team_b: "", league: "", sport: "football",
  match_time: "20:00", match_date: format(new Date(), "yyyy-MM-dd"),
  prediction_label: "BTTS", prediction_text: "Both Teams to Score - Yes",
  odds: 1.7, confidence: 75, result: "pending", tier: "members", is_published: true,
});

const Console = () => {
  const { token } = useParams<{ token: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Match> | null>(null);
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<UserStats>({ total: 0, members: 0, pro: 0, vip: 0 });
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => { document.title = "Admin Console — Tipstik"; }, []);

  void token;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("matches").select("*").order("match_date", { ascending: false }).limit(200);
    setMatches((data ?? []) as Match[]);
    setLoading(false);
  };

  const loadStats = async () => {
    const [{ count: total }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("role"),
    ]);
    const r = (roles ?? []) as { role: string }[];
    setStats({
      total: total ?? 0,
      members: r.filter((x) => x.role === "member" || x.role === "user").length,
      pro: r.filter((x) => x.role === "pro").length,
      vip: r.filter((x) => x.role === "vip").length,
    });
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const tierOrder: Record<string, number> = { admin: 4, vip: 3, pro: 2, member: 1, user: 0 };
    const byUser = new Map<string, MemberTier>();
    ((roles ?? []) as { user_id: string; role: MemberTier }[]).forEach((r) => {
      const cur = byUser.get(r.user_id);
      if (!cur || (tierOrder[r.role] ?? -1) > (tierOrder[cur] ?? -1)) byUser.set(r.user_id, r.role);
    });
    setMembers(((profiles ?? []) as { id: string; display_name: string | null; created_at: string }[]).map((p) => ({
      ...p,
      tier: byUser.get(p.id) ?? "user",
    })));
    setMembersLoading(false);
  };

  const changeTier = async (userId: string, tier: MemberTier) => {
    const { error } = await (supabase.rpc as any)("set_user_tier", { _user_id: userId, _tier: tier });
    if (error) toast.error(error.message);
    else { toast.success("Tier updated"); loadMembers(); loadStats(); loadAdmins(); }
  };

  const loadAdmins = async () => {
    setAdminsLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    const ids = ((roles ?? []) as { user_id: string }[]).map((r) => r.user_id);
    if (ids.length === 0) { setAdmins([]); setAdminsLoading(false); return; }
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, created_at").in("id", ids);
    setAdmins(((profiles ?? []) as AdminRow[]).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
    setAdminsLoading(false);
  };

  const promoteAdmin = async () => {
    const email = promoteEmail.trim();
    if (!email) { toast.error("Enter an email"); return; }
    setPromoting(true);
    const { error } = await (supabase.rpc as any)("promote_admin_by_email", { _email: email });
    setPromoting(false);
    if (error) toast.error(error.message);
    else { toast.success("Admin promoted"); setPromoteEmail(""); loadAdmins(); loadMembers(); loadStats(); }
  };

  const revokeAdmin = async (userId: string, name: string | null) => {
    if (userId === user?.id) { toast.error("You can't revoke your own admin access"); return; }
    if (!confirm(`Revoke admin from ${name || "this user"}? They will become a regular member.`)) return;
    const { error } = await (supabase.rpc as any)("set_user_tier", { _user_id: userId, _tier: "member" });
    if (error) toast.error(error.message);
    else { toast.success("Admin revoked"); loadAdmins(); loadMembers(); loadStats(); }
  };

  useEffect(() => { if (isAdmin) { load(); loadStats(); loadMembers(); loadAdmins(); } }, [isAdmin]);

  if (authLoading) return <div className="container py-16 text-center text-muted-foreground">Loading...</div>;

  if (!user || !isAdmin) {
    const submitLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginEmail || !loginPassword) { toast.error("Enter email and password"); return; }
      setSigningIn(true);
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
      setSigningIn(false);
      if (error) toast.error(error.message);
      else toast.success("Signed in");
    };
    return (
      <div className="container max-w-md py-16">
        <div className="card-elevated rounded-2xl border border-border/60 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-display font-bold text-2xl">Admin Login</h1>
            <p className="text-sm text-muted-foreground">
              {user ? "This account is not an admin." : "Sign in with your admin credentials"}
            </p>
          </div>
          {!user && (
            <form onSubmit={submitLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" type="email" autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input id="admin-password" type="password" autoComplete="current-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={signingIn} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                {signingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}
          {user && !isAdmin && (
            <Button onClick={() => supabase.auth.signOut()} variant="outline" className="w-full">Sign out</Button>
          )}
        </div>
      </div>
    );
  }


  const seedDemo = async () => {
    if (!confirm("Insert demo matches for yesterday, today, and tomorrow?")) return;
    const today = new Date();
    const d = (offset: number) => {
      const x = new Date(today);
      x.setDate(x.getDate() + offset);
      return format(x, "yyyy-MM-dd");
    };
    const rows = [
      // Yesterday
      { team_a: "Manchester City", team_b: "Arsenal", league: "Premier League", sport: "football" as Sport, match_time: "20:00", match_date: d(-1), prediction_label: "Over 2.5 Goals", prediction_text: "Both sides have averaged 3+ goals in their last 5 meetings.", odds: 1.85, confidence: 82, result: "win" as MatchResult, tier: "free" as MatchTier, is_published: true },
      { team_a: "Real Madrid", team_b: "Barcelona", league: "La Liga", sport: "football" as Sport, match_time: "21:00", match_date: d(-1), prediction_label: "BTTS — Yes", prediction_text: "El Clasico rarely disappoints. Both attacks in great form.", odds: 1.70, confidence: 78, result: "win" as MatchResult, tier: "free" as MatchTier, is_published: true },
      { team_a: "Lakers", team_b: "Celtics", league: "NBA", sport: "basketball" as Sport, match_time: "02:30", match_date: d(-1), prediction_label: "Lakers +4.5", prediction_text: "Lakers strong at home, Celtics on a back-to-back.", odds: 1.90, confidence: 70, result: "loss" as MatchResult, tier: "members" as MatchTier, is_published: true },
      { team_a: "Djokovic", team_b: "Alcaraz", league: "ATP Masters", sport: "tennis" as Sport, match_time: "18:00", match_date: d(-1), prediction_label: "Over 3.5 Sets", prediction_text: "Two evenly matched players — expect a long battle.", odds: 2.10, confidence: 75, result: "win" as MatchResult, tier: "pro" as MatchTier, is_published: true },
      // Today
      { team_a: "Liverpool", team_b: "Chelsea", league: "Premier League", sport: "football" as Sport, match_time: "17:30", match_date: d(0), prediction_label: "Liverpool to Win", prediction_text: "Liverpool unbeaten at Anfield in last 12.", odds: 1.95, confidence: 80, result: "pending" as MatchResult, tier: "free" as MatchTier, is_published: true },
      { team_a: "Bayern Munich", team_b: "Dortmund", league: "Bundesliga", sport: "football" as Sport, match_time: "18:30", match_date: d(0), prediction_label: "Over 2.5 Goals", prediction_text: "Der Klassiker — both teams average 2.4 goals scored per game.", odds: 1.65, confidence: 85, result: "pending" as MatchResult, tier: "free" as MatchTier, is_published: true },
      { team_a: "PSG", team_b: "Marseille", league: "Ligue 1", sport: "football" as Sport, match_time: "20:45", match_date: d(0), prediction_label: "PSG -1 Handicap", prediction_text: "PSG dominant at home, Marseille struggling on the road.", odds: 2.05, confidence: 72, result: "pending" as MatchResult, tier: "members" as MatchTier, is_published: true },
      { team_a: "Warriors", team_b: "Suns", league: "NBA", sport: "basketball" as Sport, match_time: "03:00", match_date: d(0), prediction_label: "Over 225.5 Points", prediction_text: "Both teams top 5 in pace this season.", odds: 1.88, confidence: 76, result: "pending" as MatchResult, tier: "free" as MatchTier, is_published: true },
      { team_a: "Sinner", team_b: "Medvedev", league: "ATP 1000", sport: "tennis" as Sport, match_time: "15:00", match_date: d(0), prediction_label: "Sinner to Win", prediction_text: "Sinner leads H2H 4-1 on hard court this year.", odds: 1.60, confidence: 84, result: "pending" as MatchResult, tier: "pro" as MatchTier, is_published: true },
      // Tomorrow
      { team_a: "Inter Milan", team_b: "Juventus", league: "Serie A", sport: "football" as Sport, match_time: "20:45", match_date: d(1), prediction_label: "Under 2.5 Goals", prediction_text: "Derby d'Italia — historically tight, both defences solid.", odds: 1.80, confidence: 74, result: "pending" as MatchResult, tier: "free" as MatchTier, is_published: true },
      { team_a: "Atletico Madrid", team_b: "Sevilla", league: "La Liga", sport: "football" as Sport, match_time: "19:00", match_date: d(1), prediction_label: "Atletico Win & BTTS No", prediction_text: "Atletico defensive solidity at the Metropolitano.", odds: 2.40, confidence: 68, result: "pending" as MatchResult, tier: "members" as MatchTier, is_published: true },
      { team_a: "Nuggets", team_b: "Heat", league: "NBA", sport: "basketball" as Sport, match_time: "01:30", match_date: d(1), prediction_label: "Nuggets -6.5", prediction_text: "NBA Finals rematch — Nuggets fully fit.", odds: 1.92, confidence: 77, result: "pending" as MatchResult, tier: "vip" as MatchTier, is_published: true },
      { team_a: "Swiatek", team_b: "Sabalenka", league: "WTA 1000", sport: "tennis" as Sport, match_time: "16:00", match_date: d(1), prediction_label: "Over 21.5 Games", prediction_text: "Two heavy hitters — expect long rallies and tiebreaks.", odds: 1.75, confidence: 79, result: "pending" as MatchResult, tier: "pro" as MatchTier, is_published: true },
    ];
    const { error } = await supabase.from("matches").insert(rows as any);
    if (error) toast.error(error.message);
    else { toast.success(`Inserted ${rows.length} demo matches`); load(); }
  };

  const save = async () => {
    if (!editing) return;
    const payload = { ...editing, odds: Number(editing.odds), confidence: editing.confidence ? Number(editing.confidence) : null };
    const { id, created_at, updated_at, ...rest } = payload as any;
    const { error } = id
      ? await supabase.from("matches").update(rest).eq("id", id)
      : await supabase.from("matches").insert(rest as any);
    if (error) toast.error(error.message);
    else { toast.success(id ? "Updated" : "Created"); setOpen(false); setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this match?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const togglePublish = async (m: Match) => {
    const { error } = await supabase.from("matches").update({ is_published: !m.is_published }).eq("id", m.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="container py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-3xl">Admin <span className="text-gradient-primary">Console</span></h1>
          <p className="text-sm text-muted-foreground">Manage matches and predictions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={seedDemo} variant="outline">
            <Database className="h-4 w-4" /> Seed Demo Data
          </Button>
          <Button onClick={() => { setEditing(empty()); setOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Match
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: stats.total, Icon: Users, accent: "text-primary" },
          { label: "Members", value: stats.members, Icon: UserCheck, accent: "text-foreground" },
          { label: "Pro", value: stats.pro, Icon: Crown, accent: "text-amber-500" },
          { label: "VIP", value: stats.vip, Icon: Gem, accent: "text-fuchsia-500" },
        ].map(({ label, value, Icon, accent }) => (
          <div key={label} className="card-elevated rounded-2xl border border-border/60 p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg bg-secondary/60 flex items-center justify-center ${accent}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</div>
              <div className="font-display font-bold text-xl leading-tight">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl">Admins</h2>
          <span className="text-xs text-muted-foreground">{admins.length} total</span>
        </div>
        <div className="card-elevated rounded-2xl border border-border/60 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") promoteAdmin(); }}
              className="flex-1"
            />
            <Button onClick={promoteAdmin} disabled={promoting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <UserPlus className="h-4 w-4" /> {promoting ? "Promoting..." : "Promote to Admin"}
            </Button>
          </div>
          {adminsLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
          ) : admins.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No admins yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {a.display_name || <span className="text-muted-foreground">—</span>}
                      {a.id === user?.id && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(a.created_at), "yyyy-MM-dd")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={a.id === user?.id}
                        onClick={() => revokeAdmin(a.id, a.display_name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <ShieldOff className="h-4 w-4" /> Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl">Members</h2>
          <span className="text-xs text-muted-foreground">{members.length} total</span>
        </div>
        <div className="card-elevated rounded-2xl border border-border/60 overflow-hidden">
          {membersLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No members yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Current Tier</TableHead>
                  <TableHead className="text-right">Change Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm font-medium">{m.display_name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(m.created_at), "yyyy-MM-dd")}</TableCell>
                    <TableCell className="text-xs uppercase font-bold">{m.tier}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-block min-w-[140px]">
                        <Select value={m.tier} onValueChange={(v) => changeTier(m.id, v as MemberTier)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <div className="card-elevated rounded-2xl border border-border/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>League</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Odds</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Pub</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{m.match_date}</TableCell>
                  <TableCell className="text-sm font-medium">{m.team_a} vs {m.team_b}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.league}</TableCell>
                  <TableCell className="text-xs capitalize">{m.sport}</TableCell>
                  <TableCell className="text-xs uppercase font-bold">{m.tier}</TableCell>
                  <TableCell className="text-primary font-bold">{Number(m.odds).toFixed(2)}</TableCell>
                  <TableCell><span className="text-xs uppercase font-bold">{m.result}</span></TableCell>
                  <TableCell>
                    <button onClick={() => togglePublish(m)} aria-label="toggle">
                      {m.is_published ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Match" : "Add Match"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Team A</Label><Input value={editing.team_a ?? ""} onChange={(e) => setEditing({ ...editing, team_a: e.target.value })} /></div>
              <div className="space-y-2"><Label>Team B</Label><Input value={editing.team_b ?? ""} onChange={(e) => setEditing({ ...editing, team_b: e.target.value })} /></div>
              <div className="space-y-2"><Label>League</Label><Input value={editing.league ?? ""} onChange={(e) => setEditing({ ...editing, league: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={editing.sport} onValueChange={(v) => setEditing({ ...editing, sport: v as Sport })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Match Date</Label><Input type="date" value={editing.match_date ?? ""} onChange={(e) => setEditing({ ...editing, match_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Match Time</Label><Input value={editing.match_time ?? ""} onChange={(e) => setEditing({ ...editing, match_time: e.target.value })} placeholder="20:00" /></div>
              <div className="space-y-2"><Label>Prediction Label</Label><Input value={editing.prediction_label ?? ""} onChange={(e) => setEditing({ ...editing, prediction_label: e.target.value })} placeholder="BTTS" /></div>
              <div className="space-y-2"><Label>Odds</Label><Input type="number" step="0.01" value={editing.odds ?? 0} onChange={(e) => setEditing({ ...editing, odds: parseFloat(e.target.value) })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Prediction Text</Label><Textarea rows={2} value={editing.prediction_text ?? ""} onChange={(e) => setEditing({ ...editing, prediction_text: e.target.value })} /></div>
              <div className="space-y-2"><Label>Confidence (%)</Label><Input type="number" value={editing.confidence ?? ""} onChange={(e) => setEditing({ ...editing, confidence: e.target.value ? parseInt(e.target.value) : null })} /></div>
              <div className="space-y-2">
                <Label>Result</Label>
                <Select value={editing.result} onValueChange={(v) => setEditing({ ...editing, result: v as MatchResult })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={editing.tier} onValueChange={(v) => setEditing({ ...editing, tier: v as MatchTier })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="members">Members</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2 pt-2">
                <Switch checked={!!editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <Label>Published</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Console;
