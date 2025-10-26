import React, { useState, useMemo } from 'react';
import { Property, Transaction, TransactionType } from '../types';
import { XIcon, PlusIcon, DocumentIcon } from './Icons';
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
} from 'recharts';


interface FinanceProps {
    properties: Property[];
    transactions: Transaction[];
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'propertyAddress'>) => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
  </div>
);

const Finance: React.FC<FinanceProps> = ({ properties, transactions, onAddTransaction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<string>(properties[0]?.id || '');
    const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.Expense);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    // State for financial reports
    const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportPropertyId, setReportPropertyId] = useState('all');
    const [reportData, setReportData] = useState<{
        income: number;
        expense: number;
        net: number;
        transactions: Transaction[];
    } | null>(null);


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
    };

    const totalIncome = transactions.filter(t => t.type === TransactionType.Income).reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.Expense).reduce((acc, t) => acc + t.amount, 0);
    const netProfit = totalIncome - totalExpense;
    
    const chartData = useMemo(() => {
        const dataByMonth = new Map<string, { income: number; expense: number }>();
        const months = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            months.push({ key: monthKey, label: monthLabel });
            dataByMonth.set(monthKey, { income: 0, expense: 0 });
        }

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (dataByMonth.has(monthKey)) {
                const current = dataByMonth.get(monthKey)!;
                if (t.type === TransactionType.Income) {
                    current.income += t.amount;
                } else {
                    current.expense += t.amount;
                }
            }
        });

        return months.map(m => ({
            month: m.label,
            income: dataByMonth.get(m.key)!.income,
            expense: dataByMonth.get(m.key)!.expense,
        }));
    }, [transactions]);

    const availableYears = useMemo(() => {
        if (transactions.length === 0) return [new Date().getFullYear()];
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

    const handleGenerateReport = () => {
        const filtered = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const yearMatch = transactionDate.getFullYear() === Number(reportYear);
            const propertyMatch = reportPropertyId === 'all' || t.propertyId === reportPropertyId;

            if (!propertyMatch || !yearMatch) {
                return false;
            }

            if (reportType === 'monthly') {
                const monthMatch = transactionDate.getMonth() + 1 === Number(reportMonth);
                return monthMatch;
            }

            return true;
        });

        const income = filtered.filter(t => t.type === TransactionType.Income).reduce((sum, t) => sum + t.amount, 0);
        const expense = filtered.filter(t => t.type === TransactionType.Expense).reduce((sum, t) => sum + t.amount, 0);

        setReportData({
            income,
            expense,
            net: income - expense,
            transactions: filtered,
        });
    };

    const getReportTitle = () => {
        if (!reportData) return '';
        const propertyName = reportPropertyId === 'all' ? 'All Properties' : properties.find(p => p.id === reportPropertyId)?.address || '';
        const monthName = new Date(Number(reportYear), Number(reportMonth) - 1, 1).toLocaleString('default', { month: 'long' });
        const period = reportType === 'monthly' ? `${monthName} ${reportYear}` : `Year ${reportYear}`;
        return `Report for ${period} - ${propertyName}`;
    };


    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: The 'amount' state can be `number | ''`, so we must check for the empty string case before doing a numerical comparison.
        if (!selectedProperty || !description.trim() || amount === '' || Number(amount) <= 0) {
            setError('Please fill in all fields with valid values.');
            return;
        }

        onAddTransaction({
            propertyId: selectedProperty,
            type: transactionType,
            description,
            amount: Number(amount),
            date,
        });

        // Reset form and close modal
        setIsModalOpen(false);
        setDescription('');
        setAmount('');
        setSelectedProperty(properties[0]?.id || '');
        setTransactionType(TransactionType.Expense);
        setDate(new Date().toISOString().split('T')[0]);
        setError('');
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Finance</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
                    <PlusIcon className="h-5 w-5" />
                    Add Transaction
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Income" value={formatCurrency(totalIncome)} className="border-l-4 border-green-500" />
                <StatCard title="Total Expense" value={formatCurrency(totalExpense)} className="border-l-4 border-red-500" />
                <StatCard title="Net Profit" value={formatCurrency(netProfit)} className={`border-l-4 ${netProfit >= 0 ? 'border-sky-500' : 'border-red-500'}`} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">12-Month Cash Flow</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgb(100 116 139)" />
                            <YAxis tickFormatter={(value) => `£${Number(value) / 1000}k`} tick={{ fontSize: 12 }} stroke="rgb(100 116 139)"/>
                            <Tooltip
                                cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    color: '#334155'
                                }}
                                formatter={(value: number, name: string) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                            />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}/>
                            <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Financial Reports Section */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <DocumentIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Financial Reports</h3>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Report Type</label>
                            <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-600 rounded-md">
                                <button onClick={() => setReportType('monthly')} className={`w-full text-sm py-1.5 rounded ${reportType === 'monthly' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Monthly</button>
                                <button onClick={() => setReportType('annual')} className={`w-full text-sm py-1.5 rounded ${reportType === 'annual' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Annual</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="reportYear" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Year</label>
                                <select id="reportYear" value={reportYear} onChange={e => setReportYear(Number(e.target.value))} className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            {reportType === 'monthly' && (
                                <div>
                                    <label htmlFor="reportMonth" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Month</label>
                                    <select id="reportMonth" value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                                        {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="reportProperty" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property</label>
                            <select id="reportProperty" value={reportPropertyId} onChange={e => setReportPropertyId(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                                <option value="all">All Properties</option>
                                {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                            </select>
                        </div>
                         <button onClick={handleGenerateReport} className="w-full bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">Generate Report</button>
                    </div>
                </div>
                
                {reportData && (
                    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-4">{getReportTitle()}</h4>
                        {reportData.transactions.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg"><h5 className="text-sm text-slate-500 dark:text-slate-400">Income</h5><p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(reportData.income)}</p></div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg"><h5 className="text-sm text-slate-500 dark:text-slate-400">Expenses</h5><p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(reportData.expense)}</p></div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg"><h5 className="text-sm text-slate-500 dark:text-slate-400">Net Profit</h5><p className={`text-2xl font-bold ${reportData.net >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(reportData.net)}</p></div>
                                </div>
                                <h5 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Transactions in this period</h5>
                                <div className="overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50"><tr className="text-left"><th className="p-2 font-medium">Date</th><th className="p-2 font-medium">Description</th><th className="p-2 font-medium">Type</th><th className="p-2 font-medium text-right">Amount</th></tr></thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {reportData.transactions.map(t => (
                                                <tr key={t.id}><td className="p-2">{t.date}</td><td className="p-2">{t.description}</td><td className="p-2"><span className={`px-2 py-0.5 text-xs rounded-full ${t.type === TransactionType.Income ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{t.type}</span></td><td className={`p-2 text-right font-semibold ${t.type === TransactionType.Income ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <p className="text-center py-8 text-slate-500 dark:text-slate-400">No transactions found for the selected period and property.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Transactions Section Header */}
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">All Recent Transactions</h3>

            {/* Mobile card view */}
            <div className="md:hidden space-y-4">
                {transactions.map(t => (
                    <div key={t.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 pr-2">{t.description}</p>
                             <p className={`flex-shrink-0 font-semibold ${t.type === TransactionType.Income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {t.type === TransactionType.Expense && '-'}{formatCurrency(t.amount)}
                             </p>
                        </div>
                         <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.propertyAddress}</p>
                        <div className="flex justify-between items-center mt-2 text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                t.type === TransactionType.Income ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}>{t.type}</span>
                            <span className="text-slate-500 dark:text-slate-400">{t.date}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Desktop table view */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Property</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{t.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{t.propertyAddress}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-sm truncate">{t.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    t.type === TransactionType.Income ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                }`}>
                                    {t.type}
                                </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                                t.type === TransactionType.Income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>{t.type === TransactionType.Expense && '-'}{formatCurrency(t.amount)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[calc(100vh-2rem)]" role="document">
                        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 id="modal-title" className="text-xl font-semibold text-slate-800 dark:text-slate-100">New Transaction</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            <form onSubmit={handleAddTransaction} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="property" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property</label>
                                        <select id="property" value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500">
                                            {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Type</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setTransactionType(TransactionType.Expense)} className={`flex-1 p-2 rounded-md border ${transactionType === TransactionType.Expense ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>Expense</button>
                                            <button type="button" onClick={() => setTransactionType(TransactionType.Income)} className={`flex-1 p-2 rounded-md border ${transactionType === TransactionType.Income ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>Income</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                                        <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Monthly Rent or Boiler Repair" className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Amount (£)</label>
                                            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="150.00" className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                                        </div>
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date</label>
                                            <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                                        </div>
                                    </div>
                                </div>
                                {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
                                <div className="mt-6 flex justify-end items-center gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">Submit Transaction</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Finance;