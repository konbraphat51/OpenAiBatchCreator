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
} from "@mui/material"

const ResultReader: React.FC = () => {
	const [jsonlError, setJsonlError] = useState<string | null>(null)
	const [jsonResult, setJsonResult] = useState<string | null>(null)
	const [snackbarOpen, setSnackbarOpen] = useState(false)

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		setJsonlError(null)
		setJsonResult(null)
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = (event) => {
			try {
				const text = event.target?.result as string
				const lines = text.split(/\r?\n/).filter(Boolean)
				const results: {custom_id: string; content: string}[] = []
				for (const line of lines) {
					try {
						const obj = JSON.parse(line)
						const custom_id = obj.custom_id
						const content = obj.response?.body?.choices?.[0]?.message?.content
						if (custom_id && typeof content === "string") {
							results.push({custom_id, content})
						}
					} catch (err) {
						// skip invalid lines
					}
				}
				setJsonResult(JSON.stringify({results}, null, 2))
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
			const blob = new Blob([jsonResult], {type: "application/json"})
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = "results.json"
			document.body.appendChild(a)
			a.click()
			setTimeout(() => {
				URL.revokeObjectURL(url)
				document.body.removeChild(a)
			}, 0)
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
				{jsonResult && (
					<Box sx={{mt: 3}}>
						<Typography variant="h6">Parsed Results</Typography>
						<Box sx={{display: "flex", gap: 2, mb: 1}}>
							<Button variant="outlined" size="small" onClick={handleCopy}>
								Copy
							</Button>
							<Button variant="outlined" size="small" onClick={handleDownload}>
								Download JSON
							</Button>
						</Box>
						<pre
							style={{
								textAlign: "left",
								background: "#f5f5f5",
								padding: 16,
								borderRadius: 4,
								overflowX: "auto",
							}}
						>
							{jsonResult}
						</pre>
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
