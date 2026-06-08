'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, CheckCircle2,
  Search, X, GripVertical, Printer,
} from 'lucide-react';

type Recipe = { id: string; name: string; type: string };

type MenuItem = {
  id: string;
  recipeId: string;
  name: string;
  price: string;
  description: string;
};

type MenuSection = {
  id: string;
  name: string;
  items: MenuItem[];
};

interface Props {
  menu: { id: string; name: string; data: object };
  recipes: Recipe[];
  userId: string;
  preloadRecipeId?: string;
  preloadRecipeName?: string;
}

function uid() { return Math.random().toString(36).slice(2); }

function parseData(data: object): MenuSection[] {
  const d = data as { sections?: Array<{ id?: string; name?: string; items?: Array<{ id?: string; recipeId?: string; name?: string; price?: number; description?: string }> }> };
  return (d.sections ?? []).map((s) => ({
    id: s.id ?? uid(),
    name: s.name ?? '',
    items: (s.items ?? []).map((item) => ({
      id: item.id ?? uid(),
      recipeId: item.recipeId ?? '',
      name: item.name ?? '',
      price: item.price !== undefined ? String(item.price) : '',
      description: item.description ?? '',
    })),
  }));
}

export default function MenuClient({ menu, recipes, userId, preloadRecipeId, preloadRecipeName }: Props) {
  const [menuName, setMenuName] = useState(menu.name || 'Nouveau menu');
  const [sections, setSections] = useState<MenuSection[]>(() => {
    const parsed = parseData(menu.data);
    if (preloadRecipeId) {
      const recipeName = preloadRecipeName ?? recipes.find((r) => r.id === preloadRecipeId)?.name ?? '';
      const newItem: MenuItem = { id: uid(), recipeId: preloadRecipeId, name: recipeName, price: '', description: '' };
      if (parsed.length === 0) {
        return [{ id: uid(), name: 'Cocktails', items: [newItem] }];
      }
      const updated = [...parsed];
      updated[updated.length - 1] = { ...updated[updated.length - 1], items: [...updated[updated.length - 1].items, newItem] };
      return updated;
    }
    return parsed;
  });
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [pickerSection, setPickerSection] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Auto-save when preload was applied
  const didPreload = useRef(false);
  useEffect(() => {
    if (preloadRecipeId && !didPreload.current) {
      didPreload.current = true;
      void save(sections, menuName);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerSection(null);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredRecipes = pickerSearch.trim()
    ? recipes.filter((r) => r.name.toLowerCase().includes(pickerSearch.toLowerCase()))
    : recipes;

  async function save(secs: MenuSection[], name: string) {
    setSaving(true);
    const data = {
      sections: secs.map((s) => ({
        id: s.id, name: s.name,
        items: s.items.map((item) => ({
          id: item.id, recipeId: item.recipeId, name: item.name,
          price: item.price !== '' ? parseFloat(item.price) : undefined,
          description: item.description || undefined,
        })),
      })),
    };
    const sb = createClient();
    await sb.from('menus').update({ name, data, updated_at: new Date().toISOString() }).eq('id', menu.id).eq('user_id', userId);
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2000);
  }

  function addSection() {
    const s: MenuSection = { id: uid(), name: 'Nouvelle section', items: [] };
    setSections((p) => [...p, s]);
  }

  function removeSection(sId: string) {
    setSections((p) => p.filter((s) => s.id !== sId));
  }

  function updateSectionName(sId: string, name: string) {
    setSections((p) => p.map((s) => s.id === sId ? { ...s, name } : s));
  }

  function moveSection(sId: string, dir: -1 | 1) {
    setSections((p) => {
      const idx = p.findIndex((s) => s.id === sId);
      if (idx < 0) return p;
      const n = [...p];
      const target = idx + dir;
      if (target < 0 || target >= n.length) return p;
      [n[idx], n[target]] = [n[target], n[idx]];
      return n;
    });
  }

  function addItem(sId: string, recipe: Recipe) {
    const item: MenuItem = { id: uid(), recipeId: recipe.id, name: recipe.name, price: '', description: '' };
    setSections((p) => p.map((s) => s.id === sId ? { ...s, items: [...s.items, item] } : s));
    setPickerSection(null);
    setPickerSearch('');
  }

  function removeItem(sId: string, itemId: string) {
    setSections((p) => p.map((s) => s.id === sId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s));
  }

  function updateItem(sId: string, itemId: string, field: keyof MenuItem, value: string) {
    setSections((p) => p.map((s) => s.id === sId
      ? { ...s, items: s.items.map((i) => i.id === itemId ? { ...i, [field]: value } : i) }
      : s));
  }

  function moveItem(sId: string, itemId: string, dir: -1 | 1) {
    setSections((p) => p.map((s) => {
      if (s.id !== sId) return s;
      const idx = s.items.findIndex((i) => i.id === itemId);
      if (idx < 0) return s;
      const n = [...s.items];
      const target = idx + dir;
      if (target < 0 || target >= n.length) return s;
      [n[idx], n[target]] = [n[target], n[idx]];
      return { ...s, items: n };
    }));
  }

  return (
    <div className="space-y-5">
      {/* Menu name + actions */}
      <div className="flex items-center gap-3">
        <input
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          className="field-input flex-1 text-base font-semibold"
          placeholder="Nom du menu"
        />
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-ghost p-2.5 rounded-xl"
          title="Imprimer / Exporter PDF"
        >
          <Printer size={18} />
        </button>
        <button
          type="button"
          onClick={() => save(sections, menuName)}
          disabled={saving}
          className="btn-primary px-4 py-2.5 flex items-center gap-2 shrink-0"
        >
          {savedOk ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {savedOk ? 'Enregistré' : saving ? '...' : 'Enregistrer'}
        </button>
      </div>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <div key={section.id} className="card p-0 overflow-hidden">
          {/* Section header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--surface2)] border-b border-[var(--border)]">
            <GripVertical size={14} className="text-[var(--text-dim)] shrink-0" />
            <input
              value={section.name}
              onChange={(e) => updateSectionName(section.id, e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold text-[var(--text)] focus:outline-none placeholder:text-[var(--text-dim)]"
              placeholder="Nom de la section"
            />
            <button type="button" onClick={() => moveSection(section.id, -1)} disabled={sIdx === 0}
              className="p-1 text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-30">
              <ChevronUp size={14} />
            </button>
            <button type="button" onClick={() => moveSection(section.id, 1)} disabled={sIdx === sections.length - 1}
              className="p-1 text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-30">
              <ChevronDown size={14} />
            </button>
            <button type="button" onClick={() => removeSection(section.id)}
              className="p-1 text-[var(--text-dim)] hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Items */}
          <div className="divide-y divide-[var(--border)]">
            {section.items.length === 0 && (
              <p className="px-4 py-4 text-xs text-[var(--text-dim)] text-center">Aucun cocktail dans cette section</p>
            )}
            {section.items.map((item, iIdx) => (
              <div key={item.id} className="px-4 py-3 space-y-2">
                {/* Row 1: name + price + reorder + remove */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button type="button" onClick={() => moveItem(section.id, item.id, -1)} disabled={iIdx === 0}
                      className="p-0.5 text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-30">
                      <ChevronUp size={12} />
                    </button>
                    <button type="button" onClick={() => moveItem(section.id, item.id, 1)} disabled={iIdx === section.items.length - 1}
                      className="p-0.5 text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-30">
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(section.id, item.id, 'name', e.target.value)}
                    className="field-input flex-1 text-sm font-medium"
                    placeholder="Nom du cocktail"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={item.price}
                      onChange={(e) => updateItem(section.id, item.id, 'price', e.target.value)}
                      placeholder="Prix"
                      className="field-input w-20 text-right text-sm"
                    />
                    <span className="text-xs text-[var(--text-dim)]">€</span>
                  </div>
                  <button type="button" onClick={() => removeItem(section.id, item.id)}
                    className="p-1.5 text-[var(--text-dim)] hover:text-red-400 shrink-0">
                    <X size={14} />
                  </button>
                </div>
                {/* Row 2: description */}
                <textarea
                  value={item.description}
                  onChange={(e) => updateItem(section.id, item.id, 'description', e.target.value)}
                  placeholder="Description client (optionnel)"
                  rows={2}
                  className="field-input w-full text-xs resize-none text-[var(--text-dim)]"
                />
              </div>
            ))}
          </div>

          {/* Add recipe to section */}
          <div className="px-4 py-3 border-t border-[var(--border)] relative" ref={pickerSection === section.id ? pickerRef : undefined}>
            <button
              type="button"
              onClick={() => { setPickerSection(pickerSection === section.id ? null : section.id); setPickerSearch(''); }}
              className="w-full flex items-center justify-center gap-2 text-xs text-[var(--text-dim)] hover:text-[var(--text)] py-1.5 border border-dashed border-[var(--border)] rounded-xl hover:border-[var(--border-hover)] transition-colors"
            >
              <Plus size={13} />
              Ajouter un cocktail
            </button>

            {pickerSection === section.id && (
              <div className="absolute left-0 right-0 bottom-full mb-1 mx-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="p-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2 field-input px-2 py-1.5">
                    <Search size={13} className="text-[var(--text-dim)] shrink-0" />
                    <input
                      autoFocus
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Rechercher une recette…"
                      className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--text)]"
                    />
                  </div>
                </div>
                <ul className="max-h-52 overflow-y-auto">
                  {filteredRecipes.length === 0 ? (
                    <li className="px-3 py-3 text-xs text-[var(--text-dim)] text-center">Aucun résultat</li>
                  ) : filteredRecipes.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => addItem(section.id, r)}
                        className="w-full text-left px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                      >
                        {r.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add section */}
      <button
        type="button"
        onClick={addSection}
        className="w-full py-3 flex items-center justify-center gap-2 text-sm text-[var(--text-dim)] hover:text-[var(--text)] border border-dashed border-[var(--border)] rounded-2xl hover:border-[var(--border-hover)] transition-colors"
      >
        <Plus size={15} />
        Ajouter une section
      </button>

      {/* Print stylesheet */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-menu { display: block !important; }
          header, nav, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}
