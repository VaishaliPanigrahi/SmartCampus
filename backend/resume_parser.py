from pathlib import Path


def extract_text_from_pdf(file_path: Path) -> str:
    import pymupdf

    document = pymupdf.open(file_path)
    try:
        pages = [page.get_text('text') for page in document]
    finally:
        document.close()

    return '\n'.join(pages).strip()
