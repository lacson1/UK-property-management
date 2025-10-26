import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';
import Maintenance from './components/Maintenance';
import Finance from './components/Finance';
import Guidance from './components/Guidance';
import PropertyDetail from './components/PropertyDetail';
import Tenants from './components/Tenants';
import Tradespeople from './components/Tradespeople';
import Documents from './components/Documents';
import Reports from './components/Reports';
import Header from './components/Header';
import { View, Property, MaintenanceRequest, Transaction, Document, Tenant, Tradesperson, PropertyStatus, RentStatus, PropertyType, MaintenanceStatus, MaintenanceUrgency, TransactionType, DepositScheme } from './types';
import { triageMaintenanceRequest, extractDocumentInfo } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tradespeople, setTradespeople] = useState<Tradesperson[]>([]);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setCurrentView('properties'); // Keep view as properties to show detail
  };

  const handleBackToProperties = () => {
    setSelectedProperty(null);
  };

  const handleAddProperty = (propertyData: Omit<Property, 'id' | 'rentStatus'>) => {
    const newProperty: Property = {
      ...propertyData,
      id: `p${Date.now()}`,
      // If vacant, rent status is neutral. If occupied, default to overdue to prompt for first payment record.
      rentStatus: propertyData.status === PropertyStatus.Vacant ? RentStatus.Paid : RentStatus.Overdue,
    };
    setProperties(prev => [newProperty, ...prev]);
  };

  const handleAddRequest = async (propertyId: string, issue: string) => {
    const triageResult = await triageMaintenanceRequest(issue);
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const newRequest: MaintenanceRequest = {
        id: `m${Date.now()}`,
        propertyId,
        propertyAddress: property.address,
        issue,
        status: MaintenanceStatus.New,
        urgency: triageResult.urgency,
        suggestedTradesperson: triageResult.suggestedTradesperson,
        assignedTradespersonId: null,
        quotes: [],
        finalInvoiceUrl: null,
        reportedDate: new Date().toISOString().split('T')[0],
        cost: 0,
    };
    setMaintenanceRequests(prev => [newRequest, ...prev]);
  };

  const handleUpdateMaintenanceRequest = (updatedRequest: MaintenanceRequest) => {
    setMaintenanceRequests(prev => prev.map(req => req.id === updatedRequest.id ? updatedRequest : req));
  };

  const handleCompleteMaintenanceAndAddExpense = (
    request: MaintenanceRequest,
    cost: number,
    invoiceUrl: string | null
  ) => {
    const updatedRequest = { ...request, cost, finalInvoiceUrl: invoiceUrl, status: MaintenanceStatus.Completed };
    handleUpdateMaintenanceRequest(updatedRequest);
    
    const expenseDescription = `Maintenance: ${request.issue}`;
    handleAddTransaction({
        propertyId: request.propertyId,
        type: TransactionType.Expense,
        description: expenseDescription,
        amount: cost,
        date: new Date().toISOString().split('T')[0],
    });
  };


  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'propertyAddress'>) => {
      const property = properties.find(p => p.id === newTransaction.propertyId);
      if (!property) return;

      const fullTransaction: Transaction = {
        ...newTransaction,
        id: `t${Date.now()}`,
        propertyAddress: property.address,
      };
      setTransactions(prev => [fullTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      // Automatically update rent status if income matches or exceeds rent amount
      if (newTransaction.type === TransactionType.Income && newTransaction.amount >= property.currentRent) {
          setProperties(prevProperties => 
              prevProperties.map(p => 
                  p.id === newTransaction.propertyId 
                  ? { ...p, rentStatus: RentStatus.Paid } 
                  : p
              )
          );
      }
  };

   const handleAddTenant = (tenantData: Omit<Tenant, 'id' | 'propertyAddress'>) => {
        const property = properties.find(p => p.id === tenantData.propertyId);
        if (!property) return;

        const newTenant: Tenant = {
            ...tenantData,
            id: `ten${Date.now()}`,
            propertyAddress: property.address,
        };
        setTenants(prev => [...prev, newTenant]);
        // Also update the property status to Occupied
        setProperties(prev => prev.map(p => p.id === tenantData.propertyId ? { ...p, status: PropertyStatus.Occupied, rentStatus: RentStatus.Overdue } : p));
    };

    const handleAddTradesperson = (tradespersonData: Omit<Tradesperson, 'id'>) => {
      const newTradesperson: Tradesperson = {
        ...tradespersonData,
        id: `tp-${Date.now()}`,
      };
      setTradespeople(prev => [...prev, newTradesperson]);
    };
  
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAddDocument = async (propertyId: string, file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const base64Data = dataUrl.split(',')[1];
    
    const tempId = `temp_${Date.now()}`;
    const tempDoc: Document = {
      id: tempId,
      propertyId,
      fileName: file.name,
      fileType: file.type,
      documentType: 'extracting...',
      fileDataUrl: dataUrl,
      expiryDate: 'extracting...'
    };
    setDocuments(prev => [...prev, tempDoc]);

    try {
        const documentInfo = await extractDocumentInfo(base64Data, file.type);
        
        const finalDoc: Document = {
            ...tempDoc,
            id: `doc_${Date.now()}`,
            expiryDate: documentInfo.expiryDate,
            documentType: documentInfo.documentType,
        };
        
        setDocuments(prev => prev.map(d => d.id === tempId ? finalDoc : d).sort((a, b) => a.fileName.localeCompare(b.fileName)));
    } catch (e) {
        setDocuments(prev => prev.map(d => d.id === tempId ? {...d, expiryDate: 'extraction-failed', documentType: null } : d));
    }
  };

  const renderView = () => {
    if (currentView === 'properties' && selectedProperty) {
        return <PropertyDetail 
                    property={selectedProperty} 
                    onBack={handleBackToProperties}
                    maintenanceRequests={maintenanceRequests.filter(r => r.propertyId === selectedProperty.id)}
                    transactions={transactions.filter(t => t.propertyId === selectedProperty.id)}
                    documents={documents.filter(d => d.propertyId === selectedProperty.id)}
                    tenants={tenants}
                    onAddDocument={handleAddDocument}
                />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard properties={properties} maintenanceRequests={maintenanceRequests} tenants={tenants} documents={documents} setCurrentView={setCurrentView} />;
      case 'properties':
        return <Properties properties={properties} onSelectProperty={handleSelectProperty} onAddProperty={handleAddProperty} />;
      case 'tenants':
        return <Tenants tenants={tenants} properties={properties} onAddTenant={handleAddTenant} />;
      case 'maintenance':
        return <Maintenance 
                    maintenanceRequests={maintenanceRequests} 
                    properties={properties} 
                    tradespeople={tradespeople}
                    onAddRequest={handleAddRequest}
                    onUpdateRequest={handleUpdateMaintenanceRequest}
                    onCompleteRequest={handleCompleteMaintenanceAndAddExpense}
                    fileToDataUrl={fileToDataUrl}
                />;
      case 'documents':
        return <Documents 
                    documents={documents} 
                    properties={properties} 
                    onAddDocument={handleAddDocument} 
                />;
      case 'tradespeople':
        return <Tradespeople tradespeople={tradespeople} onAddTradesperson={handleAddTradesperson} />;
      case 'finance':
        return <Finance properties={properties} transactions={transactions} onAddTransaction={handleAddTransaction} />;
      case 'reports':
        return <Reports properties={properties} transactions={transactions} />;
      case 'guidance':
        return <Guidance />;
      default:
        return <Dashboard properties={properties} maintenanceRequests={maintenanceRequests} tenants={tenants} documents={documents} setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        theme={theme} 
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;