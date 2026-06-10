export const waait = () =>
  new Promise((res) => setTimeout(res, Math.random() * 800));

// local storage
export const fetchData = (key) => {
  return JSON.parse(localStorage.getItem(key));
};

// delete item
export const deleteItem = ({ key }) => {
  return localStorage.removeItem(key);
};

// formatting date
export const formatDateToLocaleString = (epoch) =>
  new Date(epoch).toLocaleDateString("en-GB");

// formatting percentages
export const formatPercentage = (amt) => {
  return amt.toLocaleString(undefined, {
    style: "percent",

    minimumFractionDigits: 0,
  });
};

// format currency
export const formatCurrency = (amt) => {
  return Number(amt).toLocaleString(undefined, {
    style: "currency",

    currency: "INR",
  });
};

export const formatCompactCurrency = (amt) => {
  const num = Number(amt);
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);

  if (abs < 1000) {
    return `${sign}₹${abs.toLocaleString("en-IN")}`;
  }

  if (abs < 100000) {
    return `${sign}₹${parseFloat((abs / 1000).toFixed(1))}K`;
  }

  if (abs < 10000000) {
    return `${sign}₹${parseFloat((abs / 100000).toFixed(1))}L`;
  }

  if (abs < 1000000000000) {
    return `${sign}₹${(abs / 10000000).toLocaleString("en-IN", {
      maximumFractionDigits: 1,
    })}Cr`;
  }

  return `${sign}₹${parseFloat((abs / 1000000000000).toFixed(1))}T`;
};