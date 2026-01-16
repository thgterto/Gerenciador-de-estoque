import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AddItem } from './components/AddItem'; // Mantido estático para acesso rápido via modal/rota
import { MovementModal, EditModal, RequestModal, QRGeneratorModal, AddItemModal } from './components/Modals'; 
import { QuickScanModal } from './components/QuickScanModal'; 
import { TutorialModal } from './components/TutorialModal';
import { DatabaseSetupModal } from './components/DatabaseSetupModal';
import { db } from './db';
import { InventoryItem } from './types';
import { AlertProvider, useAlert } from './context/AlertContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from './components/Toast';
import { Login } from './components/Login';

// Hooks Personalizados
import { useInventoryData } from './hooks/useInventoryData';
import { useStockOperations } from './hooks/useStockOperations';
import { usePurchaseManager } from './hooks/usePurchaseManager';

// --- Code Splitting (Lazy Loading) ---
const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const InventoryTable = React.lazy(() => import('./components/InventoryTable').then(m => ({ default: m.InventoryTable })));
const HistoryTable = React.lazy(() => import('./components/HistoryTable').then(m => ({ default: m.HistoryTable })));
const StorageMatrix = React.lazy(() => import('./components/StorageMatrix').then(m => ({ default: m.StorageMatrix })));
const Purchases = React.lazy(() => import('./components/Purchases').then(m => ({ default: m.Purchases })));
const Settings = React.lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const Reports = React.lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));

// Loading Component para Suspense
const PageLoader = () => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 opacity-60 animate-pulse">
        <span className="material-symbols-outlined text-4xl text-primary mb-2 animate-spin">progress_activity</span>
        <p className="text-sm font-medium text-text-secondary">Carregando módulo...</p>
    </div>
);

const LabControlContent = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- Hooks de Dados e Lógica ---
  const { items, history, loading, metrics, showDbSetup, handleDbSetup } = useInventoryData();
  const { registerMovement, updateItem, deleteItem, importLegacyExcel } = useStockOperations();
  const { purchaseList, addToPurchaseList, removeFromPurchaseList, updatePurchaseQuantity, submitOrder } = usePurchaseManager();
  const { addToast } = useAlert();

  // Filters state
  const [historyFilterId, setHistoryFilterId] = useState<string | null>(null);
  const [historyBatchId, setHistoryBatchId] = useState<string | null>(null);
  
  // Modals State
  const [modalType, setModalType] = useState<'NONE' | 'MOVE' | 'EDIT' | 'REQUEST' | 'QR' | 'ADD' | 'SCANNER'>('NONE');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [cloneData, setCloneData] = useState<Partial<InventoryItem> | undefined>(undefined);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tutorial Trigger
  useEffect(() => {
      if (!loading && !showDbSetup && user) {
        const tutorialSetting = localStorage.getItem('LC_TUTORIAL_ENABLED');
        const isTutorialEnabled = tutorialSetting !== 'false';
        const hasSeenTutorial = localStorage.getItem('LC_TUTORIAL_SEEN') === 'true';
        
        if (isTutorialEnabled && !hasSeenTutorial) {
            setTimeout(() => setShowTutorial(true), 1200);
        }
      }
  }, [loading, showDbSetup, user]);

  // Clean history filters when navigating away
  useEffect(() => {
    if (location.pathname !== '/history') {
      setHistoryFilterId(null);
      setHistoryBatchId(null);
    }
  }, [location.pathname]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          importLegacyExcel(file);
          e.target.value = '';
      }
  };

  const handleViewBatchHistory = (batchId: string) => {
      setHistoryBatchId(batchId);
      setModalType('NONE');
      navigate('/history');
  };

  const handleRequestSubmit = (item: InventoryItem, qty: number, reason: 'LOW_STOCK' | 'EXPIRING' | 'MANUAL') => {
      addToPurchaseList(item, reason, qty);
  };

  // Actions passed to Table - MEMOIZED to prevent row re-renders
  const actions = useMemo(() => ({
    edit: (item: InventoryItem) => { setSelectedItem(item); setModalType('EDIT'); },
    move: (item: InventoryItem) => { setSelectedItem(item); setModalType('MOVE'); },
    delete: (id: string, name: string) => {
        if (hasRole('ADMIN')) {
            deleteItem(id, name);
        } else {
            addToast('Acesso Negado', 'error', 'Apenas administradores podem excluir itens.');
        }
    },
    request: () => { setModalType('REQUEST'); },
    qr: (item: InventoryItem) => { setSelectedItem(item); setModalType('QR'); },
    viewHistory: (item: InventoryItem) => {
        setHistoryFilterId(item.id);
        navigate('/history');
    },
    clone: (item: InventoryItem) => {
        const { id, quantity, lotNumber, expiryDate, ...template } = item;
        setCloneData(template);
        setModalType('ADD');
    }
  }), [hasRole, deleteItem, addToast, navigate]);

  // --- Render Conditionals ---
  if (!user) return <Login />;

  if (loading) return <div className="h-screen flex items-center justify-center bg-background-light text-primary font-bold animate-pulse">Carregando LabControl...</div>;

  return (
    <>
       <ToastContainer />
       
       <Layout
            onLogout={logout}
            notificationsCount={purchaseList.length}
            alertsCount={metrics.alertsCount}
            onSync={() => {
                db.performBackup();
                addToast('Backup', 'info', 'Iniciando exportação de dados...');
            }}
            onBackupForce={() => {
                db.performBackup();
                addToast('Backup Manual', 'info', 'Gerando backup...');
            }}
            onAddClick={() => { setCloneData(undefined); setModalType('ADD'); }}
            onScanClick={() => setModalType('SCANNER')}
       >
           <Suspense fallback={<PageLoader />}>
               <Routes>
                   <Route path="/" element={<Navigate to="/dashboard" />} />
                   
                   <Route path="/dashboard" element={
                        <Dashboard 
                            items={items} 
                            history={history} 
                            onAddToPurchase={addToPurchaseList} 
                            onAddStock={(item) => { setSelectedItem(item); setModalType('MOVE'); }}
                        />
                   } />

                   <Route path="/inventory" element={
                        <InventoryTable 
                            items={items} 
                            onActions={actions} 
                            onAddNew={() => { setCloneData(undefined); setModalType('ADD'); }}
                        />
                   } />

                   <Route path="/history" element={
                        <HistoryTable 
                            // history prop removida - componente agora gerencia sua própria busca
                            preselectedItemId={historyFilterId} 
                            preselectedBatchId={historyBatchId}
                            onClearFilter={() => { setHistoryFilterId(null); setHistoryBatchId(null); }}
                        />
                   } />

                   <Route path="/storage" element={<StorageMatrix items={items} />} />
                   
                   {/* Legacy Route redirect to modal behavior if accessed directly */}
                   <Route path="/add-item" element={<AddItem onCancel={() => navigate('/inventory')} />} />

                   <Route path="/purchases" element={
                        <Purchases 
                            items={items}
                            purchaseList={purchaseList}
                            onRemove={removeFromPurchaseList}
                            onUpdateQuantity={updatePurchaseQuantity}
                            onSubmit={submitOrder}
                            onAdd={(item) => addToPurchaseList(item, 'MANUAL')}
                        />
                   } />

                   <Route path="/settings" element={
                       hasRole('ADMIN') ? <Settings /> : <Navigate to="/dashboard" />
                   } />
                   
                   <Route path="/reports" element={<Reports items={items} history={history} />} />
                   <Route path="/users" element={<Navigate to="/dashboard" />} />

                   <Route path="*" element={<Navigate to="/dashboard" />} />
               </Routes>
           </Suspense>
       </Layout>

       {/* Modals */}
       <DatabaseSetupModal 
          isOpen={showDbSetup} 
          onSelect={handleDbSetup} 
       />
       
       <AddItemModal 
          isOpen={modalType === 'ADD'}
          onClose={() => setModalType('NONE')}
          initialData={cloneData}
       />

       <MovementModal 
         isOpen={modalType === 'MOVE'} 
         onClose={() => setModalType('NONE')} 
         item={selectedItem} 
         onConfirm={registerMovement}
       />
       <EditModal 
         isOpen={modalType === 'EDIT'} 
         onClose={() => setModalType('NONE')} 
         item={selectedItem} 
         onSave={updateItem}
         onViewBatchHistory={handleViewBatchHistory}
       />
       <RequestModal
         isOpen={modalType === 'REQUEST'}
         onClose={() => setModalType('NONE')}
         onConfirm={handleRequestSubmit}
         items={items}
       />
       <QRGeneratorModal 
         isOpen={modalType === 'QR'}
         onClose={() => setModalType('NONE')}
         item={selectedItem}
       />
       <QuickScanModal
         isOpen={modalType === 'SCANNER'}
         onClose={() => setModalType('NONE')}
       />

       <TutorialModal 
         isOpen={showTutorial} 
         onClose={() => setShowTutorial(false)} 
         setTab={(t) => navigate(`/${t}`)}
       />
       
       <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx" />
    </>
  );
};

export default function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ThemeProvider>
                <AlertProvider>
                    <AuthProvider>
                        <LabControlContent />
                    </AuthProvider>
                </AlertProvider>
            </ThemeProvider>
        </Router>
    )
}