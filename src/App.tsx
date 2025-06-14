import BatchCreator from "./components/BatchCreator"
import ResultReader from "./components/ResultReader"
import {Tabs, Tab, Box} from "@mui/material"
import {useState} from "react"

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
		</Box>
	)
}

export default App
