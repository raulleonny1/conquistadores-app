"use client";
import { Suspense } from "react";

// Minimal placeholder for App component
const App = () => {
  return <div>Dashboard en construcción...</div>;
};

const AppWrapper = () => (
	<Suspense fallback={<div className="text-center mt-10 text-lg text-indigo-700">Cargando datos...</div>}>
		<App />
	</Suspense>
);

export default AppWrapper;
