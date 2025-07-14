const ALLOWED_TAGS = [
	"a",
	"img",
	"button",
	"input",
	"textarea",
	"select",
	"table",
	"tr",
	"td",
	"th",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"p",
	"ul",
	"ol",
	"li",
	"code",
	"pre",
];
const ALLOWED_INPUT_TYPES = [
	"text",
	"search",
	"email",
	"password",
	"url",
	"tel",
	"checkbox",
	"radio",
];
const LANGUAGE_CLASS_REGEX = /language-(\w+)/;
const WHITESPACE_REGEX = /\s+/g;

export default function domToMarkdown(node: Node): string {
	const results: string[] = [];

	const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, {
		acceptNode: (node) => {
			const element = node as Element;
			const tagName = element.tagName.toLowerCase();

			// Only process specific elements
			if (!ALLOWED_TAGS.includes(tagName)) {
				return NodeFilter.FILTER_SKIP;
			}

			// Skip hidden elements
			const style = window.getComputedStyle(element);
			if (style.display === "none" || style.visibility === "hidden") {
				return NodeFilter.FILTER_REJECT;
			}

			return NodeFilter.FILTER_ACCEPT;
		},
	});

	function getText(element: Element): string {
		return element.textContent?.trim().replace(WHITESPACE_REGEX, " ") || "";
	}

	function getCodeText(element: Element): string {
		// For code elements, preserve formatting and whitespace
		return element.textContent || "";
	}

	function getSelectors(element: Element): string {
		const selectors: string[] = [];

		// Add ID
		if (element.id) {
			selectors.push(`id="${element.id}"`);
		}

		// Add classes
		if (element.className && typeof element.className === "string") {
			const classes = element.className
				.trim()
				.split(WHITESPACE_REGEX)
				.filter((c) => c);
			if (classes.length > 0) {
				selectors.push(`class="${classes.join(" ")}"`);
			}
		}

		// Add name attribute
		const name = element.getAttribute("name");
		if (name) {
			selectors.push(`name="${name}"`);
		}

		// Add title attribute
		const title = element.getAttribute("title");
		if (title) {
			selectors.push(`title="${title}"`);
		}

		// Add ARIA attributes
		const ariaLabel = element.getAttribute("aria-label");
		if (ariaLabel) {
			selectors.push(`aria-label="${ariaLabel}"`);
		}

		const ariaRole = element.getAttribute("role");
		if (ariaRole) {
			selectors.push(`role="${ariaRole}"`);
		}

		const ariaDescribedBy = element.getAttribute("aria-describedby");
		if (ariaDescribedBy) {
			selectors.push(`aria-describedby="${ariaDescribedBy}"`);
		}

		return selectors.length > 0 ? ` {${selectors.join(", ")}}` : "";
	}

	// Track processed lists to avoid duplicates
	const processedLists = new Set<Element>();

	let currentNode = walker.currentNode as Element;
	while (currentNode) {
		const tagName = currentNode.tagName.toLowerCase();

		switch (tagName) {
			case "h1":
			case "h2":
			case "h3":
			case "h4":
			case "h5":
			case "h6": {
				const headingText = getText(currentNode);
				if (headingText) {
					const level = parseInt(tagName.slice(1));
					const prefix = "#".repeat(level);
					const selectors = getSelectors(currentNode);
					results.push(`${prefix} ${headingText}${selectors}`);
				}
				break;
			}

			case "p": {
				const paragraphText = getText(currentNode);
				if (paragraphText) {
					const selectors = getSelectors(currentNode);
					results.push(`${paragraphText}${selectors}`);
				}
				break;
			}

			case "a": {
				const href = currentNode.getAttribute("href");
				const linkText = getText(currentNode);
				if (href && linkText) {
					const selectors = getSelectors(currentNode);
					results.push(`[${linkText}](${href})${selectors}`);
				}
				break;
			}

			case "img": {
				const src = currentNode.getAttribute("src");
				const alt = currentNode.getAttribute("alt") || "";
				if (src) {
					const selectors = getSelectors(currentNode);
					results.push(`![${alt}](${src})${selectors}`);
				}
				break;
			}

			case "button": {
				const buttonText = getText(currentNode);
				if (buttonText) {
					const disabled = currentNode.hasAttribute("disabled")
						? " [DISABLED]"
						: "";
					const selectors = getSelectors(currentNode);
					results.push(`[BUTTON] ${buttonText}${disabled}${selectors}`);
				}
				break;
			}

			case "input": {
				const inputType = currentNode.getAttribute("type") || "text";

				if (ALLOWED_INPUT_TYPES.includes(inputType)) {
					const disabled = currentNode.hasAttribute("disabled")
						? " [DISABLED]"
						: "";
					const selectors = getSelectors(currentNode);

					if (inputType === "checkbox") {
						const checked = (currentNode as HTMLInputElement).checked
							? " [CHECKED]"
							: " [UNCHECKED]";
						const value = currentNode.getAttribute("value") || "";
						let checkboxStr = `[CHECKBOX]${checked}${disabled}`;
						if (value) checkboxStr += ` value:"${value}"`;
						checkboxStr += selectors;
						results.push(checkboxStr);
					} else if (inputType === "radio") {
						const checked = (currentNode as HTMLInputElement).checked
							? " [SELECTED]"
							: " [UNSELECTED]";
						const name = currentNode.getAttribute("name") || "";
						const value = currentNode.getAttribute("value") || "";
						let radioStr = `[RADIO${name ? `:${name}` : ""}]${checked}${disabled}`;
						if (value) radioStr += ` value:"${value}"`;
						radioStr += selectors;
						results.push(radioStr);
					} else {
						const placeholder = currentNode.getAttribute("placeholder") || "";
						const value = (currentNode as HTMLInputElement).value || "";

						let inputStr = `[INPUT:${inputType}]`;
						if (placeholder) inputStr += ` placeholder:"${placeholder}"`;
						if (value) inputStr += ` value:"${value}"`;
						inputStr += disabled + selectors;

						results.push(inputStr);
					}
				}
				break;
			}

			case "textarea": {
				const textareaPlaceholder =
					currentNode.getAttribute("placeholder") || "";
				const textareaValue = (currentNode as HTMLTextAreaElement).value || "";
				const textareaDisabled = currentNode.hasAttribute("disabled")
					? " [DISABLED]"
					: "";
				const textareaSelectors = getSelectors(currentNode);

				let textareaStr = "[TEXTAREA]";
				if (textareaPlaceholder)
					textareaStr += ` placeholder:"${textareaPlaceholder}"`;
				if (textareaValue) textareaStr += ` value:"${textareaValue}"`;
				textareaStr += textareaDisabled + textareaSelectors;

				results.push(textareaStr);
				break;
			}

			case "select": {
				const selectDisabled = currentNode.hasAttribute("disabled")
					? " [DISABLED]"
					: "";
				const selectMultiple = currentNode.hasAttribute("multiple")
					? " [MULTIPLE]"
					: "";
				const selectSelectors = getSelectors(currentNode);

				let selectStr = `[SELECT]${selectMultiple}${selectDisabled}${selectSelectors}`;
				const options = Array.from(currentNode.querySelectorAll("option"));

				if (options.length > 0) {
					const optionsList = options
						.map((option) => {
							const optionText = getText(option);
							const selected = option.selected ? " [SELECTED]" : "";
							return `  - ${optionText}${selected}`;
						})
						.join("\n");

					selectStr += `\n${optionsList}`;
				}

				results.push(selectStr);
				break;
			}

			case "table": {
				const tableStr = processTable(currentNode as HTMLTableElement);
				if (tableStr) {
					results.push(tableStr);
				}
				break;
			}

			case "ul":
			case "ol":
				// Only process if we haven't already processed this list
				if (!processedLists.has(currentNode)) {
					const listStr = processList(
						currentNode as HTMLUListElement | HTMLOListElement,
					);
					if (listStr) {
						results.push(listStr);
					}
					processedLists.add(currentNode);
				}
				break;

			case "li":
				// Skip individual li elements since they're handled by processList
				break;

			case "code": {
				const codeText = getCodeText(currentNode);
				if (codeText) {
					const selectors = getSelectors(currentNode);
					// Check if this is inline code (not inside a pre tag)
					const isInPre = currentNode.closest("pre") !== null;
					if (!isInPre) {
						results.push(`\`${codeText}\`${selectors}`);
					}
				}
				break;
			}

			case "pre": {
				const preText = getCodeText(currentNode);
				if (preText) {
					const selectors = getSelectors(currentNode);
					// Check if there's a code element inside
					const codeElement = currentNode.querySelector("code");
					if (codeElement) {
						// Get language from class attribute if available
						const codeClasses = codeElement.className || "";
						const langMatch = codeClasses.match(LANGUAGE_CLASS_REGEX);
						const language = langMatch ? langMatch[1] : "";

						results.push(`\`\`\`${language}\n${preText}\n\`\`\`${selectors}`);
					} else {
						results.push(`\`\`\`\n${preText}\n\`\`\`${selectors}`);
					}
				}
				break;
			}
		}

		currentNode = walker.nextNode() as Element;
	}

	return results.join("\n\n");
}

function processTable(table: HTMLTableElement): string {
	const rows = Array.from(table.querySelectorAll("tr"));
	if (rows.length === 0) return "";

	const tableRows: string[] = [];

	rows.forEach((row, rowIndex) => {
		const cells = Array.from(row.querySelectorAll("td, th"));
		const cellTexts = cells.map((cell) => cell.textContent?.trim() || "");

		if (cellTexts.some((text) => text.length > 0)) {
			tableRows.push("| " + cellTexts.join(" | ") + " |");

			// Add separator after first row if it contains th elements
			if (rowIndex === 0 && row.querySelector("th")) {
				tableRows.push("| " + cellTexts.map(() => "---").join(" | ") + " |");
			}
		}
	});

	return tableRows.length > 0 ? `[TABLE]\n${tableRows.join("\n")}` : "";
}

function processList(
	list: HTMLUListElement | HTMLOListElement,
	depth = 0,
): string {
	const listItems = Array.from(list.children).filter(
		(child) => child.tagName.toLowerCase() === "li",
	);
	if (listItems.length === 0) return "";

	const isOrdered = list.tagName.toLowerCase() === "ol";
	const indent = "  ".repeat(depth);
	const results: string[] = [];

	// Add list header with selectors
	const selectors = getSelectors(list);
	const listType = isOrdered ? "ORDERED_LIST" : "UNORDERED_LIST";
	results.push(`${indent}[${listType}]${selectors}`);

	listItems.forEach((item, index) => {
		const li = item as HTMLLIElement;

		// Get direct text content (not including nested lists)
		const textNodes = Array.from(li.childNodes).filter(
			(node) =>
				node.nodeType === Node.TEXT_NODE ||
				(node.nodeType === Node.ELEMENT_NODE &&
					!["ul", "ol"].includes((node as Element).tagName.toLowerCase())),
		);

		const itemText = textNodes
			.map((node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					return node.textContent?.trim() || "";
				} else {
					return (node as Element).textContent?.trim() || "";
				}
			})
			.join(" ")
			.replace(WHITESPACE_REGEX, " ")
			.trim();

		if (itemText) {
			const bullet = isOrdered ? `${index + 1}.` : "-";
			const itemSelectors = getSelectors(li);
			results.push(`${indent}  ${bullet} ${itemText}${itemSelectors}`);
		}

		// Process nested lists
		const nestedLists = li.querySelectorAll(":scope > ul, :scope > ol");
		nestedLists.forEach((nestedList) => {
			const nestedListStr = processList(
				nestedList as HTMLUListElement | HTMLOListElement,
				depth + 1,
			);
			if (nestedListStr) {
				results.push(nestedListStr);
			}
		});
	});

	return results.join("\n");
}

function getSelectors(element: Element): string {
	const selectors: string[] = [];

	// Add ID
	if (element.id) {
		selectors.push(`id="${element.id}"`);
	}

	// Add classes
	if (element.className && typeof element.className === "string") {
		const classes = element.className
			.trim()
			.split(WHITESPACE_REGEX)
			.filter((c) => c);
		if (classes.length > 0) {
			selectors.push(`class="${classes.join(" ")}"`);
		}
	}

	// Add name attribute
	const name = element.getAttribute("name");
	if (name) {
		selectors.push(`name="${name}"`);
	}

	// Add title attribute
	const title = element.getAttribute("title");
	if (title) {
		selectors.push(`title="${title}"`);
	}

	// Add ARIA attributes
	const ariaLabel = element.getAttribute("aria-label");
	if (ariaLabel) {
		selectors.push(`aria-label="${ariaLabel}"`);
	}

	const ariaRole = element.getAttribute("role");
	if (ariaRole) {
		selectors.push(`role="${ariaRole}"`);
	}

	const ariaDescribedBy = element.getAttribute("aria-describedby");
	if (ariaDescribedBy) {
		selectors.push(`aria-describedby="${ariaDescribedBy}"`);
	}

	return selectors.length > 0 ? ` {${selectors.join(", ")}}` : "";
}
