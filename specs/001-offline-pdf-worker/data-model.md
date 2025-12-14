# Data Model: Offline PDF Worker

## Entities

- **PDF Statement File**
  - Description: User-selected PDF bank statement used for transaction parsing.
  - Key attributes: file name, file size, pages; content is parsed client-side.
  - Notes: No persistence changes; continues to flow through existing parse pipeline.

- **PDF Worker Asset**
  - Description: Local worker script used by pdfjs to parse PDFs.
  - Key attributes: bundled asset URL (dev/build), availability status.
  - Notes: Must be emitted in build output and reachable offline; no data stored.
