import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X, Table2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import * as XLSX from 'xlsx';

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
  const [preview, setPreview] = useState(null); // { rows, columns }
  const [dragOver, setDragOver] = useState(false);

  // Download template as a real .xlsx file with headers + 1 sample row
  const downloadTemplate = () => {
    const sampleRow = templateHeaders.reduce((acc, h) => {
      acc[h] = `sample_${h}`;
      return acc;
    }, {});

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: templateHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, entityName);
    XLSX.writeFile(wb, `${entityName.toLowerCase()}_template.xlsx`);
  };

  const parseFile = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rows.length === 0) {
          setError('The file appears to be empty or has no data rows.');
          setPreview(null);
          return;
        }

        const columns = Object.keys(rows[0]);
        setPreview({ rows, columns });
        setError(null);
      } catch (err) {
        setError('Failed to parse file. Make sure it is a valid .xlsx or .csv file.');
        setPreview(null);
      }
    };
    reader.onerror = () => setError('Error reading file.');
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const processFile = (selectedFile) => {
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension !== 'csv' && extension !== 'xlsx') {
      toast.error('Only .xlsx and .csv files are allowed');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setPreview(null);
    parseFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file || !preview) return;

    setUploading(true);
    setError(null);

    try {
      const API = '';
      await axios.post(`${API}${uploadUrl}`, preview.rows, { headers: headers() });
      toast.success(`✅ Successfully uploaded ${preview.rows.length} ${entityName.toLowerCase()} records!`);
      setOpen(false);
      resetState();
      if (onSuccess) onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setError(`Upload failed: ${detail}`);
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setDragOver(false);
  };

  const handleClose = (val) => {
    setOpen(val);
    if (!val) resetState();
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-900 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        data-testid="bulk-upload-btn"
      >
        <Upload size={16} /> Bulk Upload
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900" style={{ fontFamily: 'Manrope' }}>
              <Upload className="text-blue-900" size={20} />
              Bulk Upload {entityName}
            </DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) or CSV file to import multiple records at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Step 1: Download Template */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <FileText size={14} className="text-blue-900" /> Step 1 — Download Template
              </h4>
              <p className="text-xs text-slate-600 mb-3">
                Use this pre-formatted Excel template. Fill in your data and upload below.
              </p>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-xs font-bold text-blue-900 bg-white border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
              >
                <Download size={13} /> Download {entityName}_Template.xlsx
              </button>
              <div className="mt-3">
                <p className="text-xs text-slate-500 font-medium mb-1">Expected columns:</p>
                <div className="flex flex-wrap gap-1">
                  {templateHeaders.map(h => (
                    <span key={h} className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">{h}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Upload */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload size={14} /> Step 2 — Upload Your File
              </h4>
              <div 
                className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center pointer-events-none">
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={28} />
                      <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{preview ? `${preview.rows.length} rows detected` : 'Parsing...'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Upload className="text-slate-400" size={22} />
                      </div>
                      <p className="text-sm text-slate-700 font-medium">Click or drag & drop your file here</p>
                      <p className="text-xs text-slate-400">Supports .xlsx and .csv</p>
                    </div>
                  )}
                </div>
              </div>
              {file && (
                <button 
                  onClick={(e) => { e.stopPropagation(); resetState(); }} 
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Remove file
                </button>
              )}
            </div>

            {/* Preview Table */}
            {preview && preview.rows.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Table2 size={14} /> Preview <span className="text-slate-400 font-normal text-xs">(first 5 rows)</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {preview.columns.map(col => (
                          <th key={col} className="px-3 py-2 font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {preview.columns.map(col => (
                            <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[150px] truncate">
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.rows.length > 5 && (
                  <p className="text-xs text-slate-400 text-center">...and {preview.rows.length - 5} more rows</p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button 
              onClick={() => handleClose(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={!preview || uploading}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-md transition-colors flex items-center gap-2 ${
                !preview || uploading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
              }`}
              data-testid="bulk-upload-submit"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload {preview ? `${preview.rows.length} Records` : ''}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
