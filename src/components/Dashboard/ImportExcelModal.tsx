import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { arabicToEnglishName } from '../../utils/arabicToEnglish';
import { FileSpreadsheet, Upload, Check, AlertCircle, Sparkles } from 'lucide-react';

interface ImportExcelModalProps {
  onImportStudents: (names: string[]) => Promise<void>;
  onClose: () => void;
}

interface ParsedRow {
  id: string;
  originalName: string;
  translatedName: string;
  selected: boolean;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  onImportStudents,
  onClose,
}) => {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!data || data.length === 0) {
          setError('The uploaded Excel file appears to be empty.');
          return;
        }

        const extractedNames: string[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          // Look across cells in the row for a non-empty string name
          for (let j = 0; j < Math.min(row.length, 3); j++) {
            const val = String(row[j] || '').trim();

            // Skip common column header titles
            if (
              ['name', 'student name', 'الاسم', 'اسم الطالب', 'اسم الطفل', 'student', 'id', 'م'].includes(
                val.toLowerCase()
              )
            ) {
              continue;
            }

            if (val.length >= 2) {
              extractedNames.push(val);
              break;
            }
          }
        }

        if (extractedNames.length === 0) {
          setError('No valid student names found in the uploaded file.');
          return;
        }

        const parsed: ParsedRow[] = extractedNames.map((origName, idx) => ({
          id: `imp-${idx}-${Date.now()}`,
          originalName: origName,
          translatedName: arabicToEnglishName(origName),
          selected: true,
        }));

        setRows(parsed);
      } catch (err: any) {
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleTranslatedNameChange = (id: string, newName: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, translatedName: newName } : r))
    );
  };

  const toggleRowSelected = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const handleConfirmImport = async () => {
    const namesToImport = rows
      .filter((r) => r.selected && r.translatedName.trim())
      .map((r) => r.translatedName.trim());

    if (namesToImport.length === 0) {
      setError('Please select at least one student to import.');
      return;
    }

    setLoading(true);
    try {
      await onImportStudents(namesToImport);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import students.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4 selection:bg-amber-400">
      <div className="w-full max-w-2xl bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl p-6 sm:p-8 card-shadow relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-2xl text-indigo-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-indigo-950">
                Import Excel Student List
              </h3>
              <p className="text-xs font-semibold text-indigo-600">
                Arabic names are automatically translated to English
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-950 p-1.5 rounded-xl hover:bg-white font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-3xl text-center transition-colors">
            <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-indigo-950 mb-1">
              Select or Drop Excel File (.xlsx, .xls, .csv)
            </h4>
            <p className="text-xs font-semibold text-indigo-500 mb-6">
              Upload a spreadsheet containing Arabic student names (e.g. ماريو, مينا, مارك)
            </p>

            <label className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-indigo-500/20 cursor-pointer transition-all tactile-btn inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> Browse Excel File
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 px-1 text-xs font-extrabold text-indigo-600">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" /> Preview Translated Names ({selectedCount} Selected):
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-indigo-700 hover:underline cursor-pointer"
              >
                {rows.every((r) => r.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 mb-6 pr-1">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                    row.selected
                      ? 'bg-white border-indigo-200 shadow-sm'
                      : 'bg-indigo-50/50 border-indigo-100 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleRowSelected(row.id)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />

                  {/* Arabic Original */}
                  <div className="w-1/3 text-right font-bold text-slate-700 text-sm dir-rtl truncate">
                    {row.originalName}
                  </div>

                  <span className="text-indigo-300 font-bold">➔</span>

                  {/* English Translation Input */}
                  <input
                    type="text"
                    value={row.translatedName}
                    onChange={(e) => handleTranslatedNameChange(row.id, e.target.value)}
                    placeholder="English Name"
                    className="flex-1 px-3 py-1.5 bg-[#F6F2FF] border border-indigo-100 rounded-xl text-indigo-950 font-bold text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setRows([]);
                  setFileName(null);
                }}
                className="py-3 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
              >
                Re-upload File
              </button>
              <button
                type="button"
                disabled={loading || selectedCount === 0}
                onClick={handleConfirmImport}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-indigo-500/20 transition-all tactile-btn cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loading
                  ? 'Importing Roster...'
                  : `Import ${selectedCount} Students to Class`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
