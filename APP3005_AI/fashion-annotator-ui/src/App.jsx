import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const LIST_FIELDS = [
  {
    key: "occasion",
    label: "Occasion",
    placeholder: "Resort, Evening, Work",
  },
  {
    key: "bodyShape",
    label: "Recommended Body Shape",
    placeholder: "Rectangle, Hourglass, Pear",
  },
  {
    key: "size",
    label: "Recommended Size",
    placeholder: "Small, Medium, Large",
  },
  {
    key: "skinTone",
    label: "Skin Tone",
    placeholder: "Light, Medium, Dusky",
  },
];

const TEXT_FIELDS = [
  {
    key: "clothingType",
    label: "Clothing Type",
    placeholder: "Maxi dress",
  },
  {
    key: "fit",
    label: "Fit",
    placeholder: "Flowing",
  },
  {
    key: "fabric",
    label: "Fabric",
    placeholder: "Chiffon",
  },
  {
    key: "colorFamily",
    label: "Color Family",
    placeholder: "Pastel",
  },
  {
    key: "style",
    label: "Style",
    placeholder: "Elegant",
  },
];

const SCORE_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const value = (index / 20).toFixed(2);
  return String(Number(value));
});

const LIST_KEYS = new Set(LIST_FIELDS.map((field) => field.key));

const EMPTY_ROW = {
  image: "",
  clothId: "",
  occasion: [""],
  bodyShape: [""],
  size: [""],
  skinTone: [""],
  clothingType: "",
  fit: "",
  fabric: "",
  colorFamily: "",
  style: "",
  description: "",
  score: "",
};

const HEADER_MAP = {
  image: "image",
  imagepath: "image",
  imageurl: "image",
  img: "image",
  clothid: "clothId",
  occasion: "occasion",
  recommendedbodyshape: "bodyShape",
  bodyshape: "bodyShape",
  body: "bodyShape",
  recommendedsize: "size",
  size: "size",
  skintone: "skinTone",
  skintones: "skinTone",
  clothingtype: "clothingType",
  clothtype: "clothingType",
  garmenttype: "clothingType",
  fit: "fit",
  fabric: "fabric",
  colorfamily: "colorFamily",
  color: "colorFamily",
  style: "style",
  description: "description",
  desc: "description",
  clothdescription: "description",
  clothingdescription: "description",
  score: "score",
  rating: "score",
};

const EXPORT_COLUMNS = [
  { key: "image", header: "Image" },
  { key: "clothId", header: "Cloth ID" },
  { key: "occasion", header: "Occasion" },
  { key: "bodyShape", header: "Recommended Body Shape" },
  { key: "size", header: "Recommended Size" },
  { key: "skinTone", header: "Skin Tone" },
  { key: "clothingType", header: "Clothing Type" },
  { key: "fit", header: "Fit" },
  { key: "fabric", header: "Fabric" },
  { key: "colorFamily", header: "Color_family" },
  { key: "style", header: "Style" },
  { key: "description", header: "Description" },
  { key: "score", header: "Score" },
];

const DEFAULT_IMAGE_BASE = "testiing_image_collection/";
const IMAGE_BASE = (() => {
  const value = import.meta.env.VITE_IMAGE_BASE_URL || DEFAULT_IMAGE_BASE;
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
})();

const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqUSlmyyVwaFnFr-d-6rP7og23BK9ySH8_A78m_xPk3XvNSPSYyIDZ45YLvKrWHpIU7HXHQ92yILFo/pub?gid=783869189&single=true&output=csv";
const SHEET_URL = import.meta.env.VITE_SHEET_URL || DEFAULT_SHEET_URL;
const FILE_ACCEPT = ".csv,.xlsx,.xls";

function normalizeHeader(value) {
  return value
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[\s_-]+/g, "")
    .trim();
}

function mapHeader(value) {
  if (!value) return null;
  const normalized = normalizeHeader(value);
  return HEADER_MAP[normalized] || null;
}

function splitList(value) {
  const items = String(value || "")
    .split(/[;,|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : [""];
}

function parseCSV(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(current);
      current = "";
    } else if (char === "\n") {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else if (char === "\r") {
      continue;
    } else {
      current += char;
    }
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the file."));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the file."));
    reader.readAsArrayBuffer(file);
  });
}

async function parseFile(file) {
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".csv")) {
    const text = await readFileAsText(file);
    return parseCSV(text);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const data = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
  }
  return [];
}

function isRowEmpty(row) {
  return row.every((cell) => !String(cell || "").trim());
}

function createEmptyRow() {
  return { ...EMPTY_ROW };
}

function ensureListFields(row) {
  LIST_KEYS.forEach((key) => {
    if (!Array.isArray(row[key]) || row[key].length === 0) {
      row[key] = [""];
    }
  });
  return row;
}

function cloneRow(row) {
  if (!row) return createEmptyRow();
  const next = { ...row };
  LIST_KEYS.forEach((key) => {
    if (Array.isArray(next[key])) {
      next[key] = [...next[key]];
    }
  });
  return next;
}

function deriveImageFromClothId(value) {
  const match = String(value || "").match(/\d+/);
  if (!match) return "";
  const numeric = Number(match[0]);
  if (!Number.isFinite(numeric)) return "";
  return `${numeric}.png`;
}

function applyImageFallback(row) {
  if (row.image) return row;
  const derived = deriveImageFromClothId(row.clothId);
  if (derived) {
    row.image = derived;
  }
  return row;
}

function buildRows(parsedRows) {
  if (!parsedRows.length) return [];
  const headerRow = parsedRows[0];
  const headerMap = headerRow.map((cell) => mapHeader(cell || ""));

  const rows = [];
  for (let i = 1; i < parsedRows.length; i += 1) {
    const rawRow = parsedRows[i];
    if (isRowEmpty(rawRow)) continue;

    const row = createEmptyRow();
    headerMap.forEach((key, idx) => {
      if (!key) return;
      const value = rawRow[idx] ?? "";
      if (LIST_KEYS.has(key)) {
        row[key] = splitList(value);
      } else {
        row[key] = String(value || "").trim();
      }
    });

    applyImageFallback(row);
    rows.push(ensureListFields(row));
  }

  return rows;
}

function buildCsvUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();

  if (
    lower.includes("format=csv") ||
    lower.includes("output=csv") ||
    lower.endsWith(".csv")
  ) {
    return trimmed;
  }

  const match = trimmed.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return "";

  const sheetId = match[1];
  const gidMatch = trimmed.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : "0";

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function resolveImageSrc(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }
  if (IMAGE_BASE && !trimmed.includes("/")) {
    return `${IMAGE_BASE}${trimmed}`;
  }
  return trimmed;
}

function joinListValue(value) {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    return cleaned.join(", ");
  }
  return String(value || "").trim();
}

function buildExportData(rows) {
  const headerRow = EXPORT_COLUMNS.map((col) => col.header);
  const dataRows = rows.map((row) =>
    EXPORT_COLUMNS.map((col) => {
      const value = row[col.key];
      if (LIST_KEYS.has(col.key)) {
        return joinListValue(value);
      }
      return value == null ? "" : String(value).trim();
    })
  );
  return [headerRow, ...dataRows];
}

function downloadBlob(data, filename, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildSelectOptions(options, values = []) {
  const optionSet = new Set((options || []).filter(Boolean));
  const valueList = Array.isArray(values) ? values : [values];
  valueList
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .forEach((value) => optionSet.add(value));
  return Array.from(optionSet).sort((a, b) => a.localeCompare(b));
}

function SelectField({ label, value, placeholder, options, onChange, listId }) {
  const selectOptions = buildSelectOptions(options, value ? [value] : []);

  return (
    <label className="field-label">
      {label}
      <input
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || `Enter ${label}`}
      />
      <datalist id={listId}>
        {selectOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function SelectListField({
  label,
  values,
  placeholder,
  options,
  onChange,
  listId,
}) {
  const selectOptions = buildSelectOptions(options, values);

  const updateValue = (index, nextValue) => {
    const next = [...values];
    next[index] = nextValue;
    onChange(next);
  };

  const moveValue = (from, to) => {
    if (to < 0 || to >= values.length) return;
    const next = [...values];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const addValue = () => {
    onChange([...values, ""]);
  };

  const removeValue = (index) => {
    if (values.length <= 1) return;
    onChange(values.filter((_, idx) => idx !== index));
  };

  return (
    <div className="list-field">
      <span className="field-label">{label}</span>
      {values.map((value, idx) => (
        <div className="list-row" key={`${label}-${idx}`}>
          <input
            list={listId}
            value={value}
            onChange={(event) => updateValue(idx, event.target.value)}
            placeholder={placeholder || `Enter ${label}`}
          />
          <div className="list-controls">
            <button
              type="button"
              onClick={() => moveValue(idx, idx - 1)}
              disabled={idx === 0}
              aria-label={`Move ${label} up`}
            >
              Up
            </button>
            <button
              type="button"
              onClick={() => moveValue(idx, idx + 1)}
              disabled={idx === values.length - 1}
              aria-label={`Move ${label} down`}
            >
              Down
            </button>
            <button
              type="button"
              onClick={() => removeValue(idx)}
              disabled={values.length <= 1}
              aria-label={`Remove ${label}`}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <datalist id={listId}>
        {selectOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <div className="list-actions">
        <button type="button" className="button secondary" onClick={addValue}>
          Add value
        </button>
        <span className="helper">Minimum 1 value</span>
      </div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState(SHEET_URL || "");
  const [exportName, setExportName] = useState("fashion_annotations");
  const [draftRow, setDraftRow] = useState(createEmptyRow());
  const [isDirty, setIsDirty] = useState(false);
  const [editStatus, setEditStatus] = useState(null);

  const currentRow = draftRow;

  const progressLabel = useMemo(() => {
    if (!rows.length) return "No rows loaded";
    return `Row ${currentIndex + 1} of ${rows.length}`;
  }, [rows.length, currentIndex]);

  const scoredCount = useMemo(
    () =>
      rows.filter((row) => String(row.score || "").trim().length > 0).length,
    [rows]
  );

  const optionsByKey = useMemo(() => {
    if (!rows.length) return {};
    const buckets = {};
    LIST_FIELDS.forEach((field) => {
      buckets[field.key] = new Set();
    });
    TEXT_FIELDS.forEach((field) => {
      buckets[field.key] = new Set();
    });
    buckets.image = new Set();
    buckets.score = new Set();

    rows.forEach((row) => {
      LIST_FIELDS.forEach((field) => {
        (row[field.key] || []).forEach((value) => {
          const trimmed = String(value || "").trim();
          if (trimmed) buckets[field.key].add(trimmed);
        });
      });
      TEXT_FIELDS.forEach((field) => {
        const trimmed = String(row[field.key] || "").trim();
        if (trimmed) buckets[field.key].add(trimmed);
      });
      const imageValue = String(row.image || "").trim();
      if (imageValue) buckets.image.add(imageValue);
      const scoreValue = String(row.score || "").trim();
      if (scoreValue) buckets.score.add(scoreValue);
    });

    return Object.fromEntries(
      Object.entries(buckets).map(([key, set]) => [
        key,
        Array.from(set).sort((a, b) => a.localeCompare(b)),
      ])
    );
  }, [rows]);

  const imageOptions = useMemo(
    () =>
      buildSelectOptions(
        optionsByKey.image || [],
        currentRow?.image ? [currentRow.image] : []
      ),
    [currentRow?.image, optionsByKey.image]
  );

  const scoreOptions = useMemo(
    () =>
      buildSelectOptions(
        [...SCORE_OPTIONS, ...(optionsByKey.score || [])],
        currentRow?.score ? [currentRow.score] : []
      ),
    [currentRow?.score, optionsByKey.score]
  );

  const updateRow = (patch) => {
    setDraftRow((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
    setEditStatus(null);
  };

  const updateListField = (key, values) => {
    updateRow({ [key]: values.length ? values : [""] });
  };

  const handleLoad = async (sourceUrl = SHEET_URL) => {
    if (!sourceUrl) {
      setStatus({
        type: "error",
        message: "Sheet URL is not configured for this annotator.",
      });
      return;
    }

    const csvUrl = buildCsvUrl(sourceUrl);
    if (!csvUrl) {
      setStatus({
        type: "error",
        message: "Sheet URL is invalid. Check the configured link.",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: "loading", message: "Loading data..." });

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error("Unable to fetch sheet. Check sharing settings.");
      }
      const text = await response.text();
      const parsed = parseCSV(text);
      const nextRows = buildRows(parsed);

      if (!nextRows.length) {
        throw new Error("No usable rows found in the sheet.");
      }

      setRows(nextRows);
      setCurrentIndex(0);
      setDraftRow(cloneRow(nextRows[0]));
      setIsDirty(false);
      setEditStatus(null);
      setStatus({
        type: "success",
        message: `Loaded ${nextRows.length} rows from your sheet.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Failed to load the sheet.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromUrl = () => {
    handleLoad(sheetUrlInput);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatus({ type: "loading", message: "Loading file..." });

    try {
      const parsed = await parseFile(file);
      const nextRows = buildRows(parsed);
      if (!nextRows.length) {
        throw new Error("No usable rows found in the file.");
      }
      setRows(nextRows);
      setCurrentIndex(0);
      setDraftRow(cloneRow(nextRows[0]));
      setIsDirty(false);
      setEditStatus(null);
      setStatus({
        type: "success",
        message: `Loaded ${nextRows.length} rows from ${file.name}.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Failed to load the file.",
      });
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const getRowsForExport = () =>
    rows.map((row, idx) => (idx === currentIndex ? draftRow : row));

  const handleDownloadCsv = () => {
    if (!rows.length) return;
    const exportRows = buildExportData(getRowsForExport());
    const worksheet = XLSX.utils.aoa_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const safeName = exportName.trim() || "fashion_annotations";
    downloadBlob(csv, `${safeName}.csv`, "text/csv;charset=utf-8");
  };

  const handleDownloadXlsx = () => {
    if (!rows.length) return;
    const exportRows = buildExportData(getRowsForExport());
    const worksheet = XLSX.utils.aoa_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Annotations");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const safeName = exportName.trim() || "fashion_annotations";
    downloadBlob(
      buffer,
      `${safeName}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  };

  useEffect(() => {
    if (!SHEET_URL) {
      setStatus({
        type: "error",
        message: "Sheet URL is not configured for this annotator.",
      });
      return;
    }

    handleLoad(SHEET_URL);
  }, []);

  useEffect(() => {
    if (!rows.length) {
      setDraftRow(createEmptyRow());
      setIsDirty(false);
      return;
    }
    const nextRow = rows[currentIndex];
    if (!nextRow) return;
    setDraftRow(cloneRow(nextRow));
    setIsDirty(false);
  }, [rows, currentIndex]);

  const handleSave = () => {
    if (!rows.length) return;
    setRows((prev) =>
      prev.map((row, idx) => (idx === currentIndex ? draftRow : row))
    );
    setIsDirty(false);
    setEditStatus({ type: "success", message: "Row saved." });
  };

  const handleSaveNext = () => {
    if (!rows.length) return;
    setRows((prev) =>
      prev.map((row, idx) => (idx === currentIndex ? draftRow : row))
    );
    setIsDirty(false);
    setEditStatus(null);
    setCurrentIndex((prev) => Math.min(prev + 1, rows.length - 1));
  };

  const handleNext = () => {
    if (isDirty) {
      setEditStatus({
        type: "error",
        message: "Unsaved changes. Use Save or Save & Next.",
      });
      return;
    }
    setCurrentIndex((prev) => Math.min(prev + 1, rows.length - 1));
  };

  const handlePrev = () => {
    if (isDirty) {
      setEditStatus({
        type: "error",
        message: "Unsaved changes. Use Save before moving.",
      });
      return;
    }
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>Fashion Annotator Studio</h1>
        <p>
          Review each row from your sheet or Excel upload and let designers
          adjust body shapes, skin tones, sizes, occasions, and descriptions
          with full control.
        </p>
      </header>

      <div className="content-grid">
        <section className="panel">
          <h2>Data Source</h2>
          <p>
            Load a published sheet or upload a local Excel file with Cloudinary
            image links.
          </p>
          <div className="input-row">
            <label className="field-label">Sheet or CSV URL</label>
            <input
              value={sheetUrlInput}
              onChange={(event) => setSheetUrlInput(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <button
              className="button secondary"
              type="button"
              onClick={handleLoadFromUrl}
              disabled={isLoading}
            >
              Load URL
            </button>
            <span className="helper">
              Supports Google Sheets links or direct CSV URLs.
            </span>
          </div>
          <div className="input-row">
            <label className="field-label">Local Excel/CSV file</label>
            <input type="file" accept={FILE_ACCEPT} onChange={handleFileChange} />
            <span className="helper">
              Use an Image or image_url column with Cloudinary links.
            </span>
          </div>
          <div className="input-row">
            <label className="field-label">Export file name</label>
            <input
              value={exportName}
              onChange={(event) => setExportName(event.target.value)}
              placeholder="fashion_annotations"
            />
            <div className="button-row">
              <button
                className="button secondary"
                type="button"
                onClick={handleDownloadCsv}
                disabled={!rows.length}
              >
                Download CSV
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={handleDownloadXlsx}
                disabled={!rows.length}
              >
                Download XLSX
              </button>
            </div>
            <span className="helper">
              Downloads your current annotations; it does not update the source
              sheet.
            </span>
          </div>
          {status ? (
            <div className={`status ${status.type}`}>{status.message}</div>
          ) : (
            <div className="data-hint">
              Upload a sheet to start annotating rows.
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Annotate Row</h2>
          {!rows.length ? (
            <div className="empty-state">
              {isLoading
                ? "Loading data..."
                : "Select a data source to begin annotating."}
            </div>
          ) : (
            <div className="editor-shell">
              <div className="editor-top">
                <div className="badge-group">
                  <div className="badge">{progressLabel}</div>
                  <div className="badge neutral">
                    Scored {scoredCount} of {rows.length}
                  </div>
                  {isDirty ? (
                    <div className="badge neutral">Unsaved changes</div>
                  ) : null}
                </div>
                <div className="nav-buttons">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    Previous
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={handleSave}
                    disabled={!rows.length || !isDirty}
                  >
                    Save
                  </button>
                  <button
                    className="button primary"
                    type="button"
                    onClick={handleSaveNext}
                    disabled={currentIndex === rows.length - 1}
                  >
                    Save & Next
                  </button>
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === rows.length - 1}
                  >
                    Next (no save)
                  </button>
                </div>
              </div>
              {editStatus ? (
                <div className={`status ${editStatus.type}`}>
                  {editStatus.message}
                </div>
              ) : null}

              <div className="editor-grid">
                <div className="field-group" style={{ "--i": 1 }}>
                  <h3>Image</h3>
                  <div className="image-frame">
                    {resolveImageSrc(currentRow.image) ? (
                      <img
                        src={resolveImageSrc(currentRow.image)}
                        alt="Fashion reference"
                      />
                    ) : (
                      <div>Image preview will appear here.</div>
                    )}
                  </div>
                  <div className="input-row">
                    <label className="field-label">Image path or URL</label>
                    <select
                      value={currentRow.image}
                      onChange={(event) =>
                        updateRow({ image: event.target.value })
                      }
                    >
                      <option value="">Select image</option>
                      {imageOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="helper">
                      Use a URL or a relative path from your hosted images.
                    </span>
                  </div>
                </div>

                <div className="field-group" style={{ "--i": 2 }}>
                  <h3>Tags</h3>
                  {LIST_FIELDS.map((field) => (
                    <SelectListField
                      key={field.key}
                      label={field.label}
                      values={currentRow[field.key]}
                      placeholder={field.placeholder}
                      options={optionsByKey[field.key] || []}
                      listId={`list-${field.key}`}
                      onChange={(values) => updateListField(field.key, values)}
                    />
                  ))}
                </div>

                <div className="field-group" style={{ "--i": 3 }}>
                  <h3>Garment Details</h3>
                  <div className="input-row">
                    {TEXT_FIELDS.map((field) => (
                      <SelectField
                        key={field.key}
                        label={field.label}
                        value={currentRow[field.key]}
                        placeholder={field.placeholder}
                        options={optionsByKey[field.key] || []}
                        listId={`text-${field.key}`}
                        onChange={(value) =>
                          updateRow({ [field.key]: value })
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="field-group" style={{ "--i": 4 }}>
                  <h3>Story and Score</h3>
                  <div className="input-row">
                    <label className="field-label">Description</label>
                    <textarea
                      value={currentRow.description}
                      placeholder="Sky blue flowing resort maxi dress near ocean at sunset"
                      onChange={(event) =>
                        updateRow({ description: event.target.value })
                      }
                    />
                    <label className="field-label">Score (0 - 1)</label>
                    <div className="score-row">
                      <select
                        value={currentRow.score}
                        onChange={(event) =>
                          updateRow({ score: event.target.value })
                        }
                      >
                        <option value="">Select score</option>
                        {scoreOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() => updateRow({ score: "1" })}
                      >
                        Mark OK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
