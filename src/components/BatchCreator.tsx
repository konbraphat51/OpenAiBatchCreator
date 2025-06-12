import React, {useState} from "react"
import {
	Container,
	Typography,
	Paper,
	TextField,
	Button,
	InputLabel,
	MenuItem,
	Select,
	FormControl,
	Box,
	Divider,
	Alert,
} from "@mui/material"
import Grid from "@mui/material/Grid"
import Papa from "papaparse"
import type {ParseResult} from "papaparse"
import {saveAs} from "file-saver"

const OPENAI_PARAMS = [
	{
		key: "model",
		label: "Model",
		type: "select",
		options: ["gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o"],
	},
	{key: "frequency_penalty", label: "Frequency Penalty", type: "number"},
	{key: "logit_bias", label: "Logit Bias (JSON)", type: "text"},
	{key: "logprobs", label: "Logprobs", type: "number"},
	{
		key: "max_completion_tokens",
		label: "Max Completion Tokens",
		type: "number",
	},
	{key: "presence_penalty", label: "Presence Penalty", type: "number"},
	{key: "reasoning_effort", label: "Reasoning Effort", type: "number"},
	{key: "seed", label: "Seed", type: "number"},
	{key: "temperature", label: "Temperature", type: "number"},
	{key: "top_p", label: "Top P", type: "number"},
	{key: "top_logprobs", label: "Top Logprobs", type: "number"},
]

const defaultParams: Record<string, any> = {
	model: "gpt-3.5-turbo",
}

const BatchCreator: React.FC = () => {
	const [systemPrompt, setSystemPrompt] = useState("")
	const [userPrompt, setUserPrompt] = useState("")
	const [params, setParams] = useState<Record<string, any>>(defaultParams)
	const [csvHeaders, setCsvHeaders] = useState<string[]>([])
	const [csvRows, setCsvRows] = useState<string[][]>([])
	const [csvError, setCsvError] = useState<string | null>(null)
	const [successMsg, setSuccessMsg] = useState<string | null>(null)

	const handleParamChange = (key: string, value: any) => {
		setParams((prev) => ({...prev, [key]: value}))
	}

	const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCsvError(null)
		setSuccessMsg(null)
		const file = e.target.files?.[0]
		if (!file) return
		Papa.parse(file, {
			complete: (results: ParseResult<string[]>) => {
				if (!results.data || results.data.length < 2) {
					setCsvError("CSV must have at least a header and one row.")
					return
				}
				const headers = results.data[0] as string[]
				const rows = (results.data as string[][])
					.slice(1)
					.filter((r) => r.length && r.some((cell) => cell !== ""))
				setCsvHeaders(headers)
				setCsvRows(rows)
			},
			error: (err: Error) => setCsvError("CSV parse error: " + err.message),
		})
	}

	const generatePrompt = (
		base: string,
		headers: string[],
		values: string[],
	) => {
		let prompt = base
		headers.forEach((header, idx) => {
			const re = new RegExp(`\\{${header}\\}`, "g")
			prompt = prompt.replace(re, values[idx] ?? "")
		})
		return prompt
	}

	const handleCreate = () => {
		setSuccessMsg(null)
		if (!systemPrompt || !userPrompt) {
			setCsvError("System and user prompts are required.")
			return
		}
		if (!csvHeaders.length || !csvRows.length) {
			setCsvError("CSV data is required.")
			return
		}
		setCsvError(null)
		const lines = csvRows.map((row) => {
			const sys = generatePrompt(systemPrompt, csvHeaders, row)
			const user = generatePrompt(userPrompt, csvHeaders, row)
			const messages = [
				{role: "system", content: sys},
				{role: "user", content: user},
			]
			// Build request object according to OpenAI API spec
			const req: any = {
				messages,
				...params,
			}
			// Parse logit_bias if present
			if (typeof req.logit_bias === "string" && req.logit_bias.trim()) {
				try {
					req.logit_bias = JSON.parse(req.logit_bias)
				} catch {
					req.logit_bias = undefined
				}
			}
			return JSON.stringify(req)
		})
		const blob = new Blob([lines.join("\n")], {type: "application/jsonl"})
		saveAs(blob, "openai_batch.jsonl")
		setSuccessMsg("Batch file created and downloaded!")
	}

	return (
		<Container maxWidth="md" sx={{py: 4}}>
			<Paper elevation={3} sx={{p: 4}}>
				<Typography variant="h4" gutterBottom>
					OpenAI Batch Creator
				</Typography>
				<Divider sx={{mb: 3}} />
				<Grid container spacing={3}>
					<Grid {...{item: true, xs: 12, md: 6}}>
						<TextField
							label="Base System Prompt"
							value={systemPrompt}
							onChange={(e) => setSystemPrompt(e.target.value)}
							fullWidth
							multiline
							minRows={2}
							sx={{mb: 2}}
						/>
						<TextField
							label="Base User Prompt"
							value={userPrompt}
							onChange={(e) => setUserPrompt(e.target.value)}
							fullWidth
							multiline
							minRows={2}
							sx={{mb: 2}}
						/>
						<Button variant="contained" component="label" sx={{mt: 1}}>
							Upload CSV
							<input
								type="file"
								accept=".csv"
								hidden
								onChange={handleCsvUpload}
							/>
						</Button>
						{csvHeaders.length > 0 && (
							<Box sx={{mt: 2}}>
								<Typography variant="body2" color="text.secondary">
									CSV headers: {csvHeaders.join(", ")}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Rows: {csvRows.length}
								</Typography>
							</Box>
						)}
					</Grid>
					<Grid {...{item: true, xs: 12, md: 6}}>
						<Typography variant="h6" gutterBottom>
							Parameters
						</Typography>
						<Grid container spacing={2}>
							{OPENAI_PARAMS.map((param) => (
								<Grid
									{...{
										item: true,
										xs: 12,
										sm: param.type === "select" ? 12 : 6,
										key: param.key,
									}}
								>
									{param.type === "select" && param.options ? (
										<FormControl fullWidth>
											<InputLabel>{param.label}</InputLabel>
											<Select
												value={params[param.key] ?? ""}
												label={param.label}
												onChange={(e) =>
													handleParamChange(param.key, e.target.value)
												}
											>
												{param.options.map((opt: string) => (
													<MenuItem value={opt} key={opt}>
														{opt}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									) : (
										<TextField
											label={param.label}
											type={param.type}
											value={params[param.key] ?? ""}
											onChange={(e) =>
												handleParamChange(param.key, e.target.value)
											}
											fullWidth
										/>
									)}
								</Grid>
							))}
						</Grid>
					</Grid>
				</Grid>
				<Divider sx={{my: 3}} />
				{csvError && (
					<Alert severity="error" sx={{mb: 2}}>
						{csvError}
					</Alert>
				)}
				{successMsg && (
					<Alert severity="success" sx={{mb: 2}}>
						{successMsg}
					</Alert>
				)}
				<Button
					variant="contained"
					color="primary"
					size="large"
					onClick={handleCreate}
					disabled={!csvRows.length || !systemPrompt || !userPrompt}
				>
					Create
				</Button>
			</Paper>
		</Container>
	)
}

export default BatchCreator
