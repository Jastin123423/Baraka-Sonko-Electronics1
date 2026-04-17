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

const ORANGE = '#FF6A00';

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
  const [importInfo, setImportInfo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  useEffect(() => {
    try {
      const savedContacts = localStorage.getItem('barakasonko_sms_contacts_v1');
      const savedCampaigns = localStorage.getItem('barakasonko_sms_campaigns_v1');

      if (savedContacts) {
        const parsed = JSON.parse(savedContacts);
        if (Array.isArray(parsed)) setContacts(parsed);
      }

      if (savedCampaigns) {
        const parsed = JSON.parse(savedCampaigns);
        if (Array.isArray(parsed)) setCampaigns(parsed);
      }
    } catch (e) {
      console.error('Failed to restore messages data', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('barakasonko_sms_contacts_v1', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('barakasonko_sms_campaigns_v1', JSON.stringify(campaigns));
  }, [campaigns]);

  const cleanPhone = (value: string) => {
    let v = String(value || '').trim();

    v = v.replace(/[^\d+]/g, '');

    if (!v) return '';

    if (v.startsWith('00')) v = `+${v.slice(2)}`;
    if (!v.startsWith('+') && v.startsWith('0')) {
      // Tanzania local default convert e.g. 0712345678 => +255712345678
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

  const addContact = (phone: string, name = '', source: SmsContact['source'] = 'manual') => {
    const cleaned = cleanPhone(phone);
    if (!isValidPhone(cleaned)) return false;

    setContacts(prev => {
      const exists = prev.some(c => c.phone === cleaned);
      if (exists) return prev;

      return [
        {
          id: createId(),
          name: name.trim(),
          phone: cleaned,
          subscribed: true,
          source,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ];
    });

    return true;
  };

  const handleAddManual = () => {
    setError('');
    setSuccess('');

    if (!manualPhone.trim()) {
      setError('Please enter customer phone number');
      return;
    }

    const ok = addContact(manualPhone, manualName, 'manual');
    if (!ok) {
      setError('Invalid phone number format. Use format like +255712345678');
      return;
    }

    setManualName('');
    setManualPhone('');
    setSuccess('Customer number added successfully');
  };

  const parseBulkNumbers = () => {
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

    let added = 0;
    let invalid = 0;
    const seen = new Set<string>();

    lines.forEach((line) => {
      const cleaned = cleanPhone(line);
      if (!isValidPhone(cleaned)) {
        invalid += 1;
        return;
      }
      if (seen.has(cleaned)) return;
      seen.add(cleaned);

      const ok = addContact(cleaned, '', 'paste');
      if (ok) added += 1;
    });

    setImportInfo(`Imported ${added} number(s). Invalid skipped: ${invalid}.`);
    setBulkNumbers('');
  };

  const parseCsvText = (text: string) => {
    const rows = text.split(/\r?\n/).filter(Boolean);

    let added = 0;
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

      const ok = addContact(phone, name, 'csv');
      if (ok) added += 1;
      else invalid += 1;
    });

    setImportInfo(`CSV imported ${added} contact(s). Invalid skipped: ${invalid}.`);
  };

  const onCsvPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    try {
      const text = await file.text();
      parseCsvText(text);
    } catch (err) {
      console.error(err);
      setError('Failed to read CSV file');
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
      return (
        name.includes(q) ||
        phone.includes(q) ||
        source.includes(q)
      );
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

  const toggleSubscribe = (id: string) => {
    setContacts(prev =>
      prev.map(contact =>
        contact.id === id
          ? { ...contact, subscribed: !contact.subscribed }
          : contact
      )
    );
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  const removeAllContacts = () => {
    const ok = window.confirm('Are you sure you want to remove all contacts?');
    if (!ok) return;
    setContacts([]);
    setSelectedIds(new Set());
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

      const newCampaign: CampaignLog = {
        id: createId(),
        title: campaignTitle.trim(),
        message: message.trim(),
        recipients: estimatedRecipients,
        status: 'queued',
        created_at: new Date().toISOString(),
      };

      setCampaigns(prev => [newCampaign, ...prev]);

      // TODO: replace this with your backend API call
      // await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(...) });

      await new Promise(resolve => setTimeout(resolve, 900));

      setCampaigns(prev =>
        prev.map(item =>
          item.id === newCampaign.id
            ? { ...item, status: 'completed' }
            : item
        )
      );

      setSuccess(
        `Campaign queued successfully for ${estimatedRecipients.toLocaleString()} recipient(s)`
      );
      setCampaignTitle('');
      setMessage('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to queue SMS campaign');
    } finally {
      setSending(false);
    }
  };

  const statCard =
    'rounded-3xl border border-orange-100 bg-white shadow-[0_6px_20px_rgba(255,106,0,0.06)] p-5';

  const softCard =
    'rounded-3xl border border-orange-100 bg-white shadow-sm';

  const inputClass =
    'w-full bg-white border border-[#E5E7EB] rounded-2xl px-4 py-4 text-base font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all duration-200 shadow-sm';

  const smallInputClass =
    'w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 shadow-sm';

  const labelClass =
    'block text-[11px] font-black text-[#6B7280] uppercase mb-2 ml-1 tracking-[0.12em]';

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-orange-100 bg-[linear-gradient(135deg,#FFF7F0_0%,#FFFFFF_45%,#FFF4EB_100%)] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-800">SMS Messages Center</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add customer numbers, compose promotional SMS, and prepare campaigns professionally
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 rounded-full bg-white border border-orange-200 text-[11px] font-black text-[#FF6A00]">
              {contacts.length.toLocaleString()} Contacts
            </span>
            <span className="px-3 py-2 rounded-full bg-white border border-orange-200 text-[11px] font-black text-[#FF6A00]">
              {contacts.filter(c => c.subscribed).length.toLocaleString()} Subscribed
            </span>
            <span className="px-3 py-2 rounded-full bg-white border border-orange-200 text-[11px] font-black text-[#FF6A00]">
              {selectedIds.size.toLocaleString()} Selected
            </span>
          </div>
        </div>
      </div>

      {(error || success || importInfo) && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {success}
            </div>
          )}
          {importInfo && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              {importInfo}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={statCard}>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
            Total Contacts
          </p>
          <p className="text-3xl font-black text-gray-900">
            {contacts.length.toLocaleString()}
          </p>
        </div>

        <div className={statCard}>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
            Subscribed
          </p>
          <p className="text-3xl font-black text-[#FF6A00]">
            {contacts.filter(c => c.subscribed).length.toLocaleString()}
          </p>
        </div>

        <div className={statCard}>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
            Selected Recipients
          </p>
          <p className="text-3xl font-black text-gray-900">
            {selectedIds.size.toLocaleString()}
          </p>
        </div>

        <div className={statCard}>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.16em]">
            Estimated SMS Units
          </p>
          <p className="text-3xl font-black text-[#FF6A00]">
            {estimatedMessages.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[1.1fr_1.35fr] gap-6">
        <div className="space-y-6">
          <div className={`${softCard} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-800">Add Customer Numbers</h2>
              <span className="text-xs font-black px-3 py-1.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-100">
                Manual / Paste / CSV
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-[#FFF9F5] p-4">
                <h3 className="text-sm font-black text-gray-800 mb-3">Manual Add</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Customer Name</label>
                    <input
                      className={smallInputClass}
                      placeholder="Optional name"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Phone Number *</label>
                    <input
                      className={smallInputClass}
                      placeholder="+255712345678"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddManual}
                  className="mt-4 w-full md:w-auto bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white font-black py-3 px-6 rounded-2xl shadow-[0_10px_24px_rgba(255,106,0,0.22)] hover:shadow-[0_14px_28px_rgba(255,106,0,0.28)] active:scale-[0.98] transition-all"
                >
                  + ADD NUMBER
                </button>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-4">
                <h3 className="text-sm font-black text-gray-800 mb-3">Bulk Paste Numbers</h3>
                <textarea
                  className="w-full min-h-[180px] rounded-2xl border border-orange-200 bg-white px-4 py-4 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 shadow-sm resize-y"
                  placeholder={`Paste one number per line or separated by comma

Example:
+255712345678
0712345678
+255754123456`}
                  value={bulkNumbers}
                  onChange={(e) => setBulkNumbers(e.target.value)}
                />
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={parseBulkNumbers}
                    className="bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white font-black py-3 px-6 rounded-2xl shadow-[0_10px_24px_rgba(255,106,0,0.22)] hover:shadow-[0_14px_28px_rgba(255,106,0,0.28)] active:scale-[0.98] transition-all"
                  >
                    IMPORT PASTED NUMBERS
                  </button>

                  <button
                    onClick={() => fileRef.current?.click()}
                    className="bg-white border border-orange-200 text-gray-700 font-black py-3 px-6 rounded-2xl hover:border-orange-300 hover:bg-orange-50 transition-all"
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

              <div className="rounded-2xl border border-orange-100 bg-[#FFF7F0] p-4">
                <h3 className="text-sm font-black text-gray-800 mb-2">Import Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600 font-semibold">
                  <li>• Use international format like <span className="font-black">+255712345678</span></li>
                  <li>• Local numbers like <span className="font-black">0712345678</span> are auto-converted to Tanzania format</li>
                  <li>• Duplicates are skipped automatically</li>
                  <li>• CSV format can be: <span className="font-black">name,phone</span> or only <span className="font-black">phone</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`${softCard} p-5`}>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="text-lg font-black text-gray-800">Recipients</h2>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={selectAllFiltered}
                  className="px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] bg-orange-50 text-[#FF6A00] border border-orange-100 hover:bg-orange-100"
                >
                  Select Visible
                </button>
                <button
                  onClick={clearSelected}
                  className="px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] bg-white text-gray-600 border border-orange-100 hover:border-orange-300"
                >
                  Clear Selected
                </button>
                <button
                  onClick={removeAllContacts}
                  className="px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                >
                  Remove All
                </button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone, or source..."
                  className="w-full rounded-2xl border border-orange-200 bg-white pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 shadow-sm"
                />
              </div>

              <button
                onClick={() => setShowOnlySelected(v => !v)}
                className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] border transition-all ${
                  showOnlySelected
                    ? 'bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white border-transparent'
                    : 'bg-white text-gray-600 border-orange-200'
                }`}
              >
                {showOnlySelected ? 'Selected Only' : 'Show All'}
              </button>

              <div className="rounded-2xl border border-orange-200 bg-[#FFF9F5] px-4 py-3 text-sm font-black text-[#FF6A00] text-center">
                {filteredContacts.length.toLocaleString()} visible
              </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-orange-100 divide-y divide-orange-100 bg-white">
              {filteredContacts.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <p className="font-bold">No contacts found</p>
                  <p className="text-sm mt-1">Add or import numbers to start campaign messaging</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-[#FFF9F5] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="w-5 h-5 rounded border-orange-300 accent-orange-500"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate">
                          {contact.name?.trim() || 'Unnamed Customer'}
                        </p>
                        <p className="text-sm font-semibold text-gray-500 truncate">
                          {contact.phone}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-100 uppercase">
                            {contact.source || 'manual'}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                              contact.subscribed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {contact.subscribed ? 'Subscribed' : 'Opted Out'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleSubscribe(contact.id)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide ${
                          contact.subscribed
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {contact.subscribed ? 'Mute' : 'Enable'}
                      </button>

                      <button
                        onClick={() => removeContact(contact.id)}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${softCard} p-5`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-black text-gray-800">Compose SMS Campaign</h2>
              <span className="text-xs font-black px-3 py-1.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-100">
                Professional Editor
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Campaign Title *</label>
                <input
                  className={inputClass}
                  placeholder="Example: Weekend Offers April"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Recipients Mode</label>
                <div className="flex flex-wrap gap-2">
                  {(['subscribed', 'selected', 'all'] as RecipientMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setRecipientMode(mode)}
                      className={`px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] transition-all ${
                        recipientMode === mode
                          ? 'bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white shadow-[0_10px_24px_rgba(255,106,0,0.22)]'
                          : 'bg-white text-gray-600 border border-orange-100 hover:border-orange-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>SMS Message *</label>
                <textarea
                  className="w-full min-h-[220px] rounded-2xl border border-orange-200 bg-white px-4 py-4 text-sm text-gray-800 font-semibold leading-7 outline-none focus:border-[#FF6A00] focus:ring-4 focus:ring-orange-100 transition-all resize-y shadow-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Example:

Hello {name}, new products are now available at Baraka Sonko Electronics. Some items are on offer today. Visit our shop now. Reply STOP to unsubscribe.`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-orange-100 bg-[#FFF9F5] px-4 py-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-[0.14em]">
                    Characters
                  </p>
                  <p className="text-2xl font-black text-gray-900">
                    {smsLength.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-[#FFF9F5] px-4 py-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-[0.14em]">
                    SMS Segments
                  </p>
                  <p className="text-2xl font-black text-[#FF6A00]">
                    {smsSegments.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-[#FFF9F5] px-4 py-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-[0.14em]">
                    Recipients
                  </p>
                  <p className="text-2xl font-black text-gray-900">
                    {estimatedRecipients.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-[linear-gradient(135deg,#FFF7F0_0%,#FFFFFF_100%)] p-4">
                <h3 className="text-sm font-black text-gray-800 mb-3">Live Preview</h3>
                <div className="rounded-3xl bg-white border border-orange-100 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-[linear-gradient(135deg,#FF6A00_0%,#FF9A3D_100%)] flex items-center justify-center text-white font-black shadow-md">
                      BS
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">Baraka Sonko</p>
                      <p className="text-xs text-gray-400">SMS preview</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#FFF9F5] border border-orange-100 px-4 py-4 text-sm font-semibold text-gray-700 whitespace-pre-wrap leading-7">
                    {message.trim()
                      ? message.replace(/\{name\}/gi, 'Customer')
                      : 'Your SMS preview will appear here...'}
                  </div>

                  <p className="mt-3 text-[11px] font-bold text-gray-400">
                    Tip: Keep message short to reduce SMS segment cost.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-[#FFF7F0] p-4">
                <h3 className="text-sm font-black text-gray-800 mb-2">Campaign Summary</h3>
                <div className="space-y-2 text-sm font-semibold text-gray-600">
                  <p>
                    <span className="font-black text-gray-800">Mode:</span> {recipientMode}
                  </p>
                  <p>
                    <span className="font-black text-gray-800">Recipients:</span> {estimatedRecipients.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-black text-gray-800">Segments per recipient:</span> {smsSegments}
                  </p>
                  <p>
                    <span className="font-black text-gray-800">Total SMS units:</span> {estimatedMessages.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 bg-[linear-gradient(90deg,#FF6A00_0%,#FF8A2B_100%)] text-white font-black py-4 rounded-2xl shadow-[0_10px_24px_rgba(255,106,0,0.22)] hover:shadow-[0_14px_28px_rgba(255,106,0,0.28)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'SENDING CAMPAIGN...' : 'SEND SMS CAMPAIGN'}
                </button>

                <button
                  onClick={() => {
                    setCampaigns(prev => [
                      {
                        id: createId(),
                        title: campaignTitle || 'Untitled Draft',
                        message,
                        recipients: estimatedRecipients,
                        status: 'draft',
                        created_at: new Date().toISOString(),
                      },
                      ...prev,
                    ]);
                    setSuccess('Draft saved successfully');
                  }}
                  className="md:w-[220px] bg-white border border-orange-200 text-gray-700 font-black py-4 rounded-2xl hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  SAVE DRAFT
                </button>
              </div>
            </div>
          </div>

          <div className={`${softCard} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-800">Recent Campaigns</h2>
              <span className="text-xs font-black px-3 py-1.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-100">
                History
              </span>
            </div>

            {campaigns.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <p className="font-bold">No campaigns yet</p>
                <p className="text-sm mt-1">Your sent and saved SMS campaigns will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-2xl border border-orange-100 bg-white p-4 hover:bg-[#FFF9F5] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate">
                          {campaign.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(campaign.created_at).toLocaleString()}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                          campaign.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : campaign.status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : campaign.status === 'sending'
                                ? 'bg-blue-100 text-blue-700'
                                : campaign.status === 'queued'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-[#FFF9F5] border border-orange-100 p-3">
                      <p className="text-sm text-gray-700 font-semibold line-clamp-3 whitespace-pre-wrap">
                        {campaign.message}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-100">
                        {campaign.recipients.toLocaleString()} recipients
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${softCard} p-5`}>
            <h2 className="text-lg font-black text-gray-800 mb-3">Selected Contacts Preview</h2>
            {selectedContacts.length === 0 ? (
              <p className="text-sm text-gray-400 font-bold">No contacts selected yet</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto">
                {selectedContacts.slice(0, 100).map(contact => (
                  <span
                    key={contact.id}
                    className="px-3 py-2 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-black text-[#FF6A00]"
                  >
                    {(contact.name?.trim() || contact.phone)} 
                  </span>
                ))}
                {selectedContacts.length > 100 && (
                  <span className="px-3 py-2 rounded-full bg-gray-100 text-[11px] font-black text-gray-700">
                    +{selectedContacts.length - 100} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
