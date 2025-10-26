import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';
import Maintenance from './components/Maintenance';
import Finance from './components/Finance';
import Guidance from './components/Guidance';
import PropertyDetail from './components/PropertyDetail';
import Tenants from './components/Tenants';
import Header from './components/Header';
import { View, Property, MaintenanceRequest, Transaction, Document, Tenant, PropertyStatus, RentStatus, PropertyType, MaintenanceStatus, MaintenanceUrgency, TransactionType, DepositScheme } from './types';
import { triageMaintenanceRequest, extractDocumentInfo } from './services/geminiService';

// Mock Data
const initialProperties: Property[] = [
  { id: 'p1', address: '123 Coronation Street, Manchester', type: PropertyType.Personal, status: PropertyStatus.Occupied, rentStatus: RentStatus.Paid, currentRent: 1200 },
  { id: 'p2', address: '22 Baker Street, London', type: PropertyType.LTD, status: PropertyStatus.Occupied, rentStatus: RentStatus.Overdue, currentRent: 2500 },
  { id: 'p3', address: '15 Princes Street, Edinburgh', type: PropertyType.LTD, status: PropertyStatus.Vacant, rentStatus: RentStatus.Paid, currentRent: 1500 },
  { id: 'p4', address: '45 Broad Street, Bristol', type: PropertyType.Personal, status: PropertyStatus.Occupied, rentStatus: RentStatus.Paid, currentRent: 950 },
  { id: 'p5', address: '8 Abbey Road, Liverpool', type: PropertyType.LTD, status: PropertyStatus.UnderOffer, rentStatus: RentStatus.Paid, currentRent: 800 },
];

const initialTenants: Tenant[] = [
    { id: 't1', name: 'John Smith', email: 'john.smith@example.com', phone: '07123456789', propertyId: 'p1', propertyAddress: '123 Coronation Street, Manchester', leaseStartDate: '2023-08-01', leaseEndDate: '2024-07-31', depositAmount: 1500, depositScheme: DepositScheme.DPS },
    { id: 't2', name: 'Jane Doe', email: 'jane.doe@example.com', phone: '07987654321', propertyId: 'p2', propertyAddress: '22 Baker Street, London', leaseStartDate: '2022-05-15', leaseEndDate: '2024-05-14', depositAmount: 3000, depositScheme: DepositScheme.MyDeposits },
    { id: 't3', name: 'Peter Jones', email: 'peter.jones@example.com', phone: '07777111222', propertyId: 'p4', propertyAddress: '45 Broad Street, Bristol', leaseStartDate: '2024-01-10', leaseEndDate: '2025-01-09', depositAmount: 1100, depositScheme: DepositScheme.TDS },
];

const initialMaintenance: MaintenanceRequest[] = [
  { id: 'm1', propertyId: 'p2', propertyAddress: '22 Baker Street, London', issue: 'Leaking tap in kitchen', status: MaintenanceStatus.New, urgency: MaintenanceUrgency.Medium, suggestedTradesperson: 'Plumber', reportedDate: '2024-05-20', cost: 0 },
  { id: 'm2', propertyId: 'p1', propertyAddress: '123 Coronation Street, Manchester', issue: 'Boiler not providing hot water', status: MaintenanceStatus.InProgress, urgency: MaintenanceUrgency.High, suggestedTradesperson: 'Gas Engineer', reportedDate: '2024-05-18', cost: 0 },
  { id: 'm3', propertyId: 'p4', propertyAddress: '45 Broad Street, Bristol', issue: 'Fence panel blown down in storm', status: MaintenanceStatus.Completed, urgency: MaintenanceUrgency.Low, suggestedTradesperson: 'General Handyman', reportedDate: '2024-04-10', cost: 150 },
  { id: 'm4', propertyId: 'p2', propertyAddress: '22 Baker Street, London', issue: 'Front door lock is sticking', status: MaintenanceStatus.Completed, urgency: MaintenanceUrgency.Medium, suggestedTradesperson: 'Locksmith', reportedDate: '2024-03-25', cost: 85 },
  { id: 'm5', propertyId: 'p3', propertyAddress: '15 Princes Street, Edinburgh', issue: 'End of tenancy deep clean required', status: MaintenanceStatus.New, urgency: MaintenanceUrgency.Low, suggestedTradesperson: 'Cleaning Service', reportedDate: '2024-05-21', cost: 0 },
];

const initialTransactions: Transaction[] = [
  // May
  { id: 'tr1', propertyId: 'p1', propertyAddress: '123 Coronation Street, Manchester', type: TransactionType.Income, description: 'May Rent', amount: 1200, date: '2024-05-01' },
  { id: 'tr2', propertyId: 'p2', propertyAddress: '22 Baker Street, London', type: TransactionType.Income, description: 'May Rent', amount: 2500, date: '2024-05-01' },
  { id: 'tr3', propertyId: 'p4', propertyAddress: '45 Broad Street, Bristol', type: TransactionType.Income, description: 'May Rent', amount: 950, date: '2024-05-01' },
  // April
  { id: 'tr4', propertyId: 'p1', propertyAddress: '123 Coronation Street, Manchester', type: TransactionType.Income, description: 'April Rent', amount: 1200, date: '2024-04-01' },
  { id: 'tr5', propertyId: 'p2', propertyAddress: '22 Baker Street, London', type: TransactionType.Income, description: 'April Rent', amount: 2500, date: '2024-04-01' },
  { id: 'tr6', propertyId: 'p4', propertyAddress: '45 Broad Street, Bristol', type: TransactionType.Income, description: 'April Rent', amount: 950, date: '2024-04-01' },
  { id: 'tr7', propertyId: 'p4', propertyAddress: '45 Broad Street, Bristol', type: TransactionType.Expense, description: 'Fence Repair', amount: 150, date: '2024-04-12' },
  // March
  { id: 'tr8', propertyId: 'p1', propertyAddress: '123 Coronation Street, Manchester', type: TransactionType.Income, description: 'March Rent', amount: 1200, date: '2024-03-01' },
  { id: 'tr9', propertyId: 'p2', propertyAddress: '22 Baker Street, London', type: TransactionType.Income, description: 'March Rent', amount: 2500, date: '2024-03-01' },
  { id: 'tr10', propertyId: 'p4', propertyAddress: '45 Broad Street, Bristol', type: TransactionType.Income, description: 'March Rent', amount: 950, date: '2024-03-01' },
  { id: 'tr11', propertyId: 'p2', propertyAddress: '22 Baker Street, London', type: TransactionType.Expense, description: 'Locksmith for front door', amount: 85, date: '2024-03-26' },
  { id: 'tr12', propertyId: 'p3', propertyAddress: '15 Princes Street, Edinburgh', type: TransactionType.Expense, description: 'Gas Safety Certificate', amount: 75, date: '2024-03-15' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(initialMaintenance);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);

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

  const handleAddRequest = async (propertyId: string, issue: string) => {
    const triageResult = await triageMaintenanceRequest(issue);
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const newRequest: MaintenanceRequest = {
        id: `m${maintenanceRequests.length + 1}`,
        propertyId,
        propertyAddress: property.address,
        issue,
        status: MaintenanceStatus.New,
        urgency: triageResult.urgency,
        suggestedTradesperson: triageResult.suggestedTradesperson,
        reportedDate: new Date().toISOString().split('T')[0],
        cost: 0,
    };
    setMaintenanceRequests(prev => [newRequest, ...prev]);
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'propertyAddress'>) => {
      const property = properties.find(p => p.id === newTransaction.propertyId);
      if (!property) return;

      const fullTransaction: Transaction = {
        ...newTransaction,
        id: `t${transactions.length + 1}`,
        propertyAddress: property.address,
      };
      setTransactions(prev => [fullTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

   const handleAddTenant = (tenantData: Omit<Tenant, 'id' | 'propertyAddress'>) => {
        const property = properties.find(p => p.id === tenantData.propertyId);
        if (!property) return;

        const newTenant: Tenant = {
            ...tenantData,
            id: `ten${tenants.length + 1}`,
            propertyAddress: property.address,
        };
        setTenants(prev => [...prev, newTenant]);
        // Also update the property status to Occupied
        setProperties(prev => prev.map(p => p.id === tenantData.propertyId ? { ...p, status: PropertyStatus.Occupied } : p));
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
        };
        
        setDocuments(prev => prev.map(d => d.id === tempId ? finalDoc : d));
    } catch (e) {
        console.error("Failed to extract document info", e);
        setDocuments(prev => prev.map(d => d.id === tempId ? {...d, expiryDate: 'extraction-failed'} : d));
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
        return <Dashboard properties={properties} maintenanceRequests={maintenanceRequests} tenants={tenants} />;
      case 'properties':
        return <Properties properties={properties} onSelectProperty={handleSelectProperty} />;
      case 'tenants':
        return <Tenants tenants={tenants} properties={properties} onAddTenant={handleAddTenant} />;
      case 'maintenance':
        return <Maintenance maintenanceRequests={maintenanceRequests} properties={properties} onAddRequest={handleAddRequest} />;
      case 'finance':
        return <Finance properties={properties} transactions={transactions} onAddTransaction={handleAddTransaction} />;
      case 'guidance':
        return <Guidance />;
      default:
        return <Dashboard properties={properties} maintenanceRequests={maintenanceRequests} tenants={tenants} />;
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
