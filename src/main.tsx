import { Analytics } from '@vercel/analytics/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { Route, RouterProvider, createRoutesFromElements } from 'react-router'
import { createBrowserRouter } from 'react-router-dom'
import { BackupRoute } from './pages/root-2'
import './styles.css'

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path="/">
			<Route index lazy={() => import('./pages/root')} />
			<Route path="backup" element={<BackupRoute />} />
		</Route>
	)
)

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<HelmetProvider>
			<RouterProvider router={router} />
			<Analytics />
		</HelmetProvider>
	</React.StrictMode>
)
