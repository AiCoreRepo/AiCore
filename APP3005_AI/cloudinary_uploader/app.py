"""
Streamlit app to upload PNGs to Cloudinary sequentially.
"""
from __future__ import annotations

import csv
import io
import json
import os
from pathlib import Path
from typing import Iterable, List

import streamlit as st

try:
    import cloudinary
    import cloudinary.uploader
except ImportError as exc:  # pragma: no cover
    raise RuntimeError(
        "Missing dependency: cloudinary. Install with `pip install cloudinary`."
    ) from exc


REQUIRED_ENV = ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")


def load_env_file(path: Path) -> List[str]:
    loaded: List[str] = []
    if not path.is_file():
        return loaded
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key or key in os.environ:
            continue
        if value and value[0] in {"'", '"'} and value[-1] == value[0]:
            value = value[1:-1]
        os.environ[key] = value
        loaded.append(key)
    return loaded


def get_missing_env() -> List[str]:
    return [name for name in REQUIRED_ENV if not os.getenv(name)]


def configure_cloudinary() -> None:
    missing = get_missing_env()
    if missing:
        raise RuntimeError(
            "Missing Cloudinary env vars: " + ", ".join(missing) + "."
        )
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    )


def list_files(input_dir: Path, pattern: str, recursive: bool) -> List[Path]:
    if recursive:
        candidates = input_dir.rglob(pattern)
    else:
        candidates = input_dir.glob(pattern)
    files = [path for path in candidates if path.is_file()]
    files.sort(key=lambda path: str(path))
    return files


def normalize_folder(value: str) -> str:
    return value.strip().strip("/")


def sanitize_folder_path(value: str) -> str:
    cleaned = []
    for ch in value.strip():
        if ch == " ":
            cleaned.append("-")
        elif ch == "\\":
            cleaned.append("/")
        elif ("0" <= ch <= "9") or ("A" <= ch <= "Z") or ("a" <= ch <= "z"):
            cleaned.append(ch)
        elif ch in {"-", "_", ".", "/"}:
            cleaned.append(ch)
        else:
            cleaned.append("_")
    result = "".join(cleaned)
    while "//" in result:
        result = result.replace("//", "/")
    return result.strip("/")


def join_folder(base: str, leaf: str) -> str:
    base = normalize_folder(base)
    leaf = normalize_folder(leaf)
    if base and leaf:
        return f"{base}/{leaf}"
    if base:
        return base
    return leaf


def folder_for_path(
    path: Path,
    root: Path,
    base_folder: str,
    per_image_folder: bool,
) -> str | None:
    if not per_image_folder:
        return base_folder or None
    try:
        rel = path.relative_to(root).with_suffix("")
        leaf = rel.as_posix()
    except ValueError:
        leaf = path.stem
    leaf = sanitize_folder_path(leaf) or "upload"
    folder = join_folder(base_folder, leaf)
    return folder or None


def folder_for_file(
    file_name: str,
    base_folder: str,
    per_image_folder: bool,
) -> str | None:
    if not per_image_folder:
        return base_folder or None
    leaf = sanitize_folder_path(Path(file_name).stem) or "upload"
    folder = join_folder(base_folder, leaf)
    return folder or None


def make_public_id(path: Path, root: Path) -> str:
    try:
        rel = path.relative_to(root)
        rel_str = rel.as_posix()
    except ValueError:
        rel_str = path.name
    rel_path = Path(rel_str)
    return str(rel_path.with_suffix(""))


def build_upload_options(
    folder: str | None,
    use_filename: bool,
    overwrite: bool,
    public_id: str | None,
) -> dict:
    options = {"resource_type": "image"}
    if folder:
        options["folder"] = folder
    if use_filename and public_id:
        options["public_id"] = public_id
        options["overwrite"] = overwrite
    return options


def upload_path(
    path: Path,
    root: Path,
    folder: str | None,
    use_filename: bool,
    overwrite: bool,
    dry_run: bool,
) -> str:
    public_id = make_public_id(path, root) if use_filename else None
    options = build_upload_options(folder, use_filename, overwrite, public_id)
    if dry_run:
        return f"DRY_RUN:{path}"
    result = cloudinary.uploader.upload(str(path), **options)
    if not result or "secure_url" not in result:
        raise RuntimeError("Cloudinary upload failed.")
    return str(result["secure_url"])


def upload_file(
    uploaded_file,
    folder: str | None,
    use_filename: bool,
    overwrite: bool,
    dry_run: bool,
) -> str:
    file_name = getattr(uploaded_file, "name", "uploaded.png")
    public_id = Path(file_name).stem if use_filename else None
    options = build_upload_options(folder, use_filename, overwrite, public_id)
    if dry_run:
        return f"DRY_RUN:{file_name}"
    uploaded_file.seek(0)
    result = cloudinary.uploader.upload(uploaded_file, **options)
    if not result or "secure_url" not in result:
        raise RuntimeError("Cloudinary upload failed.")
    return str(result["secure_url"])


def results_to_csv(rows: List[dict]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["name", "url", "status"])
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def results_to_json(rows: List[dict]) -> str:
    return json.dumps(rows, indent=2)


def progress_wrap(iterable: Iterable, total: int, label: str):
    progress = st.progress(0)
    status = st.empty()
    for idx, item in enumerate(iterable, start=1):
        status.write(f"{label} {idx}/{total}")
        yield idx, item
        progress.progress(idx / total)
    status.empty()


def main() -> None:
    st.set_page_config(page_title="Cloudinary PNG Uploader", layout="centered")
    st.title("Cloudinary PNG uploader")
    st.write("Upload a batch of PNGs to Cloudinary sequentially.")

    if "results" not in st.session_state:
        st.session_state["results"] = []
    if "errors" not in st.session_state:
        st.session_state["errors"] = []

    st.subheader("Credentials")
    env_path = st.text_input("Optional .env path", value=".env")
    load_env = st.checkbox("Load .env if present", value=True)
    if load_env and env_path:
        loaded = load_env_file(Path(env_path))
        if loaded:
            st.success("Loaded from .env: " + ", ".join(sorted(loaded)))
    missing_env = get_missing_env()
    if missing_env:
        st.error("Missing env vars: " + ", ".join(missing_env))
    else:
        st.success("Cloudinary credentials found.")

    st.subheader("Upload settings")
    folder = st.text_input("Cloudinary folder (optional)", value="training_image")
    per_image_folder = st.checkbox("Create a separate folder per image", value=False)
    if per_image_folder:
        st.caption(
            "Each image goes into its own folder under the base folder. "
            "Folder names are derived from the file name or relative path."
        )
    use_filename = st.checkbox("Use filename as public id", value=True)
    overwrite = st.checkbox("Overwrite existing public id", value=False)
    dry_run = st.checkbox("Dry run (no upload)", value=False)

    st.subheader("Input")
    mode = st.radio("Input source", ["Directory", "Upload files"], horizontal=True)

    files = []
    input_dir = None
    if mode == "Directory":
        dir_value = st.text_input("Input directory path", value="")
        pattern = st.text_input("Pattern", value="*.png")
        recursive = st.checkbox("Recursive", value=False)
        max_files = st.number_input("Max files (0 for all)", min_value=0, value=0)
        if dir_value:
            input_dir = Path(dir_value)
            if input_dir.is_dir():
                files = list_files(input_dir, pattern, recursive)
                if max_files and max_files > 0:
                    files = files[: int(max_files)]
                st.write(f"Found {len(files)} files.")
            else:
                st.warning("Input directory not found.")
    else:
        files = st.file_uploader(
            "Select PNG files", type=["png"], accept_multiple_files=True
        )
        if files:
            st.write(f"Selected {len(files)} files.")

    if st.button("Upload"):
        if missing_env and not dry_run:
            st.error("Set Cloudinary env vars before uploading.")
            return
        if not files:
            st.warning("No files selected.")
            return
        if not dry_run:
            configure_cloudinary()

        base_folder = normalize_folder(folder)
        results: List[dict] = []
        errors: List[str] = []
        total = len(files)

        if mode == "Directory":
            assert input_dir is not None
            for idx, path in progress_wrap(files, total, "Uploading"):
                name = str(path)
                try:
                    folder_value = folder_for_path(
                        path=path,
                        root=input_dir,
                        base_folder=base_folder,
                        per_image_folder=per_image_folder,
                    )
                    url = upload_path(
                        path=path,
                        root=input_dir,
                        folder=folder_value,
                        use_filename=use_filename,
                        overwrite=overwrite,
                        dry_run=dry_run,
                    )
                    results.append({"name": name, "url": url, "status": "ok"})
                except Exception as exc:  # pragma: no cover
                    errors.append(f"Upload failed for {name}: {exc}")
                    results.append({"name": name, "url": "", "status": "error"})
        else:
            for idx, uploaded in progress_wrap(files, total, "Uploading"):
                name = getattr(uploaded, "name", "uploaded.png")
                try:
                    folder_value = folder_for_file(
                        file_name=name,
                        base_folder=base_folder,
                        per_image_folder=per_image_folder,
                    )
                    url = upload_file(
                        uploaded_file=uploaded,
                        folder=folder_value,
                        use_filename=use_filename,
                        overwrite=overwrite,
                        dry_run=dry_run,
                    )
                    results.append({"name": name, "url": url, "status": "ok"})
                except Exception as exc:  # pragma: no cover
                    errors.append(f"Upload failed for {name}: {exc}")
                    results.append({"name": name, "url": "", "status": "error"})

        st.session_state["results"] = results
        st.session_state["errors"] = errors
        st.success(f"Done. Uploaded: {len(results)}, Errors: {len(errors)}")

    if st.session_state["results"]:
        st.subheader("Results")
        st.dataframe(st.session_state["results"], use_container_width=True)
        csv_data = results_to_csv(st.session_state["results"])
        json_data = results_to_json(st.session_state["results"])
        st.download_button("Download CSV", csv_data, file_name="uploads.csv")
        st.download_button("Download JSON", json_data, file_name="uploads.json")

    if st.session_state["errors"]:
        st.subheader("Errors")
        st.text("\n".join(st.session_state["errors"][:10]))


if __name__ == "__main__":
    main()
