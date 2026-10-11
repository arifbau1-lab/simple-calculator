const display = document.querySelector("#display");
const expression = document.querySelector("#expression");
const splash = document.querySelector("#splash");

let expressionValue = "";
let displayValue = "0";
let completedExpression = "";
let justEvaluated = false;

window.addEventListener("load", () => {
  window.setTimeout(() => splash.classList.add("hidden"), 1200);
});

function updateDisplay() {
  display.textContent = displayValue;
  expression.textContent = completedExpression || formatExpression(expressionValue);
}

function formatExpression(value) {
  return value.replaceAll("*", "×").replaceAll("/", "÷").replaceAll("-", "−");
}

function formatResult(value) {
  if (!Number.isFinite(value)) throw new Error("Invalid result");
  return String(Number(value.toPrecision(12)));
}

function lastNumber() {
  return expressionValue.match(/(?:^|[+*/%(-])(-?\d*\.?\d*)$/)?.[1] || "";
}

function inputNumber(value) {
  if (justEvaluated) {
    expressionValue = "";
    completedExpression = "";
    justEvaluated = false;
  }

  const number = lastNumber();
  if (value === "." && number.includes(".")) return;
  if (value !== "." && number === "0") {
    expressionValue = expressionValue.slice(0, -1);
  }
  if (number.length < 16) expressionValue += value;
  displayValue = lastNumber() || "0";
  updateDisplay();
}

function inputBracket(bracket) {
  if (justEvaluated) {
    expressionValue = "";
    completedExpression = "";
    justEvaluated = false;
  }

  const previous = expressionValue.slice(-1);
  if (bracket === "(") {
    if (/\d|\)/.test(previous)) expressionValue += "*";
    expressionValue += "(";
  } else if (bracket === ")" && openBracketCount() > 0 && /[\d)]/.test(previous)) {
    expressionValue += ")";
  }
  displayValue = lastNumber() || "0";
  updateDisplay();
}

function openBracketCount() {
  return (expressionValue.match(/\(/g) || []).length -
    (expressionValue.match(/\)/g) || []).length;
}

function inputOperation(operation) {
  if (!expressionValue && operation === "-") {
    expressionValue = "-";
  } else if (/[+\-*/%]$/.test(expressionValue)) {
    expressionValue = expressionValue.slice(0, -1) + operation;
  } else if (expressionValue && /[\d)]$/.test(expressionValue)) {
    expressionValue += operation;
  }
  justEvaluated = false;
  completedExpression = "";
  updateDisplay();
}

function tokenize(value) {
  return value.match(/(?:\d+(?:\.\d*)?|\.\d+|[()+\-*/%])/g) || [];
}

function evaluateExpression(value) {
  const tokens = tokenize(value);
  let position = 0;

  function parseExpression() {
    let result = parseTerm();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const operation = tokens[position++];
      const right = parseTerm();
      result = operation === "+" ? result + right : result - right;
    }
    return result;
  }

  function parseTerm() {
    let result = parseFactor();
    while (["*", "/", "%"].includes(tokens[position])) {
      const operation = tokens[position++];
      const right = parseFactor();
      if ((operation === "/" || operation === "%") && right === 0) {
        throw new Error("Division by zero");
      }
      if (operation === "*") result *= right;
      if (operation === "/") result /= right;
      if (operation === "%") result %= right;
    }
    return result;
  }

  function parseFactor() {
    if (tokens[position] === "-") {
      position++;
      return -parseFactor();
    }
    if (tokens[position] === "(") {
      position++;
      const result = parseExpression();
      if (tokens[position++] !== ")") throw new Error("Unclosed bracket");
      return result;
    }
    const number = Number(tokens[position++]);
    if (Number.isNaN(number)) throw new Error("Invalid expression");
    return number;
  }

  const result = parseExpression();
  if (position !== tokens.length || !tokens.length) throw new Error("Invalid expression");
  return result;
}

function evaluate() {
  if (!expressionValue || openBracketCount() !== 0) return showError();
  try {
    const result = formatResult(evaluateExpression(expressionValue));
    completedExpression = `${formatExpression(expressionValue)} =`;
    displayValue = result;
    justEvaluated = true;
    updateDisplay();
  } catch {
    showError();
  }
}

function showError() {
  expressionValue = "";
  completedExpression = "";
  displayValue = "Error";
  justEvaluated = true;
  updateDisplay();
}

function clear() {
  expressionValue = "";
  completedExpression = "";
  displayValue = "0";
  justEvaluated = false;
  updateDisplay();
}

function deleteLast() {
  if (justEvaluated || displayValue === "Error") return clear();
  expressionValue = expressionValue.slice(0, -1);
  displayValue = lastNumber() || "0";
  updateDisplay();
}

document.querySelector(".keys").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.number) inputNumber(button.dataset.number);
  if (button.dataset.operation) inputOperation(button.dataset.operation);
  if (button.dataset.bracket) inputBracket(button.dataset.bracket);
  if (button.dataset.action === "equals") evaluate();
  if (button.dataset.action === "clear") clear();
  if (button.dataset.action === "delete") deleteLast();
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key) || event.key === ".") inputNumber(event.key);
  else if (["+", "-", "*", "/", "%"].includes(event.key)) inputOperation(event.key);
  else if (event.key === "(" || event.key === ")") inputBracket(event.key);
  else if (event.key === "Enter" || event.key === "=") evaluate();
  else if (event.key === "Backspace") deleteLast();
  else if (event.key === "Escape") clear();
});
