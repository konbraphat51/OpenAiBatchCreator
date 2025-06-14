# OpenAI Batch Creator & Result Reader

A modern React + TypeScript web app for creating OpenAI batch API `.jsonl` files from CSVs and reading OpenAI batch result `.jsonl` files. Built with Vite and Material UI.

## Features

- **Batch Creator:**
  - Set base system and user prompts with CSV variable substitution (no brackets, just variable names).
  - Configure all OpenAI chat completion parameters (type-checked, range-limited, easily extensible).
  - Upload a CSV file (first row: variable names, subsequent rows: values).
  - Generate and download a `.jsonl` file for OpenAI's batch API, with each line a full request object (including custom_id, method, url, and body).
- **Result Reader:**
  - Upload a result `.jsonl` file from OpenAI batch API.
  - Extracts `custom_id` and `response.body.choices[0].message.content` from each entry.
  - Presents results as a CSV table (custom_id, content) directly in the UI.
  - Copy results as CSV to clipboard or download as a `.csv` file.
- **Modern UI:**
  - Material UI, responsive layout, tabbed interface for easy switching between creator and reader.

## How to Use

1. **Access**
   https://konbraphat51.github.io/OpenAiBatchCreator/

2. **Creating Batch files**

   - Enter your base system and user prompts. Use variable names (e.g. `A`, `B`) directly in the prompt text.
   - Configure OpenAI parameters as needed.
   - Upload a CSV file (first row: variable names; next rows: values).
   - Click **Create** to download a `.jsonl` file ready for OpenAI's batch API.

3. **Reading Results**
   - Switch to the **Read Result** tab.
   - Upload a result `.jsonl` file from OpenAI batch API.
   - View parsed results as a CSV table (custom_id, content).
   - Copy the CSV to clipboard or download as a `.csv` file.

---

## Project structure

- `src/components/BatchCreator.tsx` — Main batch creation UI and logic
- `src/components/ResultReader.tsx` — Result file reader and CSV exporter
- `src/App.tsx` — Tabbed interface
- `src/App.css` — Styling

---

MIT License
