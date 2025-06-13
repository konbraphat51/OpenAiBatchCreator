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
	{key: "model", label: "Model", type: "text"},
	{
		key: "frequency_penalty",
		label: "Frequency Penalty",
		type: "number",
		min: -2.0,
		max: 2.0,
		step: 0.1,
		default: 0.0,
	},
	{
		key: "logprobs",
		label: "Logprobs",
		type: "boolean",
		default: false,
	},
	{
		key: "max_completion_tokens",
		label: "Max Completion Tokens",
		type: "number",
	},
	{
		key: "presence_penalty",
		label: "Presence Penalty",
		type: "number",
		min: -2.0,
		max: 2.0,
		step: 0.1,
		default: 0.0,
	},
	{
		key: "reasoning_effort",
		label: "Reasoning Effort",
		type: "enum",
		options: [null, "low", "medium", "high"],
		default: "medium",
	},
	{
		key: "seed",
		label: "Seed",
		type: "integer",
		step: 1,
		default: null,
	},
	{
		key: "temperature",
		label: "Temperature",
		type: "number",
		min: 0.0,
		max: 2.0,
		step: 0.1,
		default: 1.0,
	},
	{
		key: "top_p",
		label: "Top P",
		type: "number",
		min: 0.0,
		max: 1.0,
		step: 0.1,
		default: 1.0,
	},
	{
		key: "top_logprobs",
		label: "Top Logprobs",
		type: "integer",
		min: 0,
		max: 20,
		step: 1,
		default: 10,
	},
]

const defaultParams: Record<string, any> = {
	model: "o4-mini",
	frequency_penalty: 0.0,
	logprobs: false,
	presence_penalty: 0.0,
	reasoning_effort: "medium",
	seed: null,
	temperature: 1.0,
	top_p: 1.0,
	top_logprobs: 10,
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
									{param.type === "select" &&
									Array.isArray((param as any).options) ? (
										<FormControl fullWidth>
											<InputLabel>{param.label}</InputLabel>
											<Select
												value={params[param.key] ?? ""}
												label={param.label}
												onChange={(e) =>
													handleParamChange(param.key, e.target.value)
												}
											>
												{(param as any).options.map((opt: string) => (
													<MenuItem value={opt} key={opt}>
														{opt}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									) : param.type === "boolean" ? (
										<FormControl fullWidth>
											<InputLabel>{param.label}</InputLabel>
											<Select
												value={
													params[param.key] === true
														? "true"
														: params[param.key] === false
														? "false"
														: ""
												}
												label={param.label}
												onChange={(e) =>
													handleParamChange(
														param.key,
														e.target.value === "true",
													)
												}
											>
												<MenuItem value="true">true</MenuItem>
												<MenuItem value="false">false</MenuItem>
											</Select>
										</FormControl>
									) : param.type === "enum" ? (
										<FormControl fullWidth>
											<InputLabel>{param.label}</InputLabel>
											<Select
												value={params[param.key] ?? param.default ?? ""}
												label={param.label}
												onChange={(e) =>
													handleParamChange(
														param.key,
														e.target.value === "null" ? null : e.target.value,
													)
												}
											>
												{(param.options || []).map((opt: string | null) => (
													<MenuItem
														value={opt === null ? "null" : opt}
														key={opt === null ? "null" : opt}
													>
														{opt === null ? "null" : opt}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									) : (
										<TextField
											label={param.label}
											type={param.type === "integer" ? "number" : param.type}
											value={params[param.key] ?? ""}
											onChange={(e) =>
												handleParamChange(
													param.key,
													param.type === "number" || param.type === "integer"
														? e.target.value === ""
															? ""
															: param.type === "integer"
															? parseInt(e.target.value)
															: Number(e.target.value)
														: e.target.value,
												)
											}
											fullWidth
											inputProps={{
												...(param.min !== undefined ? {min: param.min} : {}),
												...(param.max !== undefined ? {max: param.max} : {}),
												...(param.step !== undefined ? {step: param.step} : {}),
											}}
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
