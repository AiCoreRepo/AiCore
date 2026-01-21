import { Fragment, useEffect, useMemo, useState } from "react";
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

const EDITABLE_LIST_KEYS = LIST_FIELDS.map((field) => field.key);
const EDITABLE_TEXT_KEYS = TEXT_FIELDS.map((field) => field.key);

const LIST_KEYS = new Set(LIST_FIELDS.map((field) => field.key));

const STATIC_OPTIONS = {
  occasion: ["Formal", "Casual luxury", "Party", "Wedding", "Resort"],
  style: ["Minimal Luxury", "Elegant", "Couture", "Traditional Luxury"],
  size: ["XS", "S", "M", "L", "XL"],
  skinTone: ["Light", "Medium", "Dusky", "Deep"],
  bodyShape: [
    "Rectangle",
    "Pear Shape",
    "Apple Shape",
    "Hourglass",
    "Inverted Triangle",
  ],
};

const DATA_DRIVEN_OPTION_KEYS = new Set([
  "clothingType",
  "fit",
  "fabric",
  "colorFamily",
]);

const EMPTY_ROW = {
  id: "",
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
  id: "id",
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
  { key: "id", header: "ID" },
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
const SHEET_WRITE_URL = import.meta.env.VITE_SHEET_WRITE_URL || "";

const FILE_ACCEPT = ".csv,.xlsx,.xls";
const SUBMITTED_EMAILS_STORAGE_KEY = "fashion-annotator-submitted-emails";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

const EMAIL_SHEET_REGISTRY = {
  [normalizeEmail("rushabh@aivestire.com")]:
    "https://docs.google.com/spreadsheets/d/1RhkVlosO1BfqVvIa8kJzL-7eZ4BsJuMFhbmY9Cy-GdM/edit?gid=318082982#gid=318082982",
  [normalizeEmail("pulkit@aivestire.com")]:
    "https://docs.google.com/spreadsheets/d/1RhkVlosO1BfqVvIa8kJzL-7eZ4BsJuMFhbmY9Cy-GdM/edit?gid=1984328199#gid=1984328199",
  [normalizeEmail("pragya@aivestire.com")]:
    "https://docs.google.com/spreadsheets/d/1RhkVlosO1BfqVvIa8kJzL-7eZ4BsJuMFhbmY9Cy-GdM/edit?gid=153983295#gid=153983295",
};

function resolveSheetUrl(email) {
  return EMAIL_SHEET_REGISTRY[normalizeEmail(email)] || "";
}

function isEmailAllowed(value) {
  return Boolean(resolveSheetUrl(value));
}

function loadSubmittedEmails() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SUBMITTED_EMAILS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((email) => normalizeEmail(email)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function persistSubmittedEmails(emails) {
  if (typeof window === "undefined") return;
  const values = Array.from(emails || []);
  window.localStorage.setItem(
    SUBMITTED_EMAILS_STORAGE_KEY,
    JSON.stringify(values)
  );
}

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

function formatOptionLabel(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const withSpaces = trimmed.replace(/_/g, " ").replace(/\s+/g, " ");
  return withSpaces
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
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
        row[key] = splitList(value).map((item) =>
          normalizeInputValue(key, item)
        );
      } else {
        row[key] = normalizeInputValue(key, value);
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

function isBlank(value) {
  return !String(value ?? "").trim();
}

function hasEmptyListValue(values) {
  if (!Array.isArray(values) || values.length === 0) return true;
  return values.some((value) => isBlank(value));
}

function isScoreValid(value) {
  if (isBlank(value)) return false;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return false;
  return numeric >= 0 && numeric <= 100;
}

function isRowComplete(row) {
  if (!row) return false;
  if (EDITABLE_LIST_KEYS.some((key) => hasEmptyListValue(row[key]))) {
    return false;
  }
  if (EDITABLE_TEXT_KEYS.some((key) => isBlank(row[key]))) {
    return false;
  }
  if (isBlank(row.description)) return false;
  return isScoreValid(row.score);
}

function buildSheetUpdatePayload(row) {
  return EXPORT_COLUMNS.map((col) => {
    const value = row[col.key];
    if (LIST_KEYS.has(col.key)) {
      return { header: col.header, value: joinListValue(value) };
    }
    return {
      header: col.header,
      value: value == null ? "" : String(value).trim(),
    };
  });
}

function normalizeOptionKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .trim();
}

function normalizeToStaticOption(key, value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const options = STATIC_OPTIONS[key];
  if (!options || !options.length) return trimmed;
  const normalized = normalizeOptionKey(trimmed);
  const match = options.find(
    (option) => normalizeOptionKey(option) === normalized
  );
  return match || trimmed;
}

function normalizeInputValue(key, value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (DATA_DRIVEN_OPTION_KEYS.has(key)) {
    return formatOptionLabel(trimmed);
  }
  return normalizeToStaticOption(key, trimmed);
}

function buildSelectOptions(options, values = []) {
  const optionMap = new Map();
  const addOption = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return;
    const key = normalizeOptionKey(trimmed);
    if (!optionMap.has(key)) {
      optionMap.set(key, trimmed);
    }
  };
  (options || []).forEach(addOption);
  const valueList = Array.isArray(values) ? values : [values];
  valueList.forEach(addOption);
  return Array.from(optionMap.values()).sort((a, b) => a.localeCompare(b));
}

function SelectField({ label, value, options, onChange }) {
  const selectOptions = buildSelectOptions(options, value ? [value] : []);

  return (
    <label className="field-label">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{`Select ${label}`}</option>
        {selectOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </select>
    </label>
  );
}

function SelectListField({
  label,
  values,
  options,
  onChange,
}) {
  const selectOptions = buildSelectOptions(options, values);
  const selectedKeys = new Set(
    values.map((value) => normalizeOptionKey(value)).filter(Boolean)
  );

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
      {values.map((value, idx) => {
        const currentKey = normalizeOptionKey(value);
        const inputOptions = selectOptions.filter((option) => {
          const optionKey = normalizeOptionKey(option);
          if (!selectedKeys.has(optionKey)) return true;
          return optionKey === currentKey;
        });
        return (
          <Fragment key={`${label}-${idx}`}>
            <div className="list-row">
              <select
                value={value}
                onChange={(event) => updateValue(idx, event.target.value)}
              >
                <option value="">{`Select ${label}`}</option>
                {inputOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
          </Fragment>
        );
      })}
      <div className="list-actions">
        <button type="button" className="button secondary" onClick={addValue}>
          Add value
        </button>
        <span className="helper">Minimum 1 value</span>
      </div>
    </div>
  );
}

function postSheetWrite(payload) {
  return fetch(SHEET_WRITE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [submittedEmails, setSubmittedEmails] = useState(() =>
    loadSubmittedEmails()
  );
  const [sheetUrlInput, setSheetUrlInput] = useState(SHEET_URL || "");
  const [draftRow, setDraftRow] = useState(createEmptyRow());
  const [isDirty, setIsDirty] = useState(false);
  const [editStatus, setEditStatus] = useState(null);

  const currentRow = draftRow;

  const progressLabel = useMemo(() => {
    if (!rows.length) return "No rows loaded";
    return `Row ${currentIndex + 1} of ${rows.length}`;
  }, [rows.length, currentIndex]);

  const isCurrentRowComplete = useMemo(
    () => isRowComplete(draftRow),
    [draftRow]
  );

  const optionsByKey = useMemo(() => {
    const buckets = {};
    LIST_FIELDS.forEach((field) => {
      buckets[field.key] = new Set(STATIC_OPTIONS[field.key] || []);
    });
    TEXT_FIELDS.forEach((field) => {
      buckets[field.key] = new Set(STATIC_OPTIONS[field.key] || []);
    });

    if (rows.length) {
      rows.forEach((row) => {
        TEXT_FIELDS.forEach((field) => {
          if (!DATA_DRIVEN_OPTION_KEYS.has(field.key)) return;
          const value = normalizeInputValue(field.key, row[field.key]);
          if (value) buckets[field.key].add(value);
        });
      });
    }

    return Object.fromEntries(
      Object.entries(buckets).map(([key, set]) => [key, Array.from(set)])
    );
  }, [rows]);

  const updateRow = (patch) => {
    setDraftRow((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
    setEditStatus(null);
  };

  const updateListField = (key, values) => {
    updateRow({ [key]: values.length ? values : [""] });
  };

  const handleAuthorize = () => {
    const normalized = normalizeEmail(emailInput);
    if (!normalized) {
      setAuthStatus({ type: "error", message: "Enter your email to continue." });
      return;
    }
    const sheetUrl = resolveSheetUrl(normalized);
    if (!sheetUrl) {
      setAuthStatus({
        type: "error",
        message: "This email is not allowed to access the annotator.",
      });
      return;
    }
    if (submittedEmails.has(normalized)) {
      setAuthStatus({
        type: "error",
        message: "Final submission already completed for this email.",
      });
      return;
    }
    if (!SHEET_WRITE_URL) {
      setIsAuthorized(true);
      setActiveEmail(normalized);
      setSheetUrlInput(sheetUrl);
      setAuthStatus({
        type: "success",
        message: "Access granted. Loading your data...",
      });
      return;
    }
    setIsAuthorizing(true);
    setAuthStatus({ type: "loading", message: "Checking access..." });
    postSheetWrite({ action: "checkEmail", email: normalized })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
          throw new Error(data.message || "Unable to verify access.");
        }
        if (data.submitted) {
          throw new Error("Final submission already completed for this email.");
        }
        setIsAuthorized(true);
        setActiveEmail(normalized);
        setSheetUrlInput(sheetUrl);
        setAuthStatus({
          type: "success",
          message: "Access granted. Loading your data...",
        });
      })
      .catch((error) => {
        setAuthStatus({
          type: "error",
          message: error.message || "Unable to verify access.",
        });
      })
      .finally(() => {
        setIsAuthorizing(false);
      });
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

  useEffect(() => {
    if (!isAuthorized) return;
    const sheetUrl = resolveSheetUrl(activeEmail) || SHEET_URL;
    if (!sheetUrl) {
      setStatus({
        type: "error",
        message: "Sheet URL is not configured for this annotator.",
      });
      return;
    }

    handleLoad(sheetUrl);
  }, [isAuthorized, activeEmail]);

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
    if (!SHEET_WRITE_URL) {
      setEditStatus({
        type: "error",
        message: "Sheet write URL is not configured.",
      });
      return;
    }
    if (!draftRow.id) {
      setEditStatus({
        type: "error",
        message: "Row ID is missing. Unable to save.",
      });
      return;
    }
    const sheetUrlForWrite =
      sheetUrlInput || resolveSheetUrl(activeEmail) || SHEET_URL;
    setIsSaving(true);
    setEditStatus({ type: "loading", message: "Saving to sheet..." });
    const payload = {
      action: "saveRow",
      email: activeEmail,
      sheetUrl: sheetUrlForWrite,
      id: String(draftRow.id).trim(),
      values: buildSheetUpdatePayload(draftRow),
    };
    postSheetWrite(payload)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
          throw new Error(data.message || "Failed to save row.");
        }
        setRows((prev) =>
          prev.map((row, idx) => (idx === currentIndex ? draftRow : row))
        );
        setIsDirty(false);
        setEditStatus({ type: "success", message: "Row saved to sheet." });
      })
      .catch((error) => {
        setEditStatus({
          type: "error",
          message: error.message || "Failed to save row.",
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleSaveNext = () => {
    if (!rows.length) return;
    if (!SHEET_WRITE_URL) {
      setEditStatus({
        type: "error",
        message: "Sheet write URL is not configured.",
      });
      return;
    }
    if (!draftRow.id) {
      setEditStatus({
        type: "error",
        message: "Row ID is missing. Unable to save.",
      });
      return;
    }
    const sheetUrlForWrite =
      sheetUrlInput || resolveSheetUrl(activeEmail) || SHEET_URL;
    setIsSaving(true);
    setEditStatus({ type: "loading", message: "Saving to sheet..." });
    const nextRows = rows.map((row, idx) =>
      idx === currentIndex ? draftRow : row
    );
    const payload = {
      action: "saveRow",
      email: activeEmail,
      sheetUrl: sheetUrlForWrite,
      id: String(draftRow.id).trim(),
      values: buildSheetUpdatePayload(draftRow),
    };
    postSheetWrite(payload)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
          throw new Error(data.message || "Failed to save row.");
        }
        setRows(nextRows);
        setIsDirty(false);
        setEditStatus(null);
        setCurrentIndex((prev) => Math.min(prev + 1, rows.length - 1));
      })
      .catch((error) => {
        setEditStatus({
          type: "error",
          message: error.message || "Failed to save row.",
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleFinalSubmission = () => {
    if (!rows.length || !activeEmail) return;
    if (!SHEET_WRITE_URL) {
      setEditStatus({
        type: "error",
        message: "Sheet write URL is not configured.",
      });
      return;
    }
    if (!draftRow.id) {
      setEditStatus({
        type: "error",
        message: "Row ID is missing. Unable to submit.",
      });
      return;
    }
    const sheetUrlForWrite =
      sheetUrlInput || resolveSheetUrl(activeEmail) || SHEET_URL;
    setIsSaving(true);
    setEditStatus({ type: "loading", message: "Submitting final..." });
    const savePayload = {
      action: "saveRow",
      email: activeEmail,
      sheetUrl: sheetUrlForWrite,
      id: String(draftRow.id).trim(),
      values: buildSheetUpdatePayload(draftRow),
    };
    const submitPayload = {
      action: "finalSubmit",
      email: activeEmail,
    };
    postSheetWrite(savePayload)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
          throw new Error(data.message || "Failed to save row.");
        }
        return postSheetWrite(submitPayload);
      })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
          throw new Error(data.message || "Failed to submit.");
        }
        const updated = new Set(submittedEmails);
        updated.add(activeEmail);
        persistSubmittedEmails(updated);
        setSubmittedEmails(updated);
        setIsAuthorized(false);
        setActiveEmail("");
        setRows([]);
        setCurrentIndex(0);
        setDraftRow(createEmptyRow());
        setAuthStatus({
          type: "success",
          message: "Final submission completed. Access is now closed.",
        });
        setEditStatus(null);
      })
      .catch((error) => {
        setEditStatus({
          type: "error",
          message: error.message || "Failed to submit.",
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
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

      </header>

      <div className="content-grid">
        {!isAuthorized ? (
          <section className="panel">
            <h2>Access</h2>
            <p>Enter your email to start annotating.</p>
            <form
              className="input-row"
              onSubmit={(event) => {
                event.preventDefault();
                handleAuthorize();
              }}
            >
              <label className="field-label">
                Email
                <input
                  type="email"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="abc@email.com"
                  autoComplete="email"
                  disabled={isAuthorized || isAuthorizing}
                />
              </label>
              <button
                className="button primary"
                type="submit"
                disabled={isAuthorized || isAuthorizing}
              >
                Start
              </button>
            </form>
            {activeEmail ? (
              <div className="data-hint">{`Signed in as ${activeEmail}`}</div>
            ) : null}
            {authStatus ? (
              <div className={`status ${authStatus.type}`}>
                {authStatus.message}
              </div>
            ) : null}
          </section>
        ) : null}
        {isAuthorized ? (
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
                    {isDirty ? (
                      <div className="badge neutral">Unsaved changes</div>
                    ) : null}
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
                  </div>

                  <div className="field-group" style={{ "--i": 2 }}>
                    <h3>Tags</h3>
                    {LIST_FIELDS.map((field) => (
                      <SelectListField
                        key={field.key}
                        label={field.label}
                        values={currentRow[field.key]}
                        options={optionsByKey[field.key] || []}
                        onChange={(values) => updateListField(field.key, values)}
                      />
                    ))}
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
                      <label className="field-label">Score (0 - 100)</label>
                      <div className="score-row">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={currentRow.score}
                          onChange={(event) =>
                            updateRow({ score: event.target.value })
                          }
                          placeholder="0-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="nav-buttons">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0 || isSaving}
                  >
                    Previous
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={handleSave}
                    disabled={!rows.length || !isDirty || isSaving}
                  >
                    Save
                  </button>
                  <button
                    className="button primary"
                    type="button"
                    onClick={handleSaveNext}
                    disabled={
                      currentIndex === rows.length - 1 ||
                      !isCurrentRowComplete ||
                      isSaving
                    }
                  >
                    Save & Next
                  </button>
                  {currentIndex === rows.length - 1 ? (
                    <button
                      className="button primary"
                      type="button"
                      onClick={handleFinalSubmission}
                      disabled={!isCurrentRowComplete || isSaving}
                    >
                      Final Submission
                    </button>
                  ) : null}
                  <button
                    className="button ghost"
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === rows.length - 1 || isSaving}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
