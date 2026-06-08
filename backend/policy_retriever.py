import os
import glob
import PyPDF2
from rank_bm25 import BM25Okapi
from dotenv import load_dotenv

load_dotenv()

# Can be overridden via POLICY_DIR env var (useful in Docker)
POLICY_DIR = os.environ.get(
    "POLICY_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "resources", "HR_Knowledge_Base"))
)

_index: BM25Okapi | None = None
_chunks: list[str] = []
_chunk_sources: list[str] = []


def _load_policy_index():
    global _index, _chunks, _chunk_sources

    if _index is not None:
        return  # Already loaded

    pdf_files = glob.glob(os.path.join(POLICY_DIR, "*.pdf"))
    if not pdf_files:
        print(f"[WARN] No PDFs found in: {POLICY_DIR}")
        _chunks = ["No policy documents available."]
        _chunk_sources = ["N/A"]
        _index = BM25Okapi([["no", "policy"]])
        return

    print(f"Indexing {len(pdf_files)} policy PDFs...")
    CHUNK_SIZE = 600
    OVERLAP = 100

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        try:
            reader = PyPDF2.PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"

            # Sliding-window chunking
            for i in range(0, len(text), CHUNK_SIZE - OVERLAP):
                chunk = text[i : i + CHUNK_SIZE].strip()
                if len(chunk) > 60:
                    _chunks.append(chunk)
                    _chunk_sources.append(filename)
        except Exception as exc:
            print(f"  [WARN] Could not read {filename}: {exc}")

    if not _chunks:
        _chunks = ["Policy documents could not be parsed."]
        _chunk_sources = ["N/A"]

    tokenized = [c.lower().split() for c in _chunks]
    _index = BM25Okapi(tokenized)
    print(f"  [OK] Indexed {len(_chunks)} chunks from {len(pdf_files)} PDFs")


def retrieve_policy(query: str, top_k: int = 5) -> str:
    """Return the top-k most relevant policy snippets for a query."""
    _load_policy_index()

    tokens = query.lower().split()
    scores = _index.get_scores(tokens)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

    results = []
    for idx in top_indices:
        if scores[idx] > 0:
            results.append(f"[Source: {_chunk_sources[idx]}]\n{_chunks[idx]}")

    return "\n\n---\n\n".join(results) if results else "No relevant policy information found."
