import BatchCreator from "./components/BatchCreator"
import ResultReader from "./components/ResultReader"
import {Tabs, Tab, Box, Typography, Link} from "@mui/material"
import {useState} from "react"

const Footer: React.FC = () => (
	<Box sx={{mt: 6, mb: 2, textAlign: "center", color: "#888"}}>
		<Typography variant="body2">
			© {new Date().getFullYear()} GitHub@
			<Link
				href="https://github.com/konbraphat51"
				target="_blank"
				rel="noopener"
				underline="hover"
			>
				{" "}
				konbraphat51
			</Link>
			{" | "}
			<Link
				href="https://github.com/konbraphat51/OpenAiBatchCreator"
				target="_blank"
				rel="noopener"
				underline="hover"
			>
				GitHub Repository
			</Link>
		</Typography>
	</Box>
)

const App: React.FC = () => {
	const [tab, setTab] = useState(0)
	return (
		<Box>
			<Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{mb: 3}}>
				<Tab label="Batch Creator" />
				<Tab label="Read Result" />
			</Tabs>
			{tab === 0 && <BatchCreator />}
			{tab === 1 && <ResultReader />}
			<Footer />
		</Box>
	)
}

export default App
