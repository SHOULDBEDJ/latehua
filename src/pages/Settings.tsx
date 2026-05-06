import { useState, useEffect } from "react";
import { useDB } from "@/lib/useDB";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Download, Upload, Trash2, Palette, RotateCcw, MessageSquare, Plus, Pencil, Globe } from "lucide-react";
import { exportAll, importAll, deleteAll } from "@/lib/db";
import { useTheme, PRESET_COLORS } from "@/lib/ThemeContext";
import { useFieldSettings } from "@/lib/FieldSettingsContext";
import { Switch } from "@/components/ui/switch";
import { UserManagement } from "@/components/UserManagement";
import { toast } from "sonner";
import { WATemplate } from "@/lib/db";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  const { data, loading, update, refresh } = useDB();
  const { t, lang, setLang } = useApp();
  const { has } = useAuth();
  const { color, setColor, reset: resetColor } = useTheme();
  const { showCalendarMarks, setShowCalendarMarks } = useFieldSettings();
  const [newType, setNewType] = useState("");
  const [confirmDel, setConfirmDel] = useState("");
  const [editingTpl, setEditingTpl] = useState<WATemplate | null>(null);
  const [tplForm, setTplForm] = useState({ name: "", body: "" });
  const [showTplDialog, setShowTplDialog] = useState(false);

  if (loading || !data) return <div className="text-center py-10">{t("loading")}</div>;

  const addType = async () => {
    const v = newType.trim();
    if (!v || data.functionTypes.includes(v)) return;
    await update((d) => ({ ...d, functionTypes: [...d.functionTypes, v] }));
    setNewType("");
  };

  const remove = async (n: string) => {
    await update((d) => ({ ...d, functionTypes: d.functionTypes.filter((x) => x !== n) }));
  };

  const doBackup = async () => {
    const json = await exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shiva-shakti-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doRestore = async (file: File) => {
    try {
      const txt = await file.text();
      await importAll(txt);
      await refresh();
      toast.success(t("saved"));
    } catch {
      toast.error("Invalid backup file");
    }
  };

  const doDelete = async () => {
    if (confirmDel !== "DELETE") return;
    await deleteAll();
    await refresh();
    setConfirmDel("");
    toast.success(t("deleted"));
    setTimeout(() => window.location.reload(), 500);
  };
  const saveTpl = async () => {
    if (!tplForm.name || !tplForm.body) return;
    const tpl: WATemplate = {
      id: editingTpl?.id || crypto.randomUUID(),
      name: tplForm.name,
      body: tplForm.body,
    };
    await update((d) => ({
      ...d,
      waTemplates: editingTpl 
        ? d.waTemplates.map((t) => t.id === editingTpl.id ? tpl : t)
        : [...d.waTemplates, tpl]
    }));
    setShowTplDialog(false);
    setEditingTpl(null);
    setTplForm({ name: "", body: "" });
    toast.success("Template saved");
  };

  const removeTpl = async (id: string) => {
    await update((d) => ({ ...d, waTemplates: d.waTemplates.filter((t) => t.id !== id) }));
    toast.success("Template removed");
  };

  const openEditTpl = (t: WATemplate) => {
    setEditingTpl(t);
    setTplForm({ name: t.name, body: t.body });
    setShowTplDialog(true);
  };

  // Language local state
  const [localLang, setLocalLang] = useState(lang);
  useEffect(() => { setLocalLang(lang); }, [lang]);
  const saveLang = () => {
    setLang(localLang);
    toast.success("Language saved");
  };

  // Theme local state
  const [localColor, setLocalColor] = useState(color);
  useEffect(() => { setLocalColor(color); }, [color]);
  const saveTheme = () => {
    setColor(localColor);
    toast.success("Theme saved");
  };


  // Calendar local state
  const [localCalMarks, setLocalCalMarks] = useState(showCalendarMarks);
  useEffect(() => { setLocalCalMarks(showCalendarMarks); }, [showCalendarMarks]);

  const saveCal = () => {
    setShowCalendarMarks(localCalMarks);
    toast.success("Calendar settings saved");
  };

  const [bizForm, setBizForm] = useState({ 
    name: data.business.name, 
    url: data.business.websiteUrl || "" 
  });

  useEffect(() => {
    setBizForm({
      name: data.business.name,
      url: data.business.websiteUrl || ""
    });
  }, [data.business]);

  const saveBiz = async () => {
    await update((d) => ({ 
      ...d, 
      business: { ...d.business, name: bizForm.name, websiteUrl: bizForm.url } 
    }));
    toast.success("Business details saved");
  };

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-2xl font-bold">{t("settings")}</h2>

      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{t("language")}</h3>
          <Button size="sm" onClick={saveLang} className="bg-gradient-primary">
            Save
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant={localLang === "en" ? "default" : "outline"} onClick={() => setLocalLang("en")}>English</Button>
          <Button variant={localLang === "kn" ? "default" : "outline"} onClick={() => setLocalLang("kn")}>ಕನ್ನಡ</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Business Details
          </h3>
          <Button size="sm" onClick={saveBiz} className="bg-gradient-primary">
            Save
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-name">Business Name</Label>
          <Input 
            id="business-name"
            value={bizForm.name} 
            onChange={(e) => setBizForm(prev => ({ ...prev, name: e.target.value }))} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-url">Website URL</Label>
          <Input 
            id="business-url"
            value={bizForm.url} 
            onChange={(e) => setBizForm(prev => ({ ...prev, url: e.target.value }))} 
            placeholder="https://your-website.com"
          />
          <p className="text-[10px] text-muted-foreground">This link will appear on the Dashboard for quick access.</p>
        </div>
      </Card>

      {has("settings.manageUsers") && <UserManagement />}

      {has("settings.theme") && (
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2"><Palette className="h-4 w-4" /> Colour Theme</h3>
          <Button size="sm" onClick={saveTheme} className="bg-gradient-primary">
            Save
          </Button>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Preset Colours</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PRESET_COLORS.map((p) => (
              <button
                key={p.hex}
                type="button"
                onClick={() => setLocalColor(p.hex)}
                title={p.name}
                className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${
                  localColor.toLowerCase() === p.hex.toLowerCase() ? "border-foreground ring-2 ring-offset-2 ring-primary" : "border-border"
                }`}
                style={{ backgroundColor: p.hex }}
                aria-label={p.name}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Custom Colour</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={localColor}
              onChange={(e) => setLocalColor(e.target.value)}
              className="h-10 w-16 rounded cursor-pointer border border-border bg-transparent"
            />
            <Input
              value={localColor}
              onChange={(e) => {
                const v = e.target.value;
                setLocalColor(v);
              }}
              className="max-w-[140px] font-mono uppercase"
              maxLength={7}
            />
            <Button variant="outline" size="sm" onClick={() => { setLocalColor("#5B2A86"); setColor("#5B2A86"); }}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </Card>
      )}


      {has("settings.calendar") && (
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Calendar Settings</h3>
          <Button size="sm" onClick={saveCal} className="bg-gradient-primary">
            Save
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="cal-marks" className="cursor-pointer">Show booking marks on calendar dates</Label>
          <Switch
            id="cal-marks"
            checked={localCalMarks}
            onCheckedChange={setLocalCalMarks}
          />
        </div>
      </Card>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> WhatsApp Templates
          </h3>
          <Button size="sm" onClick={() => { setEditingTpl(null); setTplForm({ name: "", body: "" }); setShowTplDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Template
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Customise messages for quick sharing. Use {"{customerName}"}, {"{bookingId}"}, {"{deliveryDate}"}, {"{amount}"} as placeholders.</p>
        <div className="space-y-2">
          {data.waTemplates.map((t) => (
            <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
              <div className="min-w-0 pr-4">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-md">{t.body}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEditTpl(t)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeTpl(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={showTplDialog} onOpenChange={setShowTplDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTpl ? "Edit Template" : "New WhatsApp Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Template Name</Label>
              <Input 
                value={tplForm.name} 
                onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} 
                placeholder="e.g. Confirmed" 
              />
            </div>
            <div className="space-y-1">
              <Label>Message Body</Label>
              <Textarea 
                value={tplForm.body} 
                onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })} 
                placeholder="Type your message here..."
                className="h-32"
              />
              <p className="text-[10px] text-muted-foreground">Available placeholders: {"{customerName}"}, {"{bookingId}"}, {"{deliveryDate}"}, {"{amount}"}, {"{place}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTplDialog(false)}>Cancel</Button>
            <Button onClick={saveTpl} className="bg-gradient-primary">Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {has("settings.manageTypes") && (
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{t("functionTypes")}</h3>
          <Button size="sm" variant="default" onClick={async () => {
            await update((d) => ({ ...d, functionTypes: data.functionTypes }));
            toast.success("Function types saved");
          }} className="bg-gradient-primary">
            Save All
          </Button>
        </div>
        <div className="flex gap-2">
          <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder={t("add")} />
          <Button onClick={addType}>{t("add")}</Button>
        </div>
        <div className="space-y-1">
          {data.functionTypes.map((ft) => (
            <div key={ft} className="flex justify-between items-center p-2 border rounded">
              <span>{ft}</span>
              <Button size="icon" variant="ghost" onClick={() => remove(ft)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </Card>
      )}

      {(has("settings.backup") || has("settings.restore") || has("settings.deleteAll")) && (
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">{t("dataManagement")}</h3>
        <div className="flex flex-wrap gap-2">
          {has("settings.backup") && (
            <Button onClick={doBackup} variant="secondary"><Download className="h-4 w-4 mr-1" /> {t("backup")}</Button>
          )}
          {has("settings.restore") && (
            <label>
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && doRestore(e.target.files[0])}
              />
              <span className="inline-flex items-center cursor-pointer bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80">
                <Upload className="h-4 w-4 mr-1" /> {t("restore")}
              </span>
            </label>
          )}
        </div>

        {has("settings.deleteAll") && (
          <div className="border-t pt-3 space-y-2">
            <Label className="text-destructive">{t("deleteAll")}</Label>
            <div className="flex gap-2">
              <Input
                value={confirmDel}
                onChange={(e) => setConfirmDel(e.target.value)}
                placeholder={t("typeDelete")}
              />
              <Button variant="destructive" onClick={doDelete} disabled={confirmDel !== "DELETE"}>
                <Trash2 className="h-4 w-4 mr-1" /> {t("confirm")}
              </Button>
            </div>
          </div>
        )}
      </Card>
      )}
    </div>
  );
}
