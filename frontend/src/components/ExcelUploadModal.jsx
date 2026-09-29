import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Eye, FileText, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const ExcelUploadModal = ({ isOpen, onClose, onRefresh }) => {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);

      // Parse preview
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          setSheetNames(wb.SheetNames || []);
          
          // Dedicated Alumni sheet or first sheet
          const alumniSheetRegex = /(alumni|graduated|alumni_data|alumni_master)/i;
          const targetSheet = wb.SheetNames.find(s => alumniSheetRegex.test(s)) || wb.SheetNames[0];
          
          const ws = wb.Sheets[targetSheet];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          setPreviewRows(data.slice(0, 6)); // Preview first 5 data rows + header
        } catch (err) {
          console.error('Error parsing preview:', err);
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      let response;
      try {
        response = await api.post('/admin/upload-master-sheet', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (err1) {
        if (err1.response && err1.response.status === 404) {
          console.warn("Primary endpoint 404, retrying on fallback /admin/upload-excel...");
          response = await api.post('/admin/upload-excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          throw err1;
        }
      }

      setUploadResult({ success: true, ...response.data });
      setLoading(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      setLoading(false);
      const errText = error.response?.data?.message || 'Error executing Master Sheet ingestion';
      const details = error.response?.data?.details || null;
      setUploadResult({ success: false, message: errText, details });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#151D2F] w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Master Sheet Alumni Ingestion Pipeline</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Multi-sheet scanning, header normalization, and bulk alumni upsert</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Result Summary Banner */}
          {uploadResult && (
            <div className={`p-4 rounded-xl border text-xs font-semibold space-y-2 ${
              uploadResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {uploadResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                <span>{uploadResult.message}</span>
              </div>

              {uploadResult.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                  <div className="bg-white dark:bg-[#1E293B] p-2 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block">Target Sheet</span>
                    <span className="text-slate-900 dark:text-white font-bold">{uploadResult.summary.targetSheetName}</span>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-2 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block">Rows Scanned</span>
                    <span className="text-slate-900 dark:text-white font-bold">{uploadResult.summary.totalRowsScanned}</span>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-2 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-emerald-700 dark:text-emerald-400 block">Inserted / Updated</span>
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold">{uploadResult.summary.insertedCount} new / {uploadResult.summary.updatedCount} updated</span>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-2 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-amber-700 dark:text-amber-400 block">Skipped / Errors</span>
                    <span className="text-amber-800 dark:text-amber-300 font-bold">{uploadResult.summary.skippedCount} rows</span>
                  </div>
                </div>
              )}

              {uploadResult.summary?.errors?.length > 0 && (
                <div className="mt-2 space-y-1 bg-white dark:bg-[#1E293B] p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Processing Warning Log ({uploadResult.summary.errors.length}):</span>
                  </div>
                  {uploadResult.summary.errors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-800 dark:text-rose-300 font-mono">
                      Row {err.row}: {err.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Dropzone */}
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-800/30 transition-colors">
              <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Drag & Drop your Master Sheet or Browse</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Supports Multi-sheet Excel (.xlsx, .xls) & CSV files</p>
              
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Select Master Sheet File</span>
              </label>

              {file && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="p-2 bg-white dark:bg-[#1E293B] rounded-lg font-mono text-indigo-700 dark:text-indigo-300 border border-slate-300 dark:border-slate-700 font-medium">
                    File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  {sheetNames.length > 0 && (
                    <span className="p-2 bg-white dark:bg-[#1E293B] rounded-lg font-mono text-emerald-700 dark:text-emerald-300 border border-slate-300 dark:border-slate-700 font-medium">
                      Sheets ({sheetNames.length}): {sheetNames.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Live Data Preview Table */}
            {previewRows.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Alumni Data Live Preview (First 5 Rows)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151D2F]">
                  <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        {previewRows[0]?.map((cell, idx) => (
                          <th key={idx} className="p-2.5 whitespace-nowrap">{String(cell)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {previewRows.slice(1).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">{String(cell || '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Ingesting Master Sheet Data...' : 'Execute Alumni Data Ingestion'}</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default ExcelUploadModal;
