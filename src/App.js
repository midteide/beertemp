import React, { useEffect, useState } from 'react'
import Highcharts, { getDeferredAnimation } from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

// const SERVER = "http://192.168.0.192:5000";
const SERVER =
	'https://1h8op8bex9.execute-api.eu-west-1.amazonaws.com/deploytest'

const options = {
	chart: {
		type: 'spline',
	},
	title: {
		text: 'My chart',
	},
	series: [
		{
			data: [1, 2, 1, 4, 3, 6],
		},
	],
}

function App() {
	const [logEntries, setlogEntries] = useState()
	const [batches, setbatches] = useState()
	const [graphData, setgraphData] = useState(options)
	var date = new Date()

	console.log('Date: ', date.toLocaleString())

	const fetchLogEntries = () => {
		let URL = SERVER + '/logentries'
		fetch(URL, {
			crossDomain: true,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				batchId: 1,
				// Authorization: token
			},
		})
			.then((response) => {
				// console.log("LogEntries response", response);
				return response.json()
			})
			.then((data) => {
				// console.log("LogEntries data: ", data);
				setlogEntries(data)
			})
			.catch((error) => {
				console.error('LogEntries Error:', error)
			})
	}

	useEffect(() => {
		fetchLogEntries()
		setInterval(() => {
			fetchLogEntries()
		}, 300000)
	}, [])

	const fetchBatches = () => {
		let URL = SERVER + '/batches'
		fetch(URL, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				batchId: 1,
				// Authorization: token
			},
		})
			.then((response) => {
				// console.log("LogEntries response", response);
				return response.json()
			})
			.then((data) => {
				// console.log("LogEntries data: ", data);
				setbatches(data)
			})
			.catch((error) => {
				console.error('Batches Error:', error)
			})
	}
	useEffect(() => {
		fetchBatches()
	}, [setbatches])

	useEffect(() => {
		if (batches?.length) {
			console.log('batches STATE: ', batches)
		}
	}, [batches])

	const getStartDate = () => {
		let d = new Date()
		d.setDate(d.getDate() - 1)
		//d.setTime(d.getTime() + 2 * 60 * 60 * 1000);
		console.log('getStartDate ', d.getTime())
		let d2 = new Date()
		console.log('Timenow: ', d2.getTime())
		return d.getTime()
	}

	const getEndDate = () => {
		let d = new Date()
		d.setTime(d.getTime() + 2 * 60 * 60 * 1000)
		console.log('ALEXX: ', d.getTime())
		return d.getTime()
	}

	const getData = (value) => {
		// console.log('XX: ', { year, month, day, hour, minute, second })
		// console.log({ finalDate })

		let temp = logEntries
		temp = temp.map((entry, index) => {
			let retValue = 0
			// let t = entry.submitted_date
			// let u = new Date(t.toLocaleString())
			// u.setTime(u.getTime() + 2 * 60 * 60 * 1000)

			let raw = entry.submitted_date
			let rawSplit = raw.split('-')
			let year = parseInt(rawSplit[0])
			let month = parseInt(rawSplit[1]) - 1
			let t = rawSplit[2].split(' ')
			let day = t[0]
			t = t[1].split(':')
			let hour = t[0]
			let minute = t[1]
			let second = t[2]
			let finalDate = Date.UTC(year, month, day, hour, minute, second)

			switch (value) {
				case 'currentTemperature':
					retValue = parseFloat(entry.currentTemperature)
					break

				case 'targetTemperature':
					retValue = parseFloat(entry.targetTemperature)
					break

				case 'fridgeStatus':
					retValue = entry.fridge_on === 'True' ? 10 : 0
					break
				default:
			}

			// console.log(index, u);
			return [finalDate, retValue]
		})
		return temp
	}

	useEffect(() => {
		if (logEntries?.length > 1) {
			console.log('LogEntries STATE: ', logEntries)
			setgraphData({
				chart: {
					scrollablePlotArea: {
						minWidth: 700,
					},
				},
				title: {
					text: 'Beer fermentation temperatures',
				},

				subtitle: {
					text: 'Øl description her',
				},
				xAxis: {
					type: 'datetime',
					//Sets tickInterval to 24 * 3600 * 1000 if display is by day
					dateTimeLabelFormats: {
						hour: '%H',
					},
					tickInterval: 1000 * 3600, // tick every  hour
					// categories: logEntries.map((entry) => new Date(entry.submitted_date)),
					min: getStartDate(),
					max: getEndDate(),
					// startOnTick: true,
					// endOnTick: true,
				},

				yAxis: {
					title: {
						text: 'Temperature (°C)',
					},
				},
				// plotOptions: {
				//   line: {
				//     dataLabels: {
				//       enabled: false,
				//     },
				//     enableMouseTracking: true,
				//   },
				// },
				legend: {
					enabled: true,
				},
				plotOptions: {
					area: {
						fillColor: {
							linearGradient: {
								x1: 0,
								y1: 0,
								x2: 0,
								y2: 1,
							},
							stops: [
								[0, Highcharts.getOptions().colors[0]],
								[
									1,
									Highcharts.color(Highcharts.getOptions().colors[0])
										.setOpacity(0)
										.get('rgba'),
								],
							],
						},
						marker: {
							radius: 2,
						},
						lineWidth: 1,
						states: {
							hover: {
								lineWidth: 1,
							},
						},
						threshold: null,
					},
				},

				series: [
					{
						// mapData: logEntries.map((entry) => {
						//   var date = new Date(entry.submitted_date);

						//   // console.log("Date: ", date.toLocaleString());
						//   // parseFloat(entry.submitted_date)
						//   return date;
						//   // return entry.submitted_date;
						// }),
						type: 'area',
						data: getData('currentTemperature'),
						name: 'Actual temperature',
					},
					{
						color: 'green',
						data: getData('targetTemperature'),
						name: 'Target temperature',
					},
					{
						data: getData('fridgeStatus'),
						name: 'Fridge status (0 = off)',
						color: 'red',
					},
				],
				turboThreshold: 20000,
			})
		}
	}, [logEntries])

	return (
		<div className="App">
			<h1 style={{ textAlign: 'center' }}>Fridge temperature log</h1>
			<HighchartsReact
				containerProps={{ style: { height: '80vh' } }}
				highcharts={Highcharts}
				options={graphData}
			/>
			<h1>Log entries:</h1>
			<ul>{logEntries?.length && <li> Hei {logEntries?.length}</li>}</ul>
			<ul>
				{logEntries?.length &&
					logEntries.map((entry, index) => (
						<li key={entry.id}>
							{' '}
							Id: {entry.id}, Date: {entry.submitted_date}, Temp:{' '}
							{entry.temperature}
						</li>
					))}
			</ul>
		</div>
	)
}

export default App
{
	/* logEntries.map((entry, index) => <li key={entry.id}>A: {entry}</li>)} */
}
