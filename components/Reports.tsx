import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Property, Transaction } from '../types';
import { getTaxSummary } from '../services/geminiService';
import { ChartBarIcon, LoadingSpinner, SparkleIcon } from './Icons';

interface ReportsProps {
  properties: Property[];
  transactions: Transaction[];
}

const Reports: React.FC<ReportsProps> = ({ properties, transactions }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [taxYear, setTaxYear] = useState<string>('');
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateTaxYears = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    const years = [];
    // UK tax year ends April 5th. If we are before April 6th, the current tax year is the previous one.
    const endYear = currentMonth > 3 || (currentMonth === 3 && new Date().getDate() > 5) ? currentYear + 1 : currentYear;

    for (let i = 0; i < 5; i++) {
        const year = endYear - i;
        years.push(`${year - 1}/${year.toString().slice(-2)}`);
    }
    return years;
  };

  const taxYears = generateTaxYears();
    
  const filterTransactionsForTaxYear = (txs: Transaction[], year: string): Transaction[] => {
    if (!year) return [];
    const [startYear, endYearShort] = year.split('/');
    const endYear = parseInt(startYear) + 1;

    const startDate = new Date(`${startYear}-04-06T00:00:00.000Z`);
    const endDate = new Date(`${endYear}-04-05T23:59:59.999Z`);

    return txs.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
    });
  };

  const handleGenerateReport = async () => {
    if (!taxYear) {
      setError('Please select a tax year.');
      return;
    }
    setIsLoading(true);
    setError('');
    setReport('');

    let filteredTransactions = filterTransactionsForTaxYear(transactions, taxYear);
    let propertyAddress = "All Properties";

    if (selectedPropertyId !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.propertyId === selectedPropertyId);
      propertyAddress = properties.find(p => p.id === selectedPropertyId)?.address || 'Unknown Property';
    }

    if (filteredTransactions.length === 0) {
        setError('No transactions found for the selected period and property.');
        setIsLoading(false);
        return;
    }

    try {
      const summary = await getTaxSummary(filteredTransactions, propertyAddress, taxYear);
      setReport(summary);
    } catch (err) {
      setError('Failed to generate report. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
    
    // Simple markdown-to-HTML, similar to Guidance component
    const formatResponse = (text: string) => {
        let html = text
            .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-semibold mt-3 mb-1">$1</h4>')
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
            .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
            .replace(/\* (.*)/g, '<li class="ml-4">$1</li>')
            .replace(/(<\/li>)?\n(?!<li)/g, '</li>\n')
            .replace(/(\n<li.*>.*<\/li>\n)+/g, (match) => `<ul class="list-disc list-inside space-y-1 my-2">${match.replace(/\n/g, '')}</ul>`)
            .replace(/\n/g, '<br />');
        return { __html: html };
    };
    
    const handleDownloadPdf = () => {
        if (!report) return;

        const doc = new jsPDF();
        const property = properties.find(p => p.id === selectedPropertyId);
        const propertyAddress = selectedPropertyId === 'all' ? 'All Properties' : property?.address;

        doc.setFontSize(18);
        doc.text('Property Tax Summary Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Property: ${propertyAddress}`, 14, 32);
        doc.text(`Tax Year: ${taxYear}`, 14, 38);
        
        // Remove markdown for PDF text
        const cleanText = report.replace(/### |#### |\*\*|\*/g, '');

        const splitText = doc.splitTextToSize(cleanText, 180);
        doc.text(splitText, 14, 50);

        doc.save(`tax-summary-${taxYear.replace('/', '-')}-${selectedPropertyId}.pdf`);
    };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <ChartBarIcon className="h-7 w-7 sm:h-8 sm:w-8 text-sky-500 dark:text-sky-400 mr-3" />
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">AI Financial Reports</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Report Options</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="property" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Property</label>
                <select id="property" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500">
                  <option value="all">All Properties</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="taxYear" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">UK Tax Year</label>
                <select id="taxYear" value={taxYear} onChange={e => setTaxYear(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500">
                  <option value="" disabled>Select a year</option>
                  {taxYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-sky-700 transition-colors disabled:bg-slate-400"
              >
                {isLoading ? <LoadingSpinner className="h-5 w-5" /> : <SparkleIcon className="h-5 w-5" />}
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>
              {report && (
                  <button onClick={handleDownloadPdf} className="w-full bg-slate-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors">Download PDF</button>
              )}
            </div>
          </div>
        </div>

        {/* Report Display */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-h-[30rem] p-4 sm:p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex-shrink-0">Generated Summary</h3>
            <div className="flex-grow overflow-y-auto pr-2">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                        <LoadingSpinner className="h-10 w-10 mb-4 text-sky-600"/>
                        <p className="font-semibold">Analyzing your finances...</p>
                        <p className="text-sm">The AI is preparing your report.</p>
                    </div>
                )}
                 {error && <p className="text-red-500 text-center">{error}</p>}
                 {!isLoading && !error && report && (
                     <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={formatResponse(report)} />
                 )}
                 {!isLoading && !error && !report && (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center">
                         <ChartBarIcon className="h-16 w-16 mb-4"/>
                         <p className="font-medium">Your report will appear here.</p>
                         <p className="text-sm">Select your options and click "Generate Report" to begin.</p>
                    </div>
                 )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Reports;