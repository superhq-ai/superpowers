import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Portal = ({ children }: { children: React.ReactNode }) => {
	const [container, setContainer] = useState<Element | null>(null);

	useEffect(() => {
		setContainer(document.getElementById("portal-root"));
	}, []);

	return container ? createPortal(children, container) : null;
};

export default Portal;
