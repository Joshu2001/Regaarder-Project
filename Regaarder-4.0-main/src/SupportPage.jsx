import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, AlertCircle, Loader, FileIcon, ImageIcon, Trash2, MessageCircle, Send, Home, FileText, Pencil, MoreHorizontal } from 'lucide-react';
import { getTranslation } from './translations.js';

// Bottom Navigation Bar
const BottomBar = ({ selectedLanguage = 'English' }) => {
  const [activeTab, setActiveTab] = useState('More');

  useEffect(() => {
    if (window.setFooterTab) {
      window.currentFooterSetTab = setActiveTab;
    }
  }, []);

  const tabs = [
    { name: 'Home', Icon: Home },
    { name: 'Requests', Icon: FileText },
    { name: 'Ideas', Icon: Pencil },
    { name: 'More', Icon: MoreHorizontal },
  ];

  const inactiveColor = 'rgb(107 114 128)';

  const switchTab = (tabName) => {
    const tabMap = {
      'Home': 'home',
      'Requests': 'requests',
      'Ideas': 'ideas',
      'More': 'more'
    };
    const tabKey = tabMap[tabName];
    if (window.setFooterTab) {
      window.setFooterTab(tabKey);
    }
    setActiveTab(tabName);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-2xl z-10"
      style={{
        paddingTop: '10px',
        paddingBottom: 'calc(44px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="flex justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isSelected = tab.name === activeTab;

          const activeColorStyle = isSelected
            ? { color: 'var(--color-gold)' }
            : { color: inactiveColor };

          const textWeight = isSelected ? 'font-semibold' : 'font-normal';

          let wrapperStyle = {};
          if (isSelected) {
            wrapperStyle.textShadow = `0 0 8px var(--color-gold-light)`;
          }

          return (
            <div
              key={tab.name}
              className={`relative flex flex-col items-center w-1/4 focus:outline-none`}
              style={wrapperStyle}
            >
              <button
                className="flex flex-col items-center w-full"
                onClick={() => {
                  switchTab(tab.name);
                }}
              >
                <div className="w-11 h-11 flex items-center justify-center">
                  <tab.Icon size={22} strokeWidth={1.5} style={activeColorStyle} />
                </div>
                <span className={`text-[11px] md:text-xs mt-0 leading-none ${textWeight}`} style={activeColorStyle}>
                  {getTranslation(tab.name, selectedLanguage)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SupportPage = ({ selectedLanguage = 'English' }) => {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list', 'form', 'success', 'ticket-detail'
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const fileInputRef = useRef(null);

  const getOrCreateAnonymousUserEmail = () => {
    let anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymousUserId', anonymousId);
    }
    return `${anonymousId}@anonymous.local`;
  };

  const translations = {
    English: {
      title: 'Contact Support',
      subtitle: 'We\'re here to help! Send us your issue and we\'ll get back to you soon.',
      yourName: 'Your Name',
      yourNamePlaceholder: 'Enter your name',
      ticketTitle: 'Issue Title',
      ticketTitlePlaceholder: 'e.g., Video not playing, Account issue, etc.',
      description: 'Describe Your Issue',
      descriptionPlaceholder: 'Please provide as much detail as possible so we can help you better...',
      addFiles: 'Add Files/Images',
      send: 'Send Ticket',
      sending: 'Sending...',
      attachFiles: 'Attach Files',
      dragDrop: 'Drag files here or click to select',
      successTitle: 'Ticket Submitted! 🎉',
      successMessage: 'Thank you for reaching out. Our support team will review your ticket and respond within 24 hours.',
      backToForm: 'Send Another',
      close: 'Back',
      requiredField: 'This field is required',
      fileSizeError: 'File size must be less than 5MB',
      maxFilesError: 'Maximum 5 files allowed',
      maxTitleLength: 'Title must be less than 100 characters',
      maxDescriptionLength: 'Description must be less than 2000 characters',
      newTicket: '+ New Ticket',
      myTickets: 'My Support Tickets',
      noTickets: 'No support tickets yet',
      ticketId: 'Ticket #',
      status: 'Status',
      opened: 'Opened',
      replies: 'Replies',
      addReply: 'Add Reply',
      reply: 'Reply',
      pending: 'Pending',
      resolved: 'Resolved',
      youAnHourAgo: 'You, an hour ago',
      staffResponse: 'Staff Response',
      loading: 'Loading...',
    },
    Spanish: {
      title: 'Contactar Soporte',
      subtitle: '¡Estamos aquí para ayudarte! Envíanos tu problema y nos pondremos en contacto pronto.',
      yourName: 'Tu Nombre',
      yourNamePlaceholder: 'Ingresa tu nombre',
      ticketTitle: 'Título del Problema',
      ticketTitlePlaceholder: 'p. ej., Video no se reproduce, Problema de cuenta, etc.',
      description: 'Describe Tu Problema',
      descriptionPlaceholder: 'Por favor proporciona tantos detalles como sea posible para ayudarte mejor...',
      addFiles: 'Añadir Archivos/Imágenes',
      send: 'Enviar Ticket',
      sending: 'Enviando...',
      attachFiles: 'Adjuntar Archivos',
      dragDrop: 'Arrastra archivos aquí o haz clic para seleccionar',
      successTitle: '¡Ticket Enviado! 🎉',
      successMessage: 'Gracias por comunicarte con nosotros. Nuestro equipo de soporte revisará tu ticket y responderá en 24 horas.',
      backToForm: 'Enviar Otro',
      close: 'Atrás',
      requiredField: 'Este campo es requerido',
      fileSizeError: 'El tamaño del archivo debe ser menor a 5MB',
      maxFilesError: 'Máximo 5 archivos permitidos',
      maxTitleLength: 'El título debe tener menos de 100 caracteres',
      maxDescriptionLength: 'La descripción debe tener menos de 2000 caracteres',
      newTicket: '+ Nuevo Ticket',
      myTickets: 'Mis Tickets de Soporte',
      noTickets: 'Sin tickets de soporte aún',
      ticketId: 'Ticket #',
      status: 'Estado',
      opened: 'Abierto',
      replies: 'Respuestas',
      addReply: 'Agregar Respuesta',
      reply: 'Responder',
      pending: 'Pendiente',
      resolved: 'Resuelto',
      youAnHourAgo: 'Tú, hace una hora',
      staffResponse: 'Respuesta del Personal',
      loading: 'Cargando...',
    },
    French: {
      title: 'Contacter le Support',
      subtitle: 'Nous sommes là pour vous aider! Envoyez-nous votre problème et nous vous répondrons bientôt.',
      yourName: 'Votre Nom',
      yourNamePlaceholder: 'Entrez votre nom',
      ticketTitle: 'Titre du Problème',
      ticketTitlePlaceholder: 'p. ex., Vidéo ne se lit pas, Problème de compte, etc.',
      description: 'Décrivez Votre Problème',
      descriptionPlaceholder: 'Veuillez fournir autant de détails que possible pour mieux vous aider...',
      addFiles: 'Ajouter des Fichiers/Images',
      send: 'Envoyer le Ticket',
      sending: 'Envoi...',
      attachFiles: 'Joindre des Fichiers',
      dragDrop: 'Faites glisser les fichiers ici ou cliquez pour sélectionner',
      successTitle: 'Ticket Envoyé! 🎉',
      successMessage: 'Merci de nous avoir contactés. Notre équipe d\'assistance examinera votre ticket et vous répondra dans 24 heures.',
      backToForm: 'Envoyer un Autre',
      close: 'Retour',
      requiredField: 'Ce champ est obligatoire',
      fileSizeError: 'La taille du fichier doit être inférieure à 5MB',
      maxFilesError: 'Maximum 5 fichiers autorisés',
      maxTitleLength: 'Le titre doit contenir moins de 100 caractères',
      maxDescriptionLength: 'La description doit contenir moins de 2000 caractères',
      newTicket: '+ Nouveau Ticket',
      myTickets: 'Mes Tickets de Support',
      noTickets: 'Aucun ticket de support para le moment',
      ticketId: 'Ticket #',
      status: 'Statut',
      opened: 'Ouvert',
      replies: 'Réponses',
      addReply: 'Ajouter une Réponse',
      reply: 'Répondre',
      pending: 'En attente',
      resolved: 'Résolu',
      youAnHourAgo: 'Vous, il y a une heure',
      staffResponse: 'Réponse du Personnel',
      loading: 'Chargement...',
    }
  };

  const t = translations[selectedLanguage] || translations.English;

  // Load tickets on mount
  useEffect(() => {
    if (view === 'list') {
      loadTickets();
    }
  }, [view]);

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const userEmail = localStorage.getItem('userEmail') || getOrCreateAnonymousUserEmail();
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const backendUrl = window.__BACKEND_URL__ || `${protocol}//${hostname}:4000`;

      const response = await fetch(`${backendUrl}/support/tickets?userEmail=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleFileSelect = (files) => {
    if (!files) return;
    
    setError('');
    
    if (attachments.length + files.length > 5) {
      setError(t.maxFilesError);
      return;
    }

    const newFiles = [];
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t.fileSizeError);
        continue;
      }
      newFiles.push({
        file,
        id: Math.random(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2)
      });
    }

    setAttachments([...attachments, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId) => {
    setAttachments(attachments.filter(f => f.id !== fileId));
  };

  const validateForm = () => {
    if (!userName.trim()) {
      setError(t.requiredField);
      return false;
    }
    if (!title.trim()) {
      setError(t.requiredField);
      return false;
    }
    if (title.length > 100) {
      setError(t.maxTitleLength);
      return false;
    }
    if (!description.trim()) {
      setError(t.requiredField);
      return false;
    }
    if (description.length > 2000) {
      setError(t.maxDescriptionLength);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userName', userName.trim());
      formData.append('title', title);
      formData.append('description', description);
      formData.append('userId', localStorage.getItem('userId') || 'anonymous');
      const userEmail = localStorage.getItem('userEmail') || getOrCreateAnonymousUserEmail();
      formData.append('userEmail', userEmail);
      
      attachments.forEach((attachment) => {
        formData.append('file_', attachment.file);
      });

      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const backendUrl = window.__BACKEND_URL__ || `${protocol}//${hostname}:4000`;

      const response = await fetch(`${backendUrl}/support/ticket`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit ticket');
      }

      const data = await response.json();
      setTicketId(data.ticketId);
      setView('success');
    } catch (err) {
      console.error('Ticket submission error:', err);
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUserName('');
    setTitle('');
    setDescription('');
    setAttachments([]);
    setError('');
    setView('form');
  };

  const handleSubmitReply = async () => {
    if (!reply.trim() || !selectedTicket) return;

    setIsSubmittingReply(true);
    try {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const backendUrl = window.__BACKEND_URL__ || `${protocol}//${hostname}:4000`;

      const response = await fetch(`${backendUrl}/support/ticket/${selectedTicket.id}/customer-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reply.trim(),
          userEmail: localStorage.getItem('userEmail') || getOrCreateAnonymousUserEmail()
        })
      });

      if (response.ok) {
        setReply('');
        await loadTickets();
        // Reload selected ticket
        if (selectedTicket) {
          const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
          if (updatedTicket) {
            setSelectedTicket(updatedTicket);
          }
        }
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Helper function to format time
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setView('list')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t.title}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2">
                    {t.yourName}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      setError('');
                    }}
                    placeholder={t.yourNamePlaceholder}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent transition-all bg-white text-sm text-gray-900"
                    maxLength={50}
                  />
                </div>

                {/* Title Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2">
                    {t.ticketTitle}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setError('');
                    }}
                    placeholder={t.ticketTitlePlaceholder}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent transition-all bg-white text-sm text-gray-900"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-400 mt-1">{title.length}/100</p>
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2">
                    {t.description}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setError('');
                    }}
                    placeholder={t.descriptionPlaceholder}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent transition-all bg-white text-sm text-gray-900 resize-none"
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-400 mt-1">{description.length}/2000</p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2">
                    {t.addFiles}
                  </label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:bg-opacity-3 transition-all"
                  >
                    <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-gold)' }} />
                    <p className="text-xs font-medium text-gray-700">{t.dragDrop}</p>
                    <p className="text-xs text-gray-500 mt-1">Max 5MB per file, 5 files total</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />

                  {/* Attached Files */}
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {attachment.file.type.startsWith('image/') ? (
                              <ImageIcon size={16} className="text-[var(--color-gold)] flex-shrink-0" />
                            ) : (
                              <FileIcon size={16} className="text-gray-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-700 truncate">{attachment.name}</p>
                              <p className="text-xs text-gray-500">{attachment.size} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(attachment.id)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors ml-2 flex-shrink-0"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-7 flex gap-3">
                <button
                  onClick={() => setView('list')}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.close}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-gold)' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      {t.send}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => setView('list')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{t.title}</h1>
          </div>
        </div>

        {/* Success Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t.successTitle}</h2>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">{t.successMessage}</p>
            <p className="text-xs text-gray-500 font-mono bg-gray-50 p-2.5 rounded-lg mb-5">
              Ticket ID: {ticketId}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setView('list')}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.close}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-white text-sm transition-all"
                style={{ backgroundColor: 'var(--color-gold)' }}
              >
                {t.backToForm}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'ticket-detail' && selectedTicket) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedTicket(null);
                setView('list');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{selectedTicket.title}</h1>
              <p className="text-xs text-gray-500 mt-0.5">Ticket #{String(selectedTicket.id).slice(-10)}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              selectedTicket.status === 'resolved' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {selectedTicket.status === 'resolved' ? t.resolved : t.pending}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Original Issue */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-5">
              <p className="text-xs text-gray-500 mb-2">{t.opened} · {formatTime(selectedTicket.createdAt)}</p>
              <p className="text-xs font-semibold text-gray-900 mb-2">{selectedTicket.userName}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{selectedTicket.description}</p>
            </div>

            {/* Responses and Replies */}
            <div className="space-y-3">
              {selectedTicket.responses && selectedTicket.responses.map((resp) => (
                <div key={resp.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle size={14} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-900">{resp.staffName}</p>
                      <p className="text-xs text-blue-700">{formatTime(resp.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words ml-6 -mt-2">{resp.message}</p>
                </div>
              ))}

              {selectedTicket.customerResponses && selectedTicket.customerResponses.map((resp) => (
                <div key={resp.id} className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle size={14} className="text-gray-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">You</p>
                      <p className="text-xs text-gray-600">{formatTime(resp.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words ml-6 -mt-2">{resp.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== 'resolved' && (
              <div className="mt-6 pt-5 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-900 mb-3">{t.addReply}</p>
                <div className="flex gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent transition-all bg-white text-sm text-gray-900 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={handleSubmitReply}
                    disabled={!reply.trim() || isSubmittingReply}
                    className="p-2.5 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-gold)' }}
                  >
                    {isSubmittingReply ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-xl flex flex-col flex-1" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-3 sticky top-0 z-20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 whitespace-nowrap">{t.myTickets}</h1>
            </div>
            <button
              onClick={() => {
                setUserName('');
                setTitle('');
                setDescription('');
                setAttachments([]);
                setError('');
                setView('form');
              }}
              className="px-3 py-1.5 rounded-lg font-semibold text-white text-xs flex-shrink-0"
              style={{ backgroundColor: 'var(--color-gold)' }}
            >
              + Ticket
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {isLoadingTickets ? (
              <div className="flex items-center justify-center py-12">
                <Loader size={20} className="animate-spin text-gray-400" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 text-sm font-medium">{t.noTickets}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setView('ticket-detail');
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 hover:border-[var(--color-gold)] hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{ticket.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Ticket #{String(ticket.id).slice(-10)} · {formatTime(ticket.createdAt)}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        ticket.status === 'resolved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ticket.status === 'resolved' ? t.resolved : t.pending}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MessageCircle size={12} />
                      <span>{ticket.responses?.length || 0} {t.replies}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomBar selectedLanguage={selectedLanguage} />
    </div>
  );
};

export default SupportPage;
