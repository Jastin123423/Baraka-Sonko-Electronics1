// Messages.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

type SmsContact = {
  id: string;
  name?: string;
  phone: string;
  subscribed: boolean;
  source?: 'manual' | 'paste' | 'csv' | 'woocommerce' | 'api';
  tags?: string[];
  created_at?: string;
};

type CampaignLog = {
  id: string;
  title: string;
  message: string;
  recipients: number;
  status: 'draft' | 'queued' | 'sending' | 'completed' | 'failed';
  created_at: string;
};

type RecipientMode = 'all' | 'selected' | 'subscribed';

type MessageSection = 
  | 'compose' 
  | 'contacts' 
  | 'import' 
  | 'campaigns' 
  | 'templates' 
  | 'settings';

type MessageSettings = {
  sender_id?: string;
  default_country_code?: string;
  unsubscribe_text?: string;
  batch_size?: number;
  provider?: string;
};

type MessageTemplate = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
};

const Messages: React.FC = () => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [contacts, setContacts] = useState<SmsContact[]>([]);
  const [search, setSearch] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('subscribed');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeSection, setActiveSection] = useState<MessageSection>('compose');
  const [importInfo, setImportInfo] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [settings, setSettings] = useState<MessageSettings>({
    sender_id: '',
    default_country_code: '+255',
    unsubscribe_text: 'Reply STOP to unsubscribe',
    batch_size: 200,
    provider: 'africastalking',
  });
  const [contactsLoading, setContactsLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const res = await fetch('/api/message-contacts');
      if (!res.ok) throw new Error('Failed to load contacts');
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to load contacts');
      setContacts(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const res = await fetch('/api/messages/campaigns');
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to load campaigns');
      setCampaigns(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await fetch('/api/messages/templates');
      if (!res.ok) throw new Error('Failed to load templates');
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to load templates');
      setTemplates(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await fetch('/api/messages/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Failed to load settings');
      setSettings({
        sender_id: data.data?.sender_id || '',
        default_country_code: data.data?.default_country_code || '+255',
        unsubscribe_text: data.data?.unsubscribe_text || 'Reply STOP to unsubscribe',
        batch_size: Number(data.data?.batch_size || 200),
        provider: data.data?.provider || 'africastalking',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchCampaigns();
    fetchTemplates();
    fetchSettings();
  }, []);

  const cleanPhone = (value: string) => {
    let v = String(value || '').trim();
    v = v.replace(/[^\d+]/g, '');
    if (!v) return '';
    if (v.startsWith('00')) v = `+${v.slice(2)}`;
    if (!v.startsWith('+') && v.startsWith('0')) {
      if (v.length >= 10) v = `+255${v.slice(1)}`;
    }
    if (!v.startsWith('+') && /^\d+$/.test(v)) {
      if (v.startsWith('255')) v = `+${v}`;
      else if (v.length >= 9) v = `+${v}`;
    }
    return v;
  };

  const isValidPhone = (value: string) => {
    const v = cleanPhone(value);
    return /^\+\d{9,15}$/.test(v);
  };

  const createId = () =>
    `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const addContact = async (
    phone: string,
    name = '',
    source: SmsContact['source'] = 'manual'
  ) => {
    const cleaned = cleanPhone(phone);
    if (!isValidPhone(cleaned)) return false;
    
    const exists = contacts.some(c => c.phone === cleaned);
    if (exists) return true;

    const res = await fetch('/api/message-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        phone: cleaned,
        source,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to add contact');
    }
    await fetchContacts();
    return true;
  };

  const handleAddManual = async () => {
    setError('');
    setSuccess('');
    
    if (!manualPhone.trim()) {
      setError('Please enter customer phone number');
      return;
    }

    try {
      const ok = await addContact(manualPhone, manualName, 'manual');
      if (!ok) {
        setError('Invalid phone number format. Use format like +255712345678');
        return;
      }
      setManualName('');
      setManualPhone('');
      setSuccess('Customer number added successfully');
    } catch (err: any) {
      setError(err?.message || 'Failed to add number');
    }
  };

  const parseBulkNumbers = async () => {
    setError('');
    setSuccess('');
    setImportInfo('');

    if (!bulkNumbers.trim()) {
      setError('Paste numbers first');
      return;
    }

    const lines = bulkNumbers
      .split(/[\n,;]+/g)
      .map(s => s.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const contactsToImport: Array<{ name?: string; phone: string }> = [];
    let invalid = 0;

    lines.forEach((line) => {
      const cleaned = cleanPhone(line);
      if (!isValidPhone(cleaned)) {
        invalid += 1;
        return;
      }
      if (seen.has(cleaned)) return;
      seen.add(cleaned);
      contactsToImport.push({ phone: cleaned });
    });

    try {
      const res = await fetch('/api/message-contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: contactsToImport,
          source: 'paste',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to import contacts');
      }
      await fetchContacts();
      setImportInfo(`Imported ${contactsToImport.length} number(s). Invalid skipped: ${invalid}.`);
      setBulkNumbers('');
    } catch (err: any) {
      setError(err?.message || 'Failed to import pasted numbers');
    }
  };

  const parseCsvText = async (text: string) => {
    const rows = text.split(/\r?\n/).filter(Boolean);
    const contactsToImport: Array<{ name?: string; phone: string }> = [];
    let invalid = 0;

    rows.forEach((row, index) => {
      const cols = row.split(',').map(v => v.trim());
      if (index === 0) {
        const joined = cols.join(' ').toLowerCase();
        if (joined.includes('phone') || joined.includes('mobile') || joined.includes('name')) {
          return;
        }
      }
      let name = '';
      let phone = '';
      if (cols.length === 1) {
        phone = cols[0];
      } else {
        name = cols[0];
        phone = cols[1];
      }
      const cleaned = cleanPhone(phone);
      if (!isValidPhone(cleaned)) {
        invalid += 1;
        return;
      }
      contactsToImport.push({ name, phone: cleaned });
    });

    const res = await fetch('/api/message-contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: contactsToImport,
        source: 'csv',
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Failed to import CSV');
    }
    await fetchContacts();
    setImportInfo(`CSV imported ${contactsToImport.length} contact(s). Invalid skipped: ${invalid}.`);
  };

  const onCsvPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    
    try {
      const text = await file.text();
      await parseCsvText(text);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to read CSV file');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = contacts;
    if (showOnlySelected) {
      list = list.filter(c => selectedIds.has(c.id));
    }
    if (!q) return list;
    return list.filter(contact => {
      const name = String(contact.name || '').toLowerCase();
      const phone = String(contact.phone || '').toLowerCase();
      const source = String(contact.source || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || source.includes(q);
    });
  }, [contacts, search, selectedIds, showOnlySelected]);

  const selectedContacts = useMemo(() => {
    return contacts.filter(c => selectedIds.has(c.id));
  }, [contacts, selectedIds]);

  const recipients = useMemo(() => {
    if (recipientMode === 'all') return contacts;
    if (recipientMode === 'selected') return contacts.filter(c => selectedIds.has(c.id));
    return contacts.filter(c => c.subscribed);
  }, [contacts, recipientMode, selectedIds]);

  const smsLength = message.length;
  const smsSegments = useMemo(() => {
    if (!message.trim()) return 0;
    if (message.length <= 160) return 1;
    return Math.ceil(message.length / 153);
  }, [message]);

  const estimatedRecipients = recipients.length;
  const estimatedMessages = smsSegments * estimatedRecipients;

  const toggleSubscribe = async (id: string) => {
    try {
      const contact = contacts.find(c => c.id === id);
      if (!contact) return;
      
      const res = await fetch(`/api/message-contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed: !contact.subscribed,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to update contact');
      }
      await fetchContacts();
    } catch (err: any) {
      setError(err?.message || 'Failed to update subscription');
    }
  };

  const removeContact = async (id: string) => {
    try {
      const res = await fetch(`/api/message-contacts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to delete contact');
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchContacts();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove contact');
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredContacts.forEach(c => next.add(c.id));
      return next;
    });
  };

  const clearSelected = () => {
    setSelectedIds(new Set());
  };

  const removeAllContacts = async () => {
    const ok = window.confirm('Are you sure you want to remove all contacts?');
    if (!ok) return;
    
    try {
      const ids = contacts.map(c => c.id);
      const res = await fetch('/api/message-contacts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to remove all contacts');
      }
      setSelectedIds(new Set());
      await fetchContacts();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove all contacts');
    }
  };

  const handleSend = async () => {
    setError('');
    setSuccess('');

    if (!campaignTitle.trim()) {
      setError('Please enter campaign title');
      return;
    }

    if (!message.trim()) {
      setError('Please type message first');
      return;
    }

    if (estimatedRecipients === 0) {
      setError('No recipients selected');
      return;
    }

    try {
      setSending(true);
      
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignTitle.trim(),
          message: message.trim(),
          recipient_mode: recipientMode,
          selected_ids: Array.from(selectedIds),
          provider: settings.provider || 'africastalking',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to send campaign');
      }
      
      await fetchCampaigns();
      setSuccess(
        `Campaign queued successfully for ${estimatedRecipients.toLocaleString()} recipient(s)`
      );
      setCampaignTitle('');
      setMessage('');
      setActiveSection('campaigns');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to queue SMS campaign');
    } finally {
      setSending(false);
    }
  };

  const appendToMessage = (value: string) => {
    setMessage(prev => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${value}`);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFF7F0_0%,#FFF3EA_40%,#FFF8F4_100%)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-800">SMS Messages Center</h1>
          <p className="text-sm text-gray-500 mt-2">
            Professional customer messaging for offers, arrivals, and promotions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Contacts</p>
            <p className="text-2xl font-black text-gray-900">{contacts.length.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Subscribed</p>
            <p className="text-2xl font-black text-[#FF6A00]">{contacts.filter(c => c.subscribed).length.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Selected</p>
            <p className="text-2xl font-black text-gray-900">{selectedIds.size.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">SMS Units</p>
            <p className="text-2xl font-black text-[#FF6A00]">{estimatedMessages.toLocaleString()}</p>
          </div>
        </div>

        {/* Horizontal Menu */}
        <div className="border-b border-orange-200 mb-8">
          <div className="flex flex-wrap gap-1">
            {[
              ['compose', '✏️ Compose'],
              ['contacts', '📇 Contacts'],
              ['import', '📥 Import'],
              ['campaigns', '📊 Campaigns'],
              ['templates', '📋 Templates'],
              ['settings', '⚙️ Settings'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as MessageSection)}
                className={`px-6 py-3 text-sm font-black rounded-t-2xl transition-all ${
                  activeSection === key
                    ? 'bg-white text-[#FF6A00] border-t-2 border-l-2 border-r-2 border-orange-200 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        {(error || success || importInfo) && (
          <div className="space-y-3 mb-6">
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-bold text-green-700">
                {success}
              </div>
            )}
            {importInfo && (
              <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-bold text-blue-700">
                {importInfo}
              </div>
            )}
          </div>
        )}

        {/* Compose Section */}
        {activeSection === 'compose' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                  Campaign Title
                </label>
                <input
                  className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-base font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                  placeholder="Example: Weekend Offers April"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                  Recipients
                </label>
                <select
                  value={recipientMode}
                  onChange={(e) => setRecipientMode(e.target.value as RecipientMode)}
                  className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                >
                  <option value="subscribed">Subscribed ({contacts.filter(c => c.subscribed).length})</option>
                  <option value="selected">Selected ({selectedIds.size})</option>
                  <option value="all">All ({contacts.length})</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => appendToMessage('{name}')}
                className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-black text-[#FF6A00] hover:bg-orange-100 transition"
              >
                + Customer Name
              </button>
              <button
                onClick={() => appendToMessage('{shop_name}')}
                className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-black text-[#FF6A00] hover:bg-orange-100 transition"
              >
                + Shop Name
              </button>
              <button
                onClick={() => appendToMessage('{link}')}
                className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-black text-[#FF6A00] hover:bg-orange-100 transition"
              >
                + Product Link
              </button>
              <button
                onClick={() => appendToMessage(settings.unsubscribe_text || 'Reply STOP to unsubscribe')}
                className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-black text-[#FF6A00] hover:bg-orange-100 transition"
              >
                + Unsubscribe Text
              </button>
              <button
                onClick={() => setMessage('')}
                className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-black text-red-600 hover:bg-red-100 transition"
              >
                Clear Message
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                SMS Message
              </label>
              <textarea
                className="w-full min-h-[400px] bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-base text-gray-800 font-semibold leading-7 outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hello {name}, new products are now available at Baraka Sonko Electronics. Some items are on offer today. Visit our shop now.`}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Characters</p>
                <p className="text-2xl font-black text-gray-900">{smsLength}</p>
              </div>
              <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Segments</p>
                <p className="text-2xl font-black text-[#FF6A00]">{smsSegments}</p>
              </div>
              <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Recipients</p>
                <p className="text-2xl font-black text-gray-900">{estimatedRecipients.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl border border-orange-100 p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase">Total SMS</p>
                <p className="text-2xl font-black text-[#FF6A00]">{estimatedMessages.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-5">
              <h3 className="text-sm font-black text-gray-800 mb-3">📱 Live Preview</h3>
              <div className="bg-white rounded-2xl border border-orange-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A00] to-[#FF9A3D] flex items-center justify-center text-white font-bold shadow-md">
                    BS
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Baraka Sonko</p>
                    <p className="text-xs text-gray-400">SMS Preview</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-4 text-sm text-gray-700 leading-7 whitespace-pre-wrap">
                  {message.trim() ? message.replace(/\{name\}/gi, 'Customer') : 'Your SMS preview will appear here...'}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-gradient-to-r from-[#FF6A00] to-[#FF8A2B] text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {sending ? 'SENDING CAMPAIGN...' : '📨 SEND SMS CAMPAIGN'}
              </button>
              <button
                onClick={async () => {
                  try {
                    setError('');
                    setSuccess('');
                    const res = await fetch('/api/messages/campaigns', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: campaignTitle || 'Untitled Draft',
                        message,
                        recipient_mode: recipientMode,
                        selected_ids: Array.from(selectedIds),
                        status: 'draft',
                      }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok || !data?.success) {
                      throw new Error(data?.error || 'Failed to save draft');
                    }
                    await fetchCampaigns();
                    setSuccess('Draft saved successfully');
                  } catch (err: any) {
                    setError(err?.message || 'Failed to save draft');
                  }
                }}
                className="sm:w-48 bg-white border-2 border-orange-200 text-gray-700 font-black py-4 rounded-2xl hover:bg-orange-50 transition-all"
              >
                💾 SAVE DRAFT
              </button>
            </div>
          </div>
        )}

        {/* Contacts Section */}
        {activeSection === 'contacts' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-black text-gray-800">Contact Management</h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="px-4 py-2 rounded-xl text-[11px] font-black bg-orange-50 text-[#FF6A00] border border-orange-200 hover:bg-orange-100 transition"
                >
                  Select Visible
                </button>
                <button
                  onClick={clearSelected}
                  className="px-4 py-2 rounded-xl text-[11px] font-black bg-white text-gray-600 border border-orange-200 hover:bg-gray-50 transition"
                >
                  Clear Selected
                </button>
                <button
                  onClick={removeAllContacts}
                  className="px-4 py-2 rounded-xl text-[11px] font-black bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                >
                  Remove All
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone, or source..."
                  className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                />
              </div>
              <button
                onClick={() => setShowOnlySelected(v => !v)}
                className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all ${
                  showOnlySelected
                    ? 'bg-gradient-to-r from-[#FF6A00] to-[#FF8A2B] text-white shadow-md'
                    : 'bg-white text-gray-600 border-2 border-orange-200 hover:bg-orange-50'
                }`}
              >
                {showOnlySelected ? 'Selected Only' : 'Show All'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50 border-b border-orange-100">
                    <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                      <th className="py-4 px-4">Select</th>
                      <th className="py-4 px-4">Name</th>
                      <th className="py-4 px-4">Phone</th>
                      <th className="py-4 px-4">Source</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Actions</th>
                    </table>
                  </thead>
                  <tbody>
                    {contactsLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                          Loading contacts...
                        </td>
                      </tr>
                    ) : filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                          No contacts found
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr key={contact.id} className="border-b border-orange-50 hover:bg-orange-50/30 transition">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => toggleSelect(contact.id)}
                              className="w-4 h-4 rounded border-orange-300 accent-orange-500"
                            />
                          </td>
                          <td className="py-4 px-4 font-black text-gray-800">
                            {contact.name?.trim() || 'Unnamed Customer'}
                          </td>
                          <td className="py-4 px-4 font-semibold text-gray-600">{contact.phone}</td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-200 uppercase">
                              {contact.source || 'manual'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                              contact.subscribed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {contact.subscribed ? 'Subscribed' : 'Opted Out'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleSubscribe(contact.id)}
                                className="text-[10px] font-black px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                              >
                                {contact.subscribed ? 'Mute' : 'Enable'}
                              </button>
                              <button
                                onClick={() => removeContact(contact.id)}
                                className="text-[10px] font-black px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Import Section */}
        {activeSection === 'import' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-800">Import Contacts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-orange-100 p-6">
                <h3 className="text-lg font-black text-gray-800 mb-4">Manual Add</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                      Customer Name
                    </label>
                    <input
                      className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                      placeholder="Optional name"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                      Phone Number
                    </label>
                    <input
                      className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                      placeholder="+255712345678"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAddManual}
                    className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A2B] text-white font-black py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
                  >
                    + ADD NUMBER
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-orange-100 p-6">
                <h3 className="text-lg font-black text-gray-800 mb-4">Bulk Import</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                      Bulk Paste Numbers
                    </label>
                    <textarea
                      className="w-full min-h-[180px] bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all resize-y"
                      placeholder={`+255712345678\n0712345678\n+255754123456`}
                      value={bulkNumbers}
                      onChange={(e) => setBulkNumbers(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={parseBulkNumbers}
                      className="flex-1 bg-gradient-to-r from-[#FF6A00] to-[#FF8A2B] text-white font-black py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
                    >
                      IMPORT NUMBERS
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 bg-white border-2 border-orange-200 text-gray-700 font-black py-4 rounded-2xl hover:bg-orange-50 transition-all"
                    >
                      UPLOAD CSV
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={onCsvPicked}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Section */}
        {activeSection === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800">Campaign History</h2>
              <button
                onClick={fetchCampaigns}
                className="px-4 py-2 rounded-xl text-[11px] font-black bg-orange-50 text-[#FF6A00] border border-orange-200 hover:bg-orange-100 transition"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50 border-b border-orange-100">
                    <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                      <th className="py-4 px-4">Title</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Recipients</th>
                      <th className="py-4 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignsLoading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400 font-bold">
                          Loading campaigns...
                        </td>
                      </tr>
                    ) : campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400 font-bold">
                          No campaigns yet
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b border-orange-50 hover:bg-orange-50/30 transition">
                          <td className="py-4 px-4 font-black text-gray-800">{campaign.title}</td>
                          <td className="py-4 px-4">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                              campaign.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : campaign.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : campaign.status === 'sending'
                                    ? 'bg-blue-100 text-blue-700'
                                    : campaign.status === 'queued'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-700'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-gray-600">
                            {campaign.recipients?.toLocaleString?.() || 0}
                          </td>
                          <td className="py-4 px-4 text-gray-500">
                            {campaign.created_at ? new Date(campaign.created_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Templates Section */}
        {activeSection === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-800">Message Templates</h2>
              <button
                onClick={fetchTemplates}
                className="px-4 py-2 rounded-xl text-[11px] font-black bg-orange-50 text-[#FF6A00] border border-orange-200 hover:bg-orange-100 transition"
              >
                🔄 Refresh
              </button>
            </div>
            {templatesLoading ? (
              <div className="bg-white rounded-2xl border border-orange-100 p-12 text-center text-gray-400 font-bold">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-orange-100 p-12 text-center text-gray-400 font-bold">
                No templates yet
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="bg-white rounded-2xl border border-orange-100 p-6 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-gray-800">{tpl.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {tpl.created_at ? new Date(tpl.created_at).toLocaleString() : ''}
                        </p>
                        <div className="mt-3 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-7 whitespace-pre-wrap">
                          {tpl.content}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCampaignTitle(tpl.title);
                          setMessage(tpl.content);
                          setActiveSection('compose');
                        }}
                        className="px-4 py-2 rounded-xl text-[11px] font-black bg-white border-2 border-orange-200 text-[#FF6A00] hover:bg-orange-50 transition whitespace-nowrap"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-800">SMS Settings</h2>
            <div className="bg-white rounded-2xl border border-orange-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                    Sender ID
                  </label>
                  <input
                    value={settings.sender_id || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, sender_id: e.target.value }))}
                    className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                    placeholder="BARAKA"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                    Default Country Code
                  </label>
                  <input
                    value={settings.default_country_code || '+255'}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_country_code: e.target.value }))}
                    className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                    placeholder="+255"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                    Provider
                  </label>
                  <input
                    value={settings.provider || 'africastalking'}
                    onChange={(e) => setSettings(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                    placeholder="africastalking"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    value={settings.batch_size || 200}
                    onChange={(e) => setSettings(prev => ({ ...prev, batch_size: Number(e.target.value || 200) }))}
                    className="w-full bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all"
                    placeholder="200"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-wide">
                  Unsubscribe Text
                </label>
                <textarea
                  value={settings.unsubscribe_text || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, unsubscribe_text: e.target.value }))}
                  className="w-full min-h-[100px] bg-white border-2 border-orange-200 rounded-2xl px-5 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all resize-y"
                  placeholder="Reply STOP to unsubscribe"
                />
              </div>
              <div className="mt-6">
                <button
                  onClick={async () => {
                    try {
                      setError('');
                      setSuccess('');
                      const res = await fetch('/api/messages/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(settings),
                      });
                      const data = await res.json().catch(() => null);
                      if (!res.ok || !data?.success) {
                        throw new Error(data?.error || 'Failed to save settings');
                      }
                      setSuccess('Settings saved successfully');
                      await fetchSettings();
                    } catch (err: any) {
                      setError(err?.message || 'Failed to save settings');
                    }
                  }}
                  className="bg-gradient-to-r from-[#FF6A00] to-[#FF8A2B] text-white font-black py-4 px-8 rounded-2xl shadow-md hover:shadow-lg transition-all"
                >
                  💾 SAVE SETTINGS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
