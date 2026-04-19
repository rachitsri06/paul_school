import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function BulkUpload({ 
  entityName, 
  templateHeaders, 
  uploadUrl, 
  onSuccess 
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const downloadTemplate = () => {
    const csvContent = templateHeaders.join(',') + '\n' + 
      templateHeaders.map(() => 'sample_data').join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${entityName.toLowerCase()}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension !== 'csv' && extension !== 'xlsx') {
      toast.error('Only .csv and .xlsx files are allowed');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headersList = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headersList.forEach((header, i) => {
        let val = values[i];
        if (header.includes('salary') || header.includes('copies') || header.includes('amount')) {
          val = parseFloat(val) || 0;
        }
        obj[header] = val;
      });
      return obj;
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'xlsx') {
      toast.error('Excel (.xlsx) parsing requires an extra library. Please save as .csv and upload.');
      return;
    }

    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const data = parseCSV(text);

        if (data.length === 0) {
          setError('The file appears to be empty or misformatted.');
          setUploading(false);
          return;
        }

        const API = ""; 
        await axios.post(`${API}${uploadUrl}`, data, { headers: headers() });
        toast.success(`Successfully uploaded ${data.length} records`);
        setOpen(false);
        setFile(null);
        if (onSuccess) onSuccess();
      } catch (err) {
        const detail = err.response?.data?.detail || err.message;
        setError(`Upload failed: ${detail}`);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
      setUploading(false);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-900 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
      >
        <Upload size={16} /> Bulk Upload
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="text-blue-900" size={20} />
              Bulk Upload {entityName}
            </DialogTitle>
            <DialogDescription>
              Upload multiple records at once using a CSV file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <FileText size={14} /> 1. Download Template
              </h4>
              <p className="text-xs text-slate-600 mb-3">
                Download the pre-formatted CSV template to ensure your data matches the system requirements.
              </p>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-xs font-bold text-blue-900 hover:text-blue-700 underline"
              >
                <Download size={14} /> {entityName}_Template.csv
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload size={14} /> 2. Upload Data
              </h4>
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-blue-400 transition-colors bg-white">
                <input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={24} />
                      <p className="text-sm font-medium text-slate-900">{file.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-500 hover:underline">Change file</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="text-slate-400 mb-1" size={24} />
                      <p className="text-sm text-slate-600 font-medium">Click or drag file to upload</p>
                      <p className="text-xs text-slate-400">Only .csv or .xlsx files are allowed</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                !file || uploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
              }`}
            >
              {uploading ? 'Processing...' : 'Start Upload'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
