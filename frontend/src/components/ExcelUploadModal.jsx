import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Eye, AlertTriangle, Layers, ChevronDown, ChevronUp, Copy, Check, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const ExcelUploadModal = ({ isOpen, onClose, onRefresh }) => {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showDuplicateAudit, setShowDuplicateAudit] = useState(true);
  const [auditFilter, setAuditFilter] = useState('ALL'); // 'ALL' | 'IN_FILE_DUPLICATE' | 'DATABASE_DUPLICATE'

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

  const stats = uploadResult?.stats || {
    totalRows: uploadResult?.summary?.totalRowsScanned || 0,
    insertedCount: uploadResult?.summary?.insertedCount || 0,
    updatedCount: uploadResult?.summary?.updatedCount || 0,
    duplicateCount: uploadResult?.summary?.duplicateCount || 0,
    failedCount: uploadResult?.summary?.skippedCount || 0
  };

  const duplicateRecords = uploadResult?.duplicateRecords || [];
  const filteredDuplicates = duplicateRecords.filter(item => {
    if (auditFilter === 'ALL') return true;
    return item.type === auditFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#151D2F] w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-[#7C3AED] dark:text-purple-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Master Sheet Deduplication & Ingestion Pipeline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">In-file pre-processing, bulk database cross-checking, and non-destructive upserts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Result Summary Modal / Banner */}
          {uploadResult && (
            <div className={`p-5 rounded-2xl border text-xs font-semibold space-y-4 ${
              uploadResult.success 
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800' 
                : 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
            }`}>
              <div className="flex items-center justify-between font-bold text-sm">
                <div className="flex items-center gap-2">
                  {uploadResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
                  <span>{uploadResult.message}</span>
                </div>
                {uploadResult.summary?.targetSheetName && (
                  <span className="px-2.5 py-1 rounded-full bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    Sheet: {uploadResult.summary.targetSheetName}
                  </span>
                )}
              </div>

              {/* Ingestion Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
                <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Total Rows</span>
                  <span className="text-slate-900 dark:text-white font-extrabold text-base">{stats.totalRows}</span>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/50 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-center shadow-sm">
                  <span className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Inserted</span>
                  <span className="text-emerald-800 dark:text-emerald-300 font-extrabold text-base">{stats.insertedCount}</span>
                </div>

                <div className="bg-sky-50/80 dark:bg-sky-950/50 p-3 rounded-xl border border-sky-200 dark:border-sky-800/80 text-center shadow-sm">
                  <span className="text-sky-700 dark:text-sky-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Updated</span>
                  <span className="text-sky-800 dark:text-sky-300 font-extrabold text-base">{stats.updatedCount}</span>
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 text-center shadow-sm">
                  <span className="text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Duplicates</span>
                  <span className="text-amber-800 dark:text-amber-300 font-extrabold text-base">{stats.duplicateCount}</span>
                </div>

                <div className="bg-rose-50/80 dark:bg-rose-950/50 p-3 rounded-xl border border-rose-200 dark:border-rose-800/80 text-center shadow-sm">
                  <span className="text-rose-700 dark:text-rose-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">Failed</span>
                  <span className="text-rose-800 dark:text-rose-300 font-extrabold text-base">{stats.failedCount}</span>
                </div>
              </div>

              {/* Expandable Duplicate Audit Log Report */}
              {duplicateRecords.length > 0 && (
                <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <div 
                    onClick={() => setShowDuplicateAudit(!showDuplicateAudit)}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Duplicate Records Audit Details ({duplicateRecords.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {showDuplicateAudit ? 'Hide Table' : 'Expand Table'}
                      </span>
                      {showDuplicateAudit ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {showDuplicateAudit && (
                    <div className="p-3 space-y-3">
                      {/* Filter Controls */}
                      <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                          <Filter className="w-3.5 h-3.5" />
                          <span>Filter Audit View:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setAuditFilter('ALL')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${auditFilter === 'ALL' ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            All ({duplicateRecords.length})
                          </button>
                          <button
                            onClick={() => setAuditFilter('IN_FILE_DUPLICATE')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${auditFilter === 'IN_FILE_DUPLICATE' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400'}`}
                          >
                            In-File ({duplicateRecords.filter(d => d.type === 'IN_FILE_DUPLICATE').length})
                          </button>
                          <button
                            onClick={() => setAuditFilter('DATABASE_DUPLICATE')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${auditFilter === 'DATABASE_DUPLICATE' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-400'}`}
                          >
                            Database ({duplicateRecords.filter(d => d.type === 'DATABASE_DUPLICATE').length})
                          </button>
                        </div>
                      </div>

                      {/* Duplicate Table */}
                      <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="p-2 w-12 text-center">Row</th>
                              <th className="p-2">Alumni Name</th>
                              <th className="p-2">Identity Key</th>
                              <th className="p-2">Duplicate Category</th>
                              <th className="p-2">Action / Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-200">
                            {filteredDuplicates.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2 text-center font-bold text-slate-500 dark:text-slate-400">#{item.row}</td>
                                <td className="p-2 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                <td className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{item.identifier}</td>
                                <td className="p-2">
                                  {item.type === 'IN_FILE_DUPLICATE' ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                      In-File Duplicate
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                      Database Duplicate
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-slate-500 dark:text-slate-400 text-[10px]">{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Failed Errors Log */}
              {uploadResult.summary?.errors?.length > 0 && (
                <div className="space-y-1 bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-rose-200 dark:border-rose-800 max-h-32 overflow-y-auto">
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Row Validation Failure Log ({uploadResult.summary.errors.length}):</span>
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
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#7C3AED] dark:hover:border-purple-400 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-800/30 transition-colors">
              <Upload className="w-10 h-10 text-[#7C3AED] dark:text-purple-400 mx-auto mb-3" />
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
                className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-purple-600/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Select Master Sheet File</span>
              </label>

              {file && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="p-2 bg-white dark:bg-[#1E293B] rounded-lg font-mono text-[#7C3AED] dark:text-purple-300 border border-slate-300 dark:border-slate-700 font-medium">
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
                  <Eye className="w-4 h-4 text-[#7C3AED] dark:text-purple-400" />
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
                className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
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
