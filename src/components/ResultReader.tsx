import React, {useState} from "react"
import {
	Container,
	Paper,
	Typography,
	Button,
	Box,
	Alert,
	Divider,
	Snackbar,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material"

const ResultReader: React.FC = () => {
	const [jsonlError, setJsonlError] = useState<string | null>(null)
	const [jsonResult, setJsonResult] = useState<string | null>(null)
	const [snackbarOpen, setSnackbarOpen] = useState(false)
	const [csvRows, setCsvRows] = useState<string[][]>([])

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		setJsonlError(null)
		setJsonResult(null)
		setCsvRows([])
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (event) => {
			try {
				const text = event.target?.result as string
				const lines = text.split(/\r?\n/).filter(Boolean)
				const results: {custom_id: string; content: string}[] = []
				const csvRowsTemp: string[][] = []
				for (const line of lines) {
					try {
						const obj = JSON.parse(line)
						const custom_id = obj.custom_id
						const content = obj.response?.body?.choices?.[0]?.message?.content
						if (custom_id && typeof content === "string") {
							results.push({custom_id, content})
							csvRowsTemp.push([custom_id, content])
						}
					} catch (err) {
						// skip invalid lines
					}
				}
				setJsonResult(JSON.stringify({results}, null, 2))
				setCsvRows(csvRowsTemp)
			} catch (err: any) {
				setJsonlError("Failed to parse .jsonl file: " + err.message)
			}
		}
		reader.onerror = () => setJsonlError("Failed to read file.")
		reader.readAsText(file)
	}

	const handleCopy = () => {
		if (jsonResult) {
			navigator.clipboard.writeText(jsonResult)
			setSnackbarOpen(true)
		}
	}

	const handleDownload = () => {
		if (jsonResult) {
			try {
				const obj = JSON.parse(jsonResult)
				const results = obj.results || []
				if (!Array.isArray(results) || results.length === 0) return
				// Prepare CSV header
				const header = Object.keys(results[0])
				const csvRows = [header.join(",")]
				// Prepare CSV rows
				for (const row of results) {
					csvRows.push(
						header
							.map((h) => {
								let value = String(row[h])
								if (h === "content") {
									// Escape double quotes and newlines for CSV
									value = value.replace(/"/g, '""').replace(/\r?\n|\r/g, "\\n")
								}
								return `"${value}"`
							})
							.join(","),
					)
				}
				const csvContent = csvRows.join("\r\n")
				const blob = new Blob([csvContent], {type: "text/csv"})
				const url = URL.createObjectURL(blob)
				const a = document.createElement("a")
				a.href = url
				a.download = "results.csv"
				document.body.appendChild(a)
				a.click()
				setTimeout(() => {
					URL.revokeObjectURL(url)
					document.body.removeChild(a)
				}, 0)
			} catch {}
		}
	}

	return (
		<Container maxWidth="md" sx={{py: 4}}>
			<Paper elevation={3} sx={{p: 4}}>
				<Typography variant="h4" gutterBottom>
					Read Result
				</Typography>
				<Divider sx={{mb: 3}} />
				<Button variant="contained" component="label">
					Upload Result .jsonl
					<input
						type="file"
						accept=".jsonl"
						hidden
						onChange={handleFileUpload}
					/>
				</Button>
				{jsonlError && (
					<Alert severity="error" sx={{mt: 2}}>
						{jsonlError}
					</Alert>
				)}
				{csvRows.length > 0 && (
					<Box sx={{mt: 3}}>
						<Typography variant="h6">Parsed Results (CSV Table)</Typography>
						<Box sx={{display: "flex", gap: 2, mb: 1}}>
							<Button variant="outlined" size="small" onClick={handleCopy}>
								Copy CSV
							</Button>
							<Button variant="outlined" size="small" onClick={handleDownload}>
								Download CSV
							</Button>
						</Box>
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>custom_id</TableCell>
										<TableCell>content</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{csvRows.map((row, idx) => (
										<TableRow key={idx}>
											<TableCell>{row[0]}</TableCell>
											<TableCell style={{whiteSpace: "pre-wrap"}}>
												{row[1]}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				)}
				<Snackbar
					open={snackbarOpen}
					autoHideDuration={2000}
					onClose={() => setSnackbarOpen(false)}
					message="Copied to clipboard!"
					anchorOrigin={{vertical: "bottom", horizontal: "center"}}
				/>
			</Paper>
		</Container>
	)
}

export default ResultReader
